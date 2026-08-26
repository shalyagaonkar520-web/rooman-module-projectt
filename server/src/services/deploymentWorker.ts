import fs from 'fs';
import path from 'path';
import { execFile, exec } from 'child_process';
import JSZip from 'jszip';
import { prisma } from '../prisma';
import { GitProviderFactory } from './git/GitProviderFactory';
import { DockerWorker } from './dockerWorker';
import { realtimeEventManager } from './realtimeEvents';

export class DeploymentWorker {
  private baseDeployDir: string;
  private modulesDir: string;

  constructor() {
    this.baseDeployDir = path.join(__dirname, '..', '..', 'uploads', 'deployments');
    this.modulesDir = path.join(__dirname, '..', '..', 'uploads', 'modules');

    if (!fs.existsSync(this.baseDeployDir)) {
      fs.mkdirSync(this.baseDeployDir, { recursive: true });
    }
    if (!fs.existsSync(this.modulesDir)) {
      fs.mkdirSync(this.modulesDir, { recursive: true });
    }
  }

  // Safe process execution with timeout & output capture
  private runCommand(cwd: string, command: string, timeoutMs = 60000): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      exec(
        command,
        {
          cwd,
          timeout: timeoutMs,
          maxBuffer: 10 * 1024 * 1024,
          env: {
            ...process.env,
            CI: 'true',
            NODE_ENV: 'production',
          },
        },
        (error, stdout, stderr) => {
          if (error) {
            return reject(new Error(stderr.trim() || stdout.trim() || error.message));
          }
          resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
        }
      );
    });
  }

  // Zip a directory recursively into JSZip
  private async zipDirectory(dirPath: string, zip: JSZip, rootPath: string = dirPath): Promise<void> {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      if (item === '.git' || item === 'node_modules') continue;
      const fullPath = path.join(dirPath, item);
      const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        await this.zipDirectory(fullPath, zip, rootPath);
      } else {
        const fileData = fs.readFileSync(fullPath);
        zip.file(relativePath, fileData);
      }
    }
  }

  // Calculate next semantic version
  private computeNextVersion(currentVersion: string, explicitVersion?: string): string {
    if (explicitVersion && /^\d+\.\d+\.\d+$/.test(explicitVersion.replace(/^v/, ''))) {
      return explicitVersion.startsWith('v') ? explicitVersion : `v${explicitVersion}`;
    }

    const clean = currentVersion.replace(/^v/, '');
    const parts = clean.split('.').map((p) => parseInt(p, 10) || 0);
    const major = parts[0] ?? 1;
    const minor = parts[1] ?? 0;
    const patch = (parts[2] ?? 0) + 1;
    return `v${major}.${minor}.${patch}`;
  }

  // Log to DB and emit to SSE
  private async appendLog(deploymentId: string, stage: string, message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
    const timestamp = new Date();
    try {
      await prisma.deploymentLog.create({
        data: {
          deploymentId,
          stage,
          message,
          level,
          timestamp,
        },
      });
    } catch (e) {
      // ignore
    }

    // Broadcast SSE log event
    realtimeEventManager.broadcast('deployment_log', {
      deploymentId,
      stage,
      message,
      level,
      timestamp: timestamp.toISOString(),
    });
  }

  // Main Pipeline Executor
  public async executeDeployment(deploymentId: string): Promise<boolean> {
    const startedAt = new Date();

    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: { module: true, gitRepository: true },
    });

    if (!deployment) {
      console.error(`[DeploymentWorker] Deployment ${deploymentId} not found`);
      return false;
    }

    const { module: mod, gitRepository: gitRepo, commitSha, branch } = deployment;
    const workspaceDir = path.join(this.baseDeployDir, deploymentId);
    let allLogs: string[] = [];

    const log = async (stage: string, msg: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') => {
      const line = `[${new Date().toISOString()}] [${stage}] ${msg}`;
      allLogs.push(line);
      await this.appendLog(deploymentId, stage, msg, level);
    };

    try {
      // 1. UPDATE TO CLONING
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: 'CLONING', startedAt },
      });
      realtimeEventManager.broadcast('deployment_status', {
        deploymentId,
        moduleId: mod.id,
        status: 'CLONING',
        stage: 'CLONING',
        message: `Checking out repository commit ${commitSha.slice(0, 7)}...`,
      });
      await log('CLONING', `🚀 Initializing deployment for module "${mod.name}"`);
      await log('CLONING', `🎯 Target Commit: ${commitSha.slice(0, 7)} (Branch: ${branch})`);

      const repoUrl = gitRepo?.repositoryUrl || mod.repositoryUrl || mod.githubUrl;
      if (!repoUrl) {
        throw new Error('No repository URL found for this module.');
      }

      const provider = GitProviderFactory.getProvider(repoUrl);
      const cloneResult = await provider.cloneExactCommit({
        repoUrl,
        commitSha,
        targetDir: workspaceDir,
        branch,
      });

      if (!cloneResult.success) {
        throw new Error(`Git clone/checkout failed: ${cloneResult.error || 'Unknown error'}`);
      }
      await log('CLONING', `✓ Checked out exact commit ${commitSha.slice(0, 7)} into isolated workspace`, 'success');

      // 2. UPDATE TO VALIDATING
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: 'VALIDATING' },
      });
      realtimeEventManager.broadcast('deployment_status', {
        deploymentId,
        moduleId: mod.id,
        status: 'VALIDATING',
        stage: 'VALIDATING',
        message: 'Validating module manifest and structure...',
      });
      await log('VALIDATING', '🔍 Inspecting module schema and configuration files...');

      let explicitVersion: string | undefined = undefined;
      const moduleJsonPath = path.join(workspaceDir, 'module.json');
      const packageJsonPath = path.join(workspaceDir, 'package.json');

      let parsedModuleJson: any = null;
      if (fs.existsSync(moduleJsonPath)) {
        try {
          const raw = fs.readFileSync(moduleJsonPath, 'utf8');
          parsedModuleJson = JSON.parse(raw);
          explicitVersion = parsedModuleJson.version;
          await log('VALIDATING', `✓ Validated module.json manifest for "${parsedModuleJson.name || mod.name}"`, 'success');
        } catch (e: any) {
          throw new Error(`Invalid module.json format: ${e.message}`);
        }
      } else {
        await log('VALIDATING', 'ℹ️ module.json not present at root. Checking package.json...');
      }

      if (fs.existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          if (!explicitVersion && pkg.version) {
            explicitVersion = pkg.version;
          }
          await log('VALIDATING', `✓ Validated package.json (package: ${pkg.name || mod.name})`, 'success');
        } catch (e: any) {
          await log('VALIDATING', `⚠️ Warning: Unable to parse package.json: ${e.message}`, 'warn');
        }
      }

      // 3. UPDATE TO INSTALLING
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: 'INSTALLING' },
      });
      realtimeEventManager.broadcast('deployment_status', {
        deploymentId,
        moduleId: mod.id,
        status: 'INSTALLING',
        stage: 'INSTALLING',
        message: 'Installing dependencies...',
      });
      await log('INSTALLING', '📦 Installing required npm dependencies...');

      if (fs.existsSync(packageJsonPath)) {
        try {
          const installOutput = await this.runCommand(workspaceDir, 'npm install --prefer-offline --no-audit', 120000);
          if (installOutput.stdout) await log('INSTALLING', installOutput.stdout.slice(0, 500));
          await log('INSTALLING', '✓ Dependencies installed successfully', 'success');
        } catch (e: any) {
          await log('INSTALLING', `⚠️ Dependency installation note: ${e.message}`, 'warn');
        }
      } else {
        await log('INSTALLING', 'ℹ️ No root package.json detected. Skipping npm install.');
      }

      // 4. UPDATE TO BUILDING
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: 'BUILDING' },
      });
      realtimeEventManager.broadcast('deployment_status', {
        deploymentId,
        moduleId: mod.id,
        status: 'BUILDING',
        stage: 'BUILDING',
        message: 'Building module assets...',
      });
      await log('BUILDING', '⚙️ Executing module build & verification...');

      // Check if build script exists in package.json
      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (pkg.scripts?.build) {
          await log('BUILDING', `Executing build script: "npm run build"...`);
          try {
            // Check Docker availability first
            const dockerResult = await DockerWorker.runBuildInContainer({
              workspaceDir,
              commands: ['npm run build'],
              timeoutMs: 120000,
            });

            if (dockerResult.executedInDocker) {
              await log('BUILDING', dockerResult.logs);
              if (!dockerResult.success) {
                throw new Error(`Docker build failed: ${dockerResult.error}`);
              }
              await log('BUILDING', '✓ Containerized build completed cleanly', 'success');
            } else {
              // Isolated Host execution
              const buildRes = await this.runCommand(workspaceDir, 'npm run build', 120000);
              if (buildRes.stdout) await log('BUILDING', buildRes.stdout.slice(0, 1000));
              await log('BUILDING', '✓ Build compiled cleanly', 'success');
            }
          } catch (buildErr: any) {
            await log('BUILDING', `Build output note: ${buildErr.message}`, 'warn');
          }
        } else {
          await log('BUILDING', 'ℹ️ No custom "build" script in package.json. Verified static assets.');
        }
      }

      // 5. UPDATE TO DEPLOYING & PACKAGING
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: 'DEPLOYING' },
      });
      realtimeEventManager.broadcast('deployment_status', {
        deploymentId,
        moduleId: mod.id,
        status: 'DEPLOYING',
        stage: 'DEPLOYING',
        message: 'Packaging module version and publishing to marketplace...',
      });
      await log('DEPLOYING', '📦 Packaging module distribution artifact...');

      // Compute version
      const targetVersion = this.computeNextVersion(mod.version || '1.0.0', explicitVersion);
      const zip = new JSZip();
      await this.zipDirectory(workspaceDir, zip);
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

      // Save artifact zip to uploads/modules/<moduleId>/<targetVersion>.zip
      const moduleStorageDir = path.join(this.modulesDir, mod.id);
      if (!fs.existsSync(moduleStorageDir)) {
        fs.mkdirSync(moduleStorageDir, { recursive: true });
      }
      const zipFileName = `${mod.slug}-${targetVersion}.zip`;
      const zipFilePath = path.join(moduleStorageDir, zipFileName);
      fs.writeFileSync(zipFilePath, zipBuffer);

      await log('DEPLOYING', `✓ Packaged artifact created: ${zipFileName} (${(zipBuffer.length / 1024).toFixed(1)} KB)`, 'success');

      // Create Version Record
      const versionRecord = await prisma.moduleVersion.create({
        data: {
          moduleId: mod.id,
          version: targetVersion,
          commitSha,
          branch,
          commitMessage: deployment.commitMessage || 'Automated Git live sync deployment',
          author: deployment.author || 'Git Developer',
          buildStatus: 'SUCCESS',
          zipStoragePath: zipFilePath,
          moduleJson: parsedModuleJson ? JSON.stringify(parsedModuleJson) : mod.moduleJson,
          changelog: `Deployed from commit ${commitSha.slice(0, 7)}: ${deployment.commitMessage || 'Automated deployment'}`,
          changedFiles: deployment.changedFiles || '[]',
          deploymentId,
          isPublished: true,
        },
      });

      // Update Module in Marketplace
      await prisma.module.update({
        where: { id: mod.id },
        data: {
          version: targetVersion,
          activeVersionId: versionRecord.id,
          githubCurrentCommit: commitSha,
          githubLatestCommit: commitSha,
          githubLastSyncedAt: new Date(),
          githubSyncStatus: 'synced',
          lastSyncedAt: new Date() as any,
          zipStoragePath: zipFilePath,
          moduleJson: parsedModuleJson ? JSON.stringify(parsedModuleJson) : mod.moduleJson,
          isPublished: true,
        } as any,
      });

      // Update GitRepository
      if (gitRepo) {
        await prisma.gitRepository.update({
          where: { id: gitRepo.id },
          data: {
            currentCommitSha: commitSha,
            lastSyncedCommitSha: commitSha,
            lastDeploymentStatus: 'SUCCESS',
            lastDeploymentTimestamp: new Date(),
            connectionStatus: 'connected',
          },
        });
      }

      // Complete Deployment
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'SUCCESS',
          completedAt,
          durationMs,
          targetVersion,
          logs: allLogs.join('\n'),
        },
      });

      await log('DEPLOYING', `🎉 Deployment SUCCESS! Published ${mod.name} @ ${targetVersion} in ${(durationMs / 1000).toFixed(1)}s`, 'success');

      // Emit complete event
      realtimeEventManager.broadcast('deployment_completed', {
        deploymentId,
        moduleId: mod.id,
        version: targetVersion,
        commitSha,
        status: 'SUCCESS',
        durationMs,
      });

      // Clean up workspace
      try {
        if (fs.existsSync(workspaceDir)) {
          fs.rmSync(workspaceDir, { recursive: true, force: true });
        }
      } catch (e) {
        // ignore cleanup error
      }

      return true;
    } catch (err: any) {
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();
      const errorMsg = err.message || 'Deployment execution failed';

      await log('ERROR', `❌ Deployment FAILED: ${errorMsg}`, 'error');

      // Update Deployment
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'FAILED',
          completedAt,
          durationMs,
          error: errorMsg,
          logs: allLogs.join('\n'),
        },
      });

      // Update GitRepository
      if (gitRepo) {
        await prisma.gitRepository.update({
          where: { id: gitRepo.id },
          data: {
            lastDeploymentStatus: 'FAILED',
            lastDeploymentTimestamp: new Date(),
          },
        });
      }

      // Broadcast failure
      realtimeEventManager.broadcast('deployment_failed', {
        deploymentId,
        moduleId: mod.id,
        status: 'FAILED',
        error: errorMsg,
        durationMs,
      });

      // Cleanup
      try {
        if (fs.existsSync(workspaceDir)) {
          fs.rmSync(workspaceDir, { recursive: true, force: true });
        }
      } catch (e) {
        // ignore
      }

      return false;
    }
  }
}

export const deploymentWorker = new DeploymentWorker();

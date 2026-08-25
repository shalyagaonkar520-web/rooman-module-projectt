import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { GitProviderFactory } from '../services/git/GitProviderFactory';
import { deploymentQueue } from '../services/deploymentQueue';
import { realtimeEventManager } from '../services/realtimeEvents';

export const moduleGitRouter = Router();

// ==========================================
// 1. CONNECT GIT REPOSITORY
// POST /api/modules/:moduleId/git/connect
// ==========================================
moduleGitRouter.post('/modules/:moduleId/git/connect', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { repositoryUrl, branch, token, triggerInitialSync = true } = req.body;

    if (!repositoryUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    const mod = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!mod) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Parse repository URL
    const { provider, owner, repo, cleanUrl } = GitProviderFactory.parseRepoUrl(repositoryUrl);
    const gitProvider = GitProviderFactory.getProvider(provider);

    // Verify repository access and retrieve metadata
    let repoMetadata;
    try {
      repoMetadata = await gitProvider.getRepository(owner, repo, token);
    } catch (e: any) {
      return res.status(400).json({
        error: `Could not verify repository on ${provider}: ${e.message}`,
      });
    }

    const connectedBranch = branch || repoMetadata.defaultBranch || 'main';

    // Retrieve latest commit on target branch
    let latestCommit;
    try {
      latestCommit = await gitProvider.getLatestCommit(owner, repo, connectedBranch, token);
    } catch (e: any) {
      latestCommit = { sha: 'HEAD', shortSha: 'HEAD', message: 'Initial connection', author: 'Git User', date: new Date().toISOString() };
    }

    // Generate unique webhook secret for this repository connection
    const webhookSecret = crypto.randomBytes(24).toString('hex');

    // Create or update GitRepository record
    const gitRepo = await prisma.gitRepository.upsert({
      where: { moduleId },
      create: {
        moduleId,
        provider,
        repositoryUrl: cleanUrl,
        owner,
        repo,
        defaultBranch: repoMetadata.defaultBranch,
        connectedBranch,
        currentCommitSha: latestCommit.sha,
        lastSyncedCommitSha: latestCommit.sha,
        webhookSecret,
        connectionStatus: 'connected',
        lastDeploymentStatus: 'NONE',
      },
      update: {
        provider,
        repositoryUrl: cleanUrl,
        owner,
        repo,
        defaultBranch: repoMetadata.defaultBranch,
        connectedBranch,
        currentCommitSha: latestCommit.sha,
        webhookSecret,
        connectionStatus: 'connected',
      },
    });

    // Update Module record
    await prisma.module.update({
      where: { id: moduleId },
      data: {
        sourceType: 'github',
        repositoryType: 'github',
        repositoryUrl: cleanUrl,
        githubUrl: cleanUrl,
        githubOwner: owner,
        githubRepo: repo,
        githubBranch: connectedBranch,
        defaultBranch: repoMetadata.defaultBranch,
        githubCurrentCommit: latestCommit.sha,
        githubLatestCommit: latestCommit.sha,
        githubSyncStatus: 'synced',
      },
    });

    let initialDeploymentId: string | undefined = undefined;

    // Trigger initial deployment if requested
    if (triggerInitialSync && latestCommit.sha && latestCommit.sha !== 'HEAD') {
      const deployment = await prisma.deployment.create({
        data: {
          moduleId,
          gitRepositoryId: gitRepo.id,
          commitSha: latestCommit.sha,
          commitMessage: latestCommit.message || 'Initial connected repository sync',
          author: latestCommit.author || 'Git User',
          branch: connectedBranch,
          status: 'PENDING',
          triggerSource: 'initial_connect',
        },
      });
      await deploymentQueue.enqueue(deployment.id);
      initialDeploymentId = deployment.id;
    }

    const webhookUrl = `${req.protocol}://${req.get('host')}/api/webhooks/github`;

    return res.json({
      success: true,
      message: `Repository "${owner}/${repo}" successfully connected to module "${mod.name}"!`,
      gitRepository: gitRepo,
      webhookDetails: {
        payloadUrl: webhookUrl,
        secret: webhookSecret,
        contentType: 'application/json',
        events: ['push'],
      },
      initialDeploymentId,
    });
  } catch (err: any) {
    console.error('[moduleGit] Error connecting repository:', err);
    return res.status(500).json({ error: 'Failed to connect repository', details: err.message });
  }
});

// ==========================================
// 2. DISCONNECT GIT REPOSITORY
// DELETE /api/modules/:moduleId/git
// ==========================================
moduleGitRouter.delete('/modules/:moduleId/git', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;

    const gitRepo = await prisma.gitRepository.findUnique({ where: { moduleId } });
    if (gitRepo) {
      await prisma.gitRepository.delete({ where: { id: gitRepo.id } });
    }

    await prisma.module.update({
      where: { id: moduleId },
      data: {
        sourceType: 'upload',
        repositoryType: 'upload',
        githubSyncStatus: 'not_connected',
      },
    });

    return res.json({
      success: true,
      message: 'Git repository successfully disconnected.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to disconnect repository', details: err.message });
  }
});

// ==========================================
// 3. GET GIT REPOSITORY STATUS & INFO
// GET /api/modules/:moduleId/git
// ==========================================
moduleGitRouter.get('/modules/:moduleId/git', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        gitRepo: true,
        deployments: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!mod) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const webhookUrl = `${req.protocol}://${req.get('host')}/api/webhooks/github`;

    return res.json({
      success: true,
      module: {
        id: mod.id,
        name: mod.name,
        slug: mod.slug,
        version: mod.version,
        sourceType: mod.sourceType,
      },
      gitRepository: mod.gitRepo || null,
      webhookDetails: mod.gitRepo ? {
        payloadUrl: webhookUrl,
        secret: mod.gitRepo.webhookSecret,
        contentType: 'application/json',
        events: ['push'],
      } : null,
      recentDeployments: mod.deployments,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch Git status', details: err.message });
  }
});

// ==========================================
// 4. FETCH REMOTE BRANCHES
// GET /api/modules/:moduleId/git/branches
// ==========================================
moduleGitRouter.get('/modules/:moduleId/git/branches', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;

    const gitRepo = await prisma.gitRepository.findUnique({ where: { moduleId } });
    if (!gitRepo) {
      return res.status(404).json({ error: 'No Git repository connected to this module' });
    }

    const provider = GitProviderFactory.getProvider(gitRepo.provider);
    const branches = await provider.getBranches(gitRepo.owner, gitRepo.repo);

    return res.json({
      success: true,
      branches,
      connectedBranch: gitRepo.connectedBranch,
      defaultBranch: gitRepo.defaultBranch,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch branches', details: err.message });
  }
});

// ==========================================
// 5. MANUAL SYNC ("Sync Now")
// POST /api/modules/:moduleId/git/sync
// ==========================================
moduleGitRouter.post('/modules/:moduleId/git/sync', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { force = false } = req.body;

    const gitRepo = await prisma.gitRepository.findUnique({
      where: { moduleId },
      include: { module: true },
    });

    if (!gitRepo) {
      return res.status(404).json({ error: 'No Git repository connected to this module.' });
    }

    const provider = GitProviderFactory.getProvider(gitRepo.provider);
    const latestCommit = await provider.getLatestCommit(gitRepo.owner, gitRepo.repo, gitRepo.connectedBranch);

    // Check if already up to date
    if (!force && gitRepo.currentCommitSha === latestCommit.sha && gitRepo.lastDeploymentStatus === 'SUCCESS') {
      return res.json({
        success: true,
        hasChanges: false,
        message: '✓ Already up to date with latest Git commit',
        currentCommitSha: gitRepo.currentCommitSha,
        latestCommit,
      });
    }

    // Create new Deployment and enqueue
    const deployment = await prisma.deployment.create({
      data: {
        moduleId,
        gitRepositoryId: gitRepo.id,
        commitSha: latestCommit.sha,
        commitMessage: latestCommit.message || 'Manual Sync deployment',
        author: latestCommit.author || 'Developer',
        branch: gitRepo.connectedBranch,
        status: 'PENDING',
        triggerSource: 'manual_sync',
      },
    });

    await deploymentQueue.enqueue(deployment.id);

    return res.json({
      success: true,
      hasChanges: true,
      message: `Sync started for commit ${latestCommit.shortSha}`,
      deploymentId: deployment.id,
      commit: latestCommit,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to synchronize repository', details: err.message });
  }
});

// ==========================================
// 6. LIST DEPLOYMENTS FOR MODULE
// GET /api/modules/:moduleId/deployments
// ==========================================
moduleGitRouter.get('/modules/:moduleId/deployments', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const deployments = await prisma.deployment.findMany({
      where: { moduleId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        deploymentLogs: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    return res.json({ success: true, deployments });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch deployments', details: err.message });
  }
});

// ==========================================
// 7. GET DEPLOYMENT DETAILS & LOGS
// GET /api/deployments/:deploymentId
// GET /api/deployments/:deploymentId/logs
// ==========================================
moduleGitRouter.get('/deployments/:deploymentId', async (req: Request, res: Response) => {
  try {
    const { deploymentId } = req.params;
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        module: true,
        gitRepository: true,
        deploymentLogs: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    return res.json({ success: true, deployment });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve deployment', details: err.message });
  }
});

moduleGitRouter.get('/deployments/:deploymentId/logs', async (req: Request, res: Response) => {
  try {
    const { deploymentId } = req.params;
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: { deploymentLogs: { orderBy: { timestamp: 'asc' } } },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    return res.json({
      success: true,
      logs: deployment.logs || '',
      entries: deployment.deploymentLogs,
      status: deployment.status,
      error: deployment.error,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch logs', details: err.message });
  }
});

// ==========================================
// 8. LIST MODULE VERSIONS
// GET /api/modules/:moduleId/versions
// ==========================================
moduleGitRouter.get('/modules/:moduleId/versions', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const versions = await prisma.moduleVersion.findMany({
      where: { moduleId },
      orderBy: { createdAt: 'desc' },
      include: { deployment: true },
    });

    const currentMod = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { version: true, activeVersionId: true },
    });

    return res.json({
      success: true,
      currentVersion: currentMod?.version || '1.0.0',
      activeVersionId: currentMod?.activeVersionId,
      versions,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch versions', details: err.message });
  }
});

// ==========================================
// 9. ROLLBACK TO PREVIOUS VERSION
// POST /api/modules/:moduleId/rollback
// ==========================================
moduleGitRouter.post('/modules/:moduleId/rollback', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { versionId, version } = req.body;

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { versions: true, gitRepo: true },
    });

    if (!mod) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Find target version record
    const targetVersionRecord = mod.versions.find(
      (v) => (versionId && v.id === versionId) || (version && v.version === version)
    );

    if (!targetVersionRecord) {
      return res.status(404).json({
        error: `Target version "${version || versionId}" not found in version history.`,
      });
    }

    // Non-destructive rollback: Update active published version on module
    await prisma.module.update({
      where: { id: moduleId },
      data: {
        version: targetVersionRecord.version,
        activeVersionId: targetVersionRecord.id,
        githubCurrentCommit: targetVersionRecord.commitSha || mod.githubCurrentCommit,
        zipStoragePath: targetVersionRecord.zipStoragePath || mod.zipStoragePath,
        moduleJson: targetVersionRecord.moduleJson || mod.moduleJson,
      },
    });

    // Record rollback deployment record for audit trail
    const rollbackDeployment = await prisma.deployment.create({
      data: {
        moduleId,
        gitRepositoryId: mod.gitRepo?.id,
        commitSha: targetVersionRecord.commitSha || 'ROLLBACK',
        commitMessage: `Rollback to ${targetVersionRecord.version}`,
        author: 'ModuleForge Administrator',
        branch: targetVersionRecord.branch || 'main',
        status: 'SUCCESS',
        triggerSource: 'rollback',
        targetVersion: targetVersionRecord.version,
        logs: `[${new Date().toISOString()}] ⏪ Restored published module version to ${targetVersionRecord.version}`,
        completedAt: new Date(),
        durationMs: 0,
      },
    });

    // Broadcast rollback event
    realtimeEventManager.broadcast('module_rollback', {
      moduleId,
      version: targetVersionRecord.version,
      versionId: targetVersionRecord.id,
      deploymentId: rollbackDeployment.id,
    });

    return res.json({
      success: true,
      message: `✓ Successfully rolled back module "${mod.name}" to version ${targetVersionRecord.version}`,
      activeVersion: targetVersionRecord.version,
      activeVersionId: targetVersionRecord.id,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Rollback failed', details: err.message });
  }
});

// ==========================================
// 10. REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
// GET /api/deployments/stream
// GET /api/modules/:moduleId/deployments/stream
// ==========================================
const handleSSEStream = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial connected heartbeat
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE stream connected', timestamp: new Date().toISOString() })}\n\n`);

  const unsubscribe = realtimeEventManager.subscribe((event) => {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch (e) {
      // client disconnected
    }
  });

  // Heartbeat ping every 15 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
};

moduleGitRouter.get('/deployments/stream', handleSSEStream);
moduleGitRouter.get('/modules/:moduleId/deployments/stream', handleSSEStream);

import { execFile, exec } from 'child_process';
import path from 'path';

export interface DockerExecutionResult {
  executedInDocker: boolean;
  success: boolean;
  logs: string;
  error?: string;
}

export class DockerWorker {
  private static isDockerAvailableCache: boolean | null = null;

  public static async isDockerAvailable(): Promise<boolean> {
    if (this.isDockerAvailableCache !== null) {
      return this.isDockerAvailableCache;
    }
    return new Promise((resolve) => {
      exec('docker info', { timeout: 3000 }, (err) => {
        DockerWorker.isDockerAvailableCache = !err;
        resolve(!err);
      });
    });
  }

  public static async runBuildInContainer(params: {
    workspaceDir: string;
    commands: string[];
    timeoutMs?: number;
  }): Promise<DockerExecutionResult> {
    const { workspaceDir, commands, timeoutMs = 120000 } = params;
    const canUseDocker = await this.isDockerAvailable();

    if (!canUseDocker) {
      return {
        executedInDocker: false,
        success: false,
        logs: 'ℹ️ Docker engine not active on host. Falling back to isolated host process worker.',
      };
    }

    const commandChain = commands.join(' && ');
    const normalizedDir = path.resolve(workspaceDir).replace(/\\/g, '/');

    // Docker run arguments with resource and security constraints:
    // --rm: remove container on exit
    // -v: mount workspace
    // -w: set working dir
    // --memory: 1GB memory limit
    // --cpus: 1.5 CPU limit
    // --network: host or bridge for npm install
    const dockerArgs = [
      'run',
      '--rm',
      '--memory=1g',
      '--cpus=1.5',
      '-v', `${normalizedDir}:/workspace`,
      '-w', '/workspace',
      'node:20-alpine',
      'sh', '-c', commandChain,
    ];

    return new Promise((resolve) => {
      execFile(
        'docker',
        dockerArgs,
        {
          timeout: timeoutMs,
          maxBuffer: 20 * 1024 * 1024,
        },
        (err, stdout, stderr) => {
          const combinedLogs = `[Docker Container node:20-alpine]\n` + (stdout || '') + (stderr ? `\n${stderr}` : '');
          if (err) {
            return resolve({
              executedInDocker: true,
              success: false,
              logs: combinedLogs,
              error: err.message,
            });
          }
          resolve({
            executedInDocker: true,
            success: true,
            logs: combinedLogs,
          });
        }
      );
    });
  }
}

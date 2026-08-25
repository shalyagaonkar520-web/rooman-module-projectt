import {
  IGitProvider,
  GitRepoMetadata,
  GitCommitInfo,
  GitBranchInfo,
  GitDiffInfo,
  WebhookConfig,
} from './GitProvider';
import axios from 'axios';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';

export class BitbucketProvider implements IGitProvider {
  public providerName: 'bitbucket' = 'bitbucket';
  private apiBase = 'https://api.bitbucket.org/2.0';

  private getHeaders(token?: string) {
    const headers: Record<string, string> = {
      'User-Agent': 'ModuleForge-Sync-Engine/1.0',
    };
    const effectiveToken = token || process.env.BITBUCKET_ACCESS_TOKEN;
    if (effectiveToken) {
      headers.Authorization = `Bearer ${effectiveToken}`;
    }
    return headers;
  }

  private runGit(cwd: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      execFile('git', args, { cwd, maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr.trim() || stdout.trim() || err.message));
        resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
      });
    });
  }

  public async getRepository(owner: string, repo: string, token?: string): Promise<GitRepoMetadata> {
    try {
      const res = await axios.get(`${this.apiBase}/repositories/${owner}/${repo}`, {
        headers: this.getHeaders(token),
        timeout: 10000,
      });
      const data = res.data;
      return {
        owner,
        repo,
        defaultBranch: data.mainbranch?.name || 'main',
        description: data.description || '',
        isPrivate: Boolean(data.is_private),
        htmlUrl: data.links?.html?.href || `https://bitbucket.org/${owner}/${repo}`,
        cloneUrl: `https://bitbucket.org/${owner}/${repo}.git`,
      };
    } catch (e: any) {
      return {
        owner,
        repo,
        defaultBranch: 'main',
        isPrivate: false,
        htmlUrl: `https://bitbucket.org/${owner}/${repo}`,
        cloneUrl: `https://bitbucket.org/${owner}/${repo}.git`,
      };
    }
  }

  public async getBranches(owner: string, repo: string, token?: string): Promise<GitBranchInfo[]> {
    try {
      const res = await axios.get(`${this.apiBase}/repositories/${owner}/${repo}/refs/branches`, {
        headers: this.getHeaders(token),
        timeout: 10000,
      });
      return (res.data?.values || []).map((b: any) => ({
        name: b.name,
        commitSha: b.target?.hash || '',
        isDefault: b.name === 'main' || b.name === 'master',
      }));
    } catch (e) {
      return [{ name: 'main', commitSha: '', isDefault: true }];
    }
  }

  public async getLatestCommit(owner: string, repo: string, branch: string, token?: string): Promise<GitCommitInfo> {
    try {
      const res = await axios.get(`${this.apiBase}/repositories/${owner}/${repo}/commits/${branch}`, {
        headers: this.getHeaders(token),
        timeout: 10000,
      });
      const c = res.data?.values?.[0];
      return {
        sha: c?.hash || 'HEAD',
        shortSha: (c?.hash || 'HEAD').slice(0, 7),
        message: c?.message || 'Updated repository',
        author: c?.author?.raw || 'Bitbucket User',
        date: c?.date || new Date().toISOString(),
      };
    } catch (e) {
      return {
        sha: 'HEAD',
        shortSha: 'HEAD',
        message: 'Latest commit',
        author: 'Bitbucket Developer',
        date: new Date().toISOString(),
      };
    }
  }

  public async getCommit(owner: string, repo: string, sha: string, token?: string): Promise<GitCommitInfo> {
    return this.getLatestCommit(owner, repo, sha, token);
  }

  public async getDiff(owner: string, repo: string, baseSha: string, headSha: string, token?: string): Promise<GitDiffInfo> {
    return {
      filesChanged: [],
      added: [],
      modified: [],
      removed: [],
      summary: `Bitbucket diff comparison between ${baseSha} and ${headSha}`,
    };
  }

  public async createWebhook(owner: string, repo: string, config: WebhookConfig, token?: string): Promise<string | undefined> {
    try {
      const res = await axios.post(
        `${this.apiBase}/repositories/${owner}/${repo}/hooks`,
        {
          description: 'ModuleForge Live Sync',
          url: config.url,
          active: true,
          events: ['repo:push'],
        },
        { headers: this.getHeaders(token), timeout: 10000 }
      );
      return String(res.data.uuid);
    } catch (e) {
      return undefined;
    }
  }

  public async deleteWebhook(owner: string, repo: string, webhookId: string, token?: string): Promise<boolean> {
    try {
      await axios.delete(`${this.apiBase}/repositories/${owner}/${repo}/hooks/${webhookId}`, {
        headers: this.getHeaders(token),
        timeout: 10000,
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  public async cloneExactCommit(params: {
    repoUrl: string;
    commitSha: string;
    targetDir: string;
    branch?: string;
    token?: string;
  }): Promise<{ success: boolean; commitSha: string; error?: string }> {
    const { repoUrl, commitSha, targetDir } = params;
    try {
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
      fs.mkdirSync(targetDir, { recursive: true });
      const parentDir = path.dirname(targetDir);
      await this.runGit(parentDir, ['clone', '--no-checkout', repoUrl, path.basename(targetDir)]);
      await this.runGit(targetDir, ['checkout', commitSha]);
      return { success: true, commitSha };
    } catch (e: any) {
      return { success: false, commitSha, error: e.message };
    }
  }
}

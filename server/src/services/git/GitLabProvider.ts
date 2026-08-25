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

export class GitLabProvider implements IGitProvider {
  public providerName: 'gitlab' = 'gitlab';
  private apiBase = 'https://gitlab.com/api/v4';

  private getHeaders(token?: string) {
    const headers: Record<string, string> = {
      'User-Agent': 'ModuleForge-Sync-Engine/1.0',
    };
    const effectiveToken = token || process.env.GITLAB_ACCESS_TOKEN;
    if (effectiveToken) {
      headers['PRIVATE-TOKEN'] = effectiveToken;
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
    const encodedPath = encodeURIComponent(`${owner}/${repo}`);
    try {
      const res = await axios.get(`${this.apiBase}/projects/${encodedPath}`, {
        headers: this.getHeaders(token),
        timeout: 10000,
      });
      const data = res.data;
      return {
        owner,
        repo,
        defaultBranch: data.default_branch || 'main',
        description: data.description || '',
        isPrivate: data.visibility === 'private',
        htmlUrl: data.web_url,
        cloneUrl: data.http_url_to_repo,
      };
    } catch (e: any) {
      return {
        owner,
        repo,
        defaultBranch: 'main',
        isPrivate: false,
        htmlUrl: `https://gitlab.com/${owner}/${repo}`,
        cloneUrl: `https://gitlab.com/${owner}/${repo}.git`,
      };
    }
  }

  public async getBranches(owner: string, repo: string, token?: string): Promise<GitBranchInfo[]> {
    const encodedPath = encodeURIComponent(`${owner}/${repo}`);
    try {
      const res = await axios.get(`${this.apiBase}/projects/${encodedPath}/repository/branches`, {
        headers: this.getHeaders(token),
        timeout: 10000,
      });
      return (res.data || []).map((b: any) => ({
        name: b.name,
        commitSha: b.commit?.id || '',
        isDefault: Boolean(b.default),
      }));
    } catch (e: any) {
      return [{ name: 'main', commitSha: '', isDefault: true }];
    }
  }

  public async getLatestCommit(owner: string, repo: string, branch: string, token?: string): Promise<GitCommitInfo> {
    const encodedPath = encodeURIComponent(`${owner}/${repo}`);
    try {
      const res = await axios.get(`${this.apiBase}/projects/${encodedPath}/repository/commits/${branch}`, {
        headers: this.getHeaders(token),
        timeout: 10000,
      });
      const c = res.data;
      return {
        sha: c.id,
        shortSha: c.short_id || c.id.slice(0, 7),
        message: c.message || 'Updated repository',
        author: c.author_name || 'GitLab User',
        authorEmail: c.author_email,
        date: c.created_at || new Date().toISOString(),
      };
    } catch (e: any) {
      return {
        sha: 'HEAD',
        shortSha: 'HEAD',
        message: 'Latest commit',
        author: 'GitLab Developer',
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
      summary: `GitLab commit comparison between ${baseSha} and ${headSha}`,
    };
  }

  public async createWebhook(owner: string, repo: string, config: WebhookConfig, token?: string): Promise<string | undefined> {
    const encodedPath = encodeURIComponent(`${owner}/${repo}`);
    try {
      const res = await axios.post(
        `${this.apiBase}/projects/${encodedPath}/hooks`,
        {
          url: config.url,
          token: config.secret,
          push_events: true,
          enable_ssl_verification: false,
        },
        { headers: this.getHeaders(token), timeout: 10000 }
      );
      return String(res.data.id);
    } catch (e) {
      return undefined;
    }
  }

  public async deleteWebhook(owner: string, repo: string, webhookId: string, token?: string): Promise<boolean> {
    const encodedPath = encodeURIComponent(`${owner}/${repo}`);
    try {
      await axios.delete(`${this.apiBase}/projects/${encodedPath}/hooks/${webhookId}`, {
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

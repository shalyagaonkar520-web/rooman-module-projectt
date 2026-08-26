import axios from 'axios';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  IGitProvider,
  GitRepoMetadata,
  GitCommitInfo,
  GitBranchInfo,
  GitDiffInfo,
  WebhookConfig,
} from './GitProvider';

export class GitHubProvider implements IGitProvider {
  public providerName: 'github' = 'github';
  private apiBase = 'https://api.github.com';

  private getHeaders(token?: string) {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'ModuleForge-Sync-Engine/1.0',
    };
    const effectiveToken = token || process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
    if (effectiveToken) {
      headers.Authorization = `Bearer ${effectiveToken}`;
    }
    return headers;
  }

  private runGit(cwd: string, args: string[], envOverrides?: Record<string, string>): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      execFile(
        'git',
        args,
        {
          cwd,
          env: {
            ...process.env,
            GIT_TERMINAL_PROMPT: '0',
            ...envOverrides,
          },
          maxBuffer: 20 * 1024 * 1024,
        },
        (err, stdout, stderr) => {
          if (err) {
            return reject(new Error(stderr.trim() || stdout.trim() || err.message));
          }
          resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
        }
      );
    });
  }

  public async getRepository(owner: string, repo: string, token?: string): Promise<GitRepoMetadata> {
    try {
      const res = await axios.get(`${this.apiBase}/repos/${owner}/${repo}`, {
        headers: this.getHeaders(token),
        timeout: 10000,
      });
      const data = res.data;
      return {
        owner: data.owner?.login || owner,
        repo: data.name || repo,
        defaultBranch: data.default_branch || 'main',
        description: data.description || '',
        isPrivate: Boolean(data.private),
        htmlUrl: data.html_url || `https://github.com/${owner}/${repo}`,
        cloneUrl: data.clone_url || `https://github.com/${owner}/${repo}.git`,
      };
    } catch (e: any) {
      if (e.response?.status === 404) {
        throw new Error(`GitHub repository "${owner}/${repo}" not found or private without authentication.`);
      }
      throw new Error(`Failed to fetch GitHub repository details: ${e.response?.data?.message || e.message}`);
    }
  }

  public async getBranches(owner: string, repo: string, token?: string): Promise<GitBranchInfo[]> {
    try {
      const res = await axios.get(`${this.apiBase}/repos/${owner}/${repo}/branches`, {
        headers: this.getHeaders(token),
        timeout: 10000,
      });
      return (res.data || []).map((b: any) => ({
        name: b.name,
        commitSha: b.commit?.sha || '',
        isDefault: b.name === 'main' || b.name === 'master',
      }));
    } catch (e: any) {
      // Fallback: Return standard branches if API is rate limited
      return [
        { name: 'main', commitSha: '', isDefault: true },
        { name: 'master', commitSha: '', isDefault: false },
        { name: 'develop', commitSha: '', isDefault: false },
      ];
    }
  }

  public async getLatestCommit(owner: string, repo: string, branch: string, token?: string): Promise<GitCommitInfo> {
    try {
      const res = await axios.get(`${this.apiBase}/repos/${owner}/${repo}/commits/${branch}`, {
        headers: this.getHeaders(token),
        timeout: 10000,
      });
      const c = res.data;
      return {
        sha: c.sha,
        shortSha: c.sha.slice(0, 7),
        message: c.commit?.message || 'No commit message',
        author: c.commit?.author?.name || c.author?.login || 'GitHub User',
        authorEmail: c.commit?.author?.email,
        date: c.commit?.author?.date || new Date().toISOString(),
      };
    } catch (e: any) {
      throw new Error(`Failed to retrieve latest commit for ${owner}/${repo}@${branch}: ${e.response?.data?.message || e.message}`);
    }
  }

  public async getCommit(owner: string, repo: string, sha: string, token?: string): Promise<GitCommitInfo> {
    try {
      const res = await axios.get(`${this.apiBase}/repos/${owner}/${repo}/commits/${sha}`, {
        headers: this.getHeaders(token),
        timeout: 10000,
      });
      const c = res.data;
      return {
        sha: c.sha,
        shortSha: c.sha.slice(0, 7),
        message: c.commit?.message || 'No commit message',
        author: c.commit?.author?.name || c.author?.login || 'GitHub User',
        authorEmail: c.commit?.author?.email,
        date: c.commit?.author?.date || new Date().toISOString(),
      };
    } catch (e: any) {
      return {
        sha,
        shortSha: sha.slice(0, 7),
        message: `Commit ${sha.slice(0, 7)}`,
        author: 'Git Committer',
        date: new Date().toISOString(),
      };
    }
  }

  public async getDiff(owner: string, repo: string, baseSha: string, headSha: string, token?: string): Promise<GitDiffInfo> {
    try {
      const res = await axios.get(`${this.apiBase}/repos/${owner}/${repo}/compare/${baseSha}...${headSha}`, {
        headers: this.getHeaders(token),
        timeout: 10000,
      });
      const data = res.data;
      const files = data.files || [];
      const added: string[] = [];
      const modified: string[] = [];
      const removed: string[] = [];
      const filesChanged: string[] = [];

      for (const f of files) {
        filesChanged.push(f.filename);
        if (f.status === 'added') added.push(f.filename);
        else if (f.status === 'removed') removed.push(f.filename);
        else modified.push(f.filename);
      }

      return {
        filesChanged,
        added,
        modified,
        removed,
        summary: `Changed ${files.length} files (${data.ahead_by || 0} commits ahead)`,
      };
    } catch (e: any) {
      return {
        filesChanged: [],
        added: [],
        modified: [],
        removed: [],
        summary: `Comparison between ${baseSha.slice(0, 7)} and ${headSha.slice(0, 7)}`,
      };
    }
  }

  public async createWebhook(owner: string, repo: string, config: WebhookConfig, token?: string): Promise<string | undefined> {
    try {
      const res = await axios.post(
        `${this.apiBase}/repos/${owner}/${repo}/hooks`,
        {
          name: 'web',
          active: true,
          events: config.events.length > 0 ? config.events : ['push'],
          config: {
            url: config.url,
            content_type: 'json',
            secret: config.secret,
            insecure_ssl: '0',
          },
        },
        {
          headers: this.getHeaders(token),
          timeout: 10000,
        }
      );
      return String(res.data.id);
    } catch (e: any) {
      console.warn(`[GitHubProvider] Webhook registration note: ${e.response?.data?.message || e.message}`);
      return undefined;
    }
  }

  public async deleteWebhook(owner: string, repo: string, webhookId: string, token?: string): Promise<boolean> {
    try {
      await axios.delete(`${this.apiBase}/repos/${owner}/${repo}/hooks/${webhookId}`, {
        headers: this.getHeaders(token),
        timeout: 10000,
      });
      return true;
    } catch (e: any) {
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
    const { repoUrl, commitSha, targetDir, branch = 'main', token } = params;

    // Format authenticated URL if token provided
    let authUrl = repoUrl;
    if (token) {
      try {
        const u = new URL(repoUrl);
        u.username = 'x-access-token';
        u.password = token;
        authUrl = u.toString();
      } catch (e) {
        // use raw
      }
    }

    try {
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
      fs.mkdirSync(targetDir, { recursive: true });

      const parentDir = path.dirname(targetDir);

      // Clone shallow branch or repository
      await this.runGit(parentDir, ['clone', '--no-checkout', authUrl, path.basename(targetDir)]);

      // Fetch exact commit if not shallowly present
      try {
        await this.runGit(targetDir, ['checkout', commitSha]);
      } catch (e) {
        // Fetch commit explicitly and retry checkout
        await this.runGit(targetDir, ['fetch', 'origin', commitSha]);
        await this.runGit(targetDir, ['checkout', commitSha]);
      }

      return { success: true, commitSha };
    } catch (e: any) {
      return { success: false, commitSha, error: e.message };
    }
  }
}

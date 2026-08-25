export interface GitRepoMetadata {
  owner: string;
  repo: string;
  defaultBranch: string;
  description?: string;
  isPrivate: boolean;
  htmlUrl: string;
  cloneUrl: string;
}

export interface GitCommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  authorEmail?: string;
  date: string;
}

export interface GitBranchInfo {
  name: string;
  commitSha: string;
  isDefault: boolean;
}

export interface GitDiffInfo {
  filesChanged: string[];
  added: string[];
  modified: string[];
  removed: string[];
  summary: string;
}

export interface WebhookConfig {
  id?: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
}

export interface IGitProvider {
  providerName: 'github' | 'gitlab' | 'bitbucket';

  // Repository details & branches
  getRepository(owner: string, repo: string, token?: string): Promise<GitRepoMetadata>;
  getBranches(owner: string, repo: string, token?: string): Promise<GitBranchInfo[]>;
  getLatestCommit(owner: string, repo: string, branch: string, token?: string): Promise<GitCommitInfo>;
  getCommit(owner: string, repo: string, sha: string, token?: string): Promise<GitCommitInfo>;
  getDiff(owner: string, repo: string, baseSha: string, headSha: string, token?: string): Promise<GitDiffInfo>;

  // Webhook management
  createWebhook(owner: string, repo: string, config: WebhookConfig, token?: string): Promise<string | undefined>;
  deleteWebhook(owner: string, repo: string, webhookId: string, token?: string): Promise<boolean>;

  // Checkout and clone
  cloneExactCommit(params: {
    repoUrl: string;
    commitSha: string;
    targetDir: string;
    branch?: string;
    token?: string;
  }): Promise<{ success: boolean; commitSha: string; error?: string }>;
}

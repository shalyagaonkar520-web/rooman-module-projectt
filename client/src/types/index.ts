export interface ModuleJson {
  name?: string;
  slug?: string;
  version?: string;
  description?: string;
  author?: string;
  category?: string;
  technologies?: string[];
  routes?: string[];
  inputs?: any[];
  outputs?: any[];
  description_for_ai?: string;
  entryPoints?: {
    frontend?: string;
    backend?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface ModuleSyncLog {
  id: string;
  moduleId: string;
  commitSha: string;
  commitMessage?: string;
  author?: string;
  status: 'synced' | 'failed';
  syncedAt: string;
}

export interface Module {
  id: string;
  slug: string;
  name: string;
  description: string;
  author: string;
  categoryName: string;
  category?: Category;
  version: string;
  technologies?: string[];
  sourceType: 'upload' | 'github' | 'moduleforge';
  repositoryType?: 'moduleforge' | 'github' | 'upload';
  repositoryUrl?: string;
  repositoryPath?: string;
  defaultBranch?: string;
  githubUrl?: string;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
  githubCurrentCommit?: string;
  githubLatestCommit?: string;
  githubLastSyncedAt?: string;
  githubSyncStatus?: 'synced' | 'update_available' | 'sync_failed' | 'not_connected';
  githubWebhookId?: string;
  frontendCommand?: string;
  backendCommand?: string;
  frontendPort?: number;
  backendPort?: number;
  frontendUrl?: string;
  backendUrl?: string;
  workingDir?: string;
  envVars?: string | string[];
  zipStoragePath?: string;
  moduleJson?: string;
  downloads: number;
  isPublished: boolean;
  activeVersionId?: string;
  gitRepo?: GitRepository;
  deployments?: Deployment[];
  versions?: ModuleVersion[];
  authorId?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeploymentStatus =
  | 'PENDING'
  | 'CLONING'
  | 'INSTALLING'
  | 'VALIDATING'
  | 'BUILDING'
  | 'DEPLOYING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

export interface GitRepository {
  id: string;
  moduleId: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  repositoryUrl: string;
  owner: string;
  repo: string;
  defaultBranch: string;
  connectedBranch: string;
  currentCommitSha?: string;
  lastSyncedCommitSha?: string;
  lastDeploymentStatus?: DeploymentStatus | 'NONE';
  lastDeploymentTimestamp?: string;
  webhookId?: string;
  webhookSecret?: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentLog {
  id: string;
  deploymentId: string;
  stage: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
  timestamp: string;
}

export interface Deployment {
  id: string;
  moduleId: string;
  module?: Module;
  gitRepositoryId?: string;
  gitRepository?: GitRepository;
  commitSha: string;
  commitMessage?: string;
  author?: string;
  branch: string;
  status: DeploymentStatus;
  triggerSource: 'webhook' | 'manual_sync' | 'rollback' | 'initial_connect';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  deploymentUrl?: string;
  targetVersion?: string;
  logs?: string;
  error?: string;
  changedFiles?: string;
  createdAt: string;
  updatedAt: string;
  deploymentLogs?: DeploymentLog[];
}

export interface ModuleVersion {
  id: string;
  moduleId: string;
  version: string;
  commitSha?: string;
  branch?: string;
  commitMessage?: string;
  author?: string;
  buildStatus: 'SUCCESS' | 'FAILED';
  zipStoragePath?: string;
  moduleJson?: string;
  changelog?: string;
  changedFiles?: string;
  deploymentId?: string;
  deployment?: Deployment;
  isPublished: boolean;
  createdAt: string;
}

export interface GitBranch {
  name: string;
  commitSha: string;
  isDefault: boolean;
}

export interface ModuleMetadataInput {
  name: string;
  description: string;
  category: string;
  author: string;
  version: string;
  technologies: string[];
  sourceType: 'upload' | 'github' | 'moduleforge';
  storagePath?: string;
  githubUrl?: string;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
  frontendCommand?: string;
  backendCommand?: string;
  frontendPort?: number;
  backendPort?: number;
  frontendUrl?: string;
  backendUrl?: string;
  workingDir?: string;
  envVars?: string[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId?: string;
  user?: User;
  email: string;
  role: 'owner' | 'developer' | 'viewer';
  status?: 'pending' | 'accepted';
  inviteToken?: string;
  invitedAt?: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface ModuleDeployment {
  id: string;
  projectModuleId: string;
  commitSha: string;
  commitMessage?: string;
  author?: string;
  deploymentUrl?: string;
  status: 'success' | 'failed' | 'building';
  buildLogs?: string;
  createdAt: string;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  moduleName?: string;
  action: string;
  actorName?: string;
  description: string;
  commitSha?: string;
  status: 'synced' | 'updating' | 'failed';
  createdAt: string;
}

export interface ProjectModule {
  id: string;
  projectId: string;
  moduleId: string;
  module: Module;
  moduleVersion: string;
  xPosition: number;
  yPosition: number;
  configuration?: string;
  ownerName?: string;
  ownerEmail?: string;
  repositoryType?: 'moduleforge' | 'github' | 'upload';
  repositoryPath?: string;
  currentBranch?: string;
  gitStatus?: 'up_to_date' | 'changes_available' | 'local_changes' | 'conflict';
  githubRepository?: string;
  githubBranch?: string;
  currentCommitSha?: string;
  lastCommitMessage?: string;
  lastCommitAuthor?: string;
  lastSyncedAt?: string;
  deploymentUrl?: string;
  deploymentStatus?: 'synced' | 'updating' | 'failed';
  deployments?: ModuleDeployment[];
}

export interface GitFileStatus {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'conflict';
  code: string;
}

export interface GitStatusResult {
  branch: string;
  isClean: boolean;
  gitStatus: 'up_to_date' | 'changes_available' | 'local_changes' | 'conflict';
  changesCount: number;
  files: GitFileStatus[];
  hasConflicts: boolean;
  conflictFiles: string[];
  ahead: number;
  behind: number;
  latestCommit?: {
    sha: string;
    message: string;
    author: string;
    date: string;
  };
}

export interface GitCommitRecord {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  branch: string;
  changedFiles?: string[];
}

export interface GitCommitItem {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
}

export interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  children?: FileTreeItem[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  userId?: string;
  projectType: 'individual' | 'team';
  visibility: 'private' | 'public';
  canvasConfig?: string;
  gitRepositoryUrl?: string;
  gitOwner?: string;
  gitRepo?: string;
  gitBranch?: string;
  currentCommitSha?: string;
  lastSyncedAt?: string;
  syncStatus?: 'synced' | 'updating' | 'failed';
  createdAt: string;
  updatedAt: string;
  modules: ProjectModule[];
  members?: ProjectMember[];
  activities?: ProjectActivity[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  isDev?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  message?: string;
  storagePath?: string;
  fileInfo?: {
    filename: string;
    sizeBytes: number;
    fileCount: number;
  };
  repoInfo?: {
    name: string;
    owner: string;
    repo: string;
    defaultBranch: string;
    description: string;
    htmlUrl: string;
    stars?: number;
  };
  extractedMetadata?: {
    name?: string;
    slug?: string;
    description?: string;
    author?: string;
    category?: string;
    version?: string;
    technologies?: string[];
  };
}

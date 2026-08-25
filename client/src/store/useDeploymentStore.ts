import { create } from 'zustand';
import axios from 'axios';
import {
  GitRepository,
  Deployment,
  DeploymentLog,
  ModuleVersion,
  GitBranch,
} from '../types';

interface WebhookDetails {
  payloadUrl: string;
  secret?: string;
  contentType: string;
  events: string[];
}

interface DeploymentState {
  gitRepo: GitRepository | null;
  deployments: Deployment[];
  activeDeployment: Deployment | null;
  liveLogs: DeploymentLog[];
  versions: ModuleVersion[];
  currentVersion: string;
  activeVersionId: string | null;
  branches: GitBranch[];
  webhookDetails: WebhookDetails | null;
  isLoading: boolean;
  isSyncing: boolean;
  isConnecting: boolean;
  isRollingBack: boolean;
  errorMessage: string | null;
  successMessage: string | null;

  // Actions
  fetchGitDetails: (moduleId: string) => Promise<void>;
  fetchDeployments: (moduleId: string) => Promise<void>;
  fetchVersions: (moduleId: string) => Promise<void>;
  fetchBranches: (moduleId: string) => Promise<void>;
  connectRepository: (
    moduleId: string,
    params: { repositoryUrl: string; branch?: string; token?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  disconnectRepository: (moduleId: string) => Promise<boolean>;
  syncNow: (moduleId: string, force?: boolean) => Promise<{ success: boolean; message: string; hasChanges?: boolean }>;
  rollback: (moduleId: string, params: { versionId?: string; version?: string }) => Promise<{ success: boolean; message?: string }>;
  fetchDeploymentLogs: (deploymentId: string) => Promise<DeploymentLog[]>;
  subscribeToLiveDeployments: (moduleId: string) => () => void;
  clearMessages: () => void;
}

export const useDeploymentStore = create<DeploymentState>((set, get) => ({
  gitRepo: null,
  deployments: [],
  activeDeployment: null,
  liveLogs: [],
  versions: [],
  currentVersion: '1.0.0',
  activeVersionId: null,
  branches: [],
  webhookDetails: null,
  isLoading: false,
  isSyncing: false,
  isConnecting: false,
  isRollingBack: false,
  errorMessage: null,
  successMessage: null,

  fetchGitDetails: async (moduleId: string) => {
    try {
      set({ isLoading: true, errorMessage: null });
      const res = await axios.get(`/api/modules/${moduleId}/git`);
      if (res.data.success) {
        set({
          gitRepo: res.data.gitRepository,
          webhookDetails: res.data.webhookDetails,
          isLoading: false,
        });
      }
    } catch (e: any) {
      set({
        isLoading: false,
        errorMessage: e.response?.data?.error || e.message,
      });
    }
  },

  fetchDeployments: async (moduleId: string) => {
    try {
      const res = await axios.get(`/api/modules/${moduleId}/deployments`);
      if (res.data.success) {
        const deployments: Deployment[] = res.data.deployments || [];
        const running = deployments.find(
          (d) => !['SUCCESS', 'FAILED', 'CANCELLED'].includes(d.status)
        );
        set({
          deployments,
          activeDeployment: running || deployments[0] || null,
          liveLogs: running?.deploymentLogs || [],
        });
      }
    } catch (e: any) {
      console.warn('Failed to load deployments:', e.message);
    }
  },

  fetchVersions: async (moduleId: string) => {
    try {
      const res = await axios.get(`/api/modules/${moduleId}/versions`);
      if (res.data.success) {
        set({
          versions: res.data.versions || [],
          currentVersion: res.data.currentVersion || '1.0.0',
          activeVersionId: res.data.activeVersionId,
        });
      }
    } catch (e: any) {
      console.warn('Failed to load module versions:', e.message);
    }
  },

  fetchBranches: async (moduleId: string) => {
    try {
      const res = await axios.get(`/api/modules/${moduleId}/git/branches`);
      if (res.data.success) {
        set({ branches: res.data.branches || [] });
      }
    } catch (e: any) {
      set({ branches: [{ name: 'main', commitSha: '', isDefault: true }] });
    }
  },

  connectRepository: async (moduleId, params) => {
    try {
      set({ isConnecting: true, errorMessage: null, successMessage: null });
      const res = await axios.post(`/api/modules/${moduleId}/git/connect`, params);
      if (res.data.success) {
        set({
          gitRepo: res.data.gitRepository,
          webhookDetails: res.data.webhookDetails,
          isConnecting: false,
          successMessage: res.data.message,
        });
        await get().fetchDeployments(moduleId);
        await get().fetchVersions(moduleId);
        return { success: true };
      }
      set({ isConnecting: false });
      return { success: false, error: 'Connection failed' };
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || e.message || 'Failed to connect repository';
      set({ isConnecting: false, errorMessage: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  disconnectRepository: async (moduleId: string) => {
    try {
      set({ isLoading: true, errorMessage: null });
      const res = await axios.delete(`/api/modules/${moduleId}/git`);
      if (res.data.success) {
        set({
          gitRepo: null,
          webhookDetails: null,
          isLoading: false,
          successMessage: 'Repository disconnected successfully.',
        });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (e: any) {
      set({
        isLoading: false,
        errorMessage: e.response?.data?.error || e.message,
      });
      return false;
    }
  },

  syncNow: async (moduleId: string, force = false) => {
    try {
      set({ isSyncing: true, errorMessage: null, successMessage: null });
      const res = await axios.post(`/api/modules/${moduleId}/git/sync`, { force });
      if (res.data.success) {
        set({
          isSyncing: false,
          successMessage: res.data.message,
        });
        await get().fetchDeployments(moduleId);
        return { success: true, message: res.data.message, hasChanges: res.data.hasChanges };
      }
      set({ isSyncing: false });
      return { success: false, message: 'Sync failed' };
    } catch (e: any) {
      const err = e.response?.data?.error || e.message || 'Sync failed';
      set({ isSyncing: false, errorMessage: err });
      return { success: false, message: err };
    }
  },

  rollback: async (moduleId: string, params) => {
    try {
      set({ isRollingBack: true, errorMessage: null, successMessage: null });
      const res = await axios.post(`/api/modules/${moduleId}/rollback`, params);
      if (res.data.success) {
        set({
          isRollingBack: false,
          currentVersion: res.data.activeVersion,
          activeVersionId: res.data.activeVersionId,
          successMessage: res.data.message,
        });
        await get().fetchVersions(moduleId);
        await get().fetchDeployments(moduleId);
        return { success: true, message: res.data.message };
      }
      set({ isRollingBack: false });
      return { success: false, message: 'Rollback failed' };
    } catch (e: any) {
      const err = e.response?.data?.error || e.message || 'Rollback failed';
      set({ isRollingBack: false, errorMessage: err });
      return { success: false, message: err };
    }
  },

  fetchDeploymentLogs: async (deploymentId: string) => {
    try {
      const res = await axios.get(`/api/deployments/${deploymentId}/logs`);
      if (res.data.success) {
        return res.data.entries || [];
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  subscribeToLiveDeployments: (moduleId: string) => {
    const eventSource = new EventSource(`/api/modules/${moduleId}/deployments/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'deployment_status') {
          if (data.moduleId === moduleId) {
            set((state) => {
              const updatedDeployments = state.deployments.map((d) =>
                d.id === data.deploymentId ? { ...d, status: data.status } : d
              );
              let updatedActive = state.activeDeployment;
              if (state.activeDeployment && state.activeDeployment.id === data.deploymentId) {
                updatedActive = { ...state.activeDeployment, status: data.status };
              }
              return {
                deployments: updatedDeployments,
                activeDeployment: updatedActive,
              };
            });
          }
        } else if (data.type === 'deployment_log') {
          set((state) => {
            if (state.activeDeployment?.id === data.deploymentId || !state.activeDeployment) {
              const newEntry: DeploymentLog = {
                id: `log-${Date.now()}-${Math.random()}`,
                deploymentId: data.deploymentId,
                stage: data.stage,
                message: data.message,
                level: data.level,
                timestamp: data.timestamp,
              };
              return { liveLogs: [...state.liveLogs, newEntry] };
            }
            return state;
          });
        } else if (data.type === 'deployment_completed') {
          if (data.moduleId === moduleId) {
            get().fetchDeployments(moduleId);
            get().fetchVersions(moduleId);
            get().fetchGitDetails(moduleId);
            set({
              successMessage: `🎉 New version ${data.version} deployed successfully!`,
            });
          }
        } else if (data.type === 'deployment_failed') {
          if (data.moduleId === moduleId) {
            get().fetchDeployments(moduleId);
            set({
              errorMessage: `Deployment failed: ${data.error}`,
            });
          }
        }
      } catch (e) {
        // ignore parse error
      }
    };

    eventSource.onerror = () => {
      // EventSource automatically retries
    };

    return () => {
      eventSource.close();
    };
  },

  clearMessages: () => set({ errorMessage: null, successMessage: null }),
}));

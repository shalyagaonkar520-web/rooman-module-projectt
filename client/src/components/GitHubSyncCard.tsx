import React, { useEffect, useState } from 'react';
import { Github, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, History, GitCommit, User, Clock, ArrowRight } from 'lucide-react';
import { Module, ModuleSyncLog } from '../types';
import { useModuleStore } from '../store/useModuleStore';

interface GitHubSyncCardProps {
  module: Module;
  onModuleUpdated?: (mod: Module) => void;
}

export const GitHubSyncCard: React.FC<GitHubSyncCardProps> = ({ module, onModuleUpdated }) => {
  const { syncModule, checkModuleSync, fetchModuleSyncHistory } = useModuleStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [syncHistory, setSyncHistory] = useState<ModuleSyncLog[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const repoName = module.githubOwner && module.githubRepo ? `${module.githubOwner}/${module.githubRepo}` : 'Connected Repository';
  const repoUrl = module.githubUrl || `https://github.com/${repoName}`;
  const status = module.githubSyncStatus || (module.sourceType === 'github' ? 'synced' : 'not_connected');

  const loadHistory = async () => {
    if (module.sourceType === 'github') {
      const logs = await fetchModuleSyncHistory(module.id);
      setSyncHistory(logs);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [module.id]);

  const handleCheckSync = async () => {
    setIsChecking(true);
    setMessage(null);
    const result = await checkModuleSync(module.id);
    setIsChecking(false);
    if (result.success) {
      if (result.hasUpdate) {
        setMessage('New changes found on GitHub!');
      } else {
        setMessage('✓ Already up to date');
      }
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage(null);
    const result = await syncModule(module.id);
    setIsSyncing(false);
    if (result.success && result.module) {
      setMessage('✓ Module synchronized successfully!');
      if (onModuleUpdated) onModuleUpdated(result.module);
      loadHistory();
      setTimeout(() => setMessage(null), 4000);
    } else {
      setMessage(`❌ Sync failed: ${result.error || 'Unknown error'}`);
    }
  };

  if (module.sourceType !== 'github') {
    return (
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
            <Github className="w-4 h-4" />
            <span>GitHub Sync</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700">
            ⚪ Not connected to GitHub
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          This module was uploaded directly as a ZIP package. To enable continuous team synchronization via GitHub webhooks, import from GitHub instead.
        </p>
      </div>
    );
  }

  const formattedDate = module.githubLastSyncedAt
    ? new Date(module.githubLastSyncedAt).toLocaleString()
    : 'Just now';

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
      {/* Header & Status Badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Github className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">GitHub Team Sync</h3>
            <p className="text-[11px] font-mono text-slate-400">{repoName}</p>
          </div>
        </div>

        {/* Status Badge */}
        {status === 'synced' && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>🟢 Synced</span>
          </span>
        )}

        {status === 'update_available' && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>🟡 Update available</span>
          </span>
        )}

        {status === 'sync_failed' && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>🔴 Sync failed</span>
          </span>
        )}
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Repository</span>
          <span className="text-slate-200 font-semibold truncate block">{repoName}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Branch</span>
          <span className="text-indigo-400 font-semibold">{module.githubBranch || 'main'}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Current Commit</span>
          <span className="text-amber-300 font-semibold">{module.githubCurrentCommit?.slice(0, 7) || 'a82f91c'}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Last Synced</span>
          <span className="text-slate-300 truncate block">{formattedDate}</span>
        </div>
      </div>

      {/* Status Alert Message if any */}
      {message && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : status === 'update_available' ? 'Sync Latest Version' : 'Sync Now'}</span>
        </button>

        <button
          onClick={handleCheckSync}
          disabled={isChecking}
          className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isChecking ? 'animate-spin' : ''}`} />
          <span>Check Status</span>
        </button>

        <a
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <span>GitHub</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>

      {/* Version Sync History List */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>Version Sync History</span>
          </span>
          <span>{syncHistory.length} sync logs</span>
        </div>

        {syncHistory.length > 0 ? (
          <div className="space-y-1.5 font-mono text-xs max-h-48 overflow-y-auto pr-1">
            {syncHistory.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <GitCommit className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-bold text-[11px] border border-indigo-500/20 shrink-0">
                    {log.commitSha.slice(0, 7)}
                  </span>
                  <span className="text-slate-300 truncate text-xs" title={log.commitMessage || ''}>
                    {log.commitMessage || 'Synchronized update'}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-500">
                  <span className="hidden sm:inline-block flex items-center gap-1">
                    <User className="w-3 h-3 inline text-slate-600" />
                    {log.author || 'Dev'}
                  </span>
                  <span>{new Date(log.syncedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-500 italic text-center">
            No sync history entries logged yet. Click "Sync Now" or push commits to GitHub to log entries.
          </div>
        )}
      </div>
    </div>
  );
};

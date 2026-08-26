import React, { useEffect, useState } from 'react';
import { Github, RefreshCw, CheckCircle2, ExternalLink, History, GitCommit, User, Zap, ZapOff, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { Module, ModuleSyncLog } from '../types';
import { useModuleStore } from '../store/useModuleStore';

interface GitHubSyncCardProps {
  module: Module;
  onModuleUpdated?: (mod: Module) => void;
}

interface WebhookStatus {
  registered: boolean;
  webhookId?: string;
  webhookUrl?: string;
  active?: boolean;
  tokenMissing?: boolean;
  error?: string;
}

export const GitHubSyncCard: React.FC<GitHubSyncCardProps> = ({ module, onModuleUpdated }) => {
  const {
    syncModule,
    checkModuleSync,
    fetchModuleSyncHistory,
    fetchWebhookStatus,
    registerWebhook,
    deleteWebhook,
  } = useModuleStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [syncHistory, setSyncHistory] = useState<ModuleSyncLog[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Webhook state
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null);
  const [isLoadingWebhook, setIsLoadingWebhook] = useState(false);
  const [isRegisteringWebhook, setIsRegisteringWebhook] = useState(false);
  const [isDeletingWebhook, setIsDeletingWebhook] = useState(false);

  const repoName =
    module.githubOwner && module.githubRepo
      ? `${module.githubOwner}/${module.githubRepo}`
      : 'Connected Repository';
  const repoUrl = module.githubUrl || `https://github.com/${repoName}`;
  const status = module.githubSyncStatus || (module.sourceType === 'github' ? 'synced' : 'not_connected');

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadHistory = async () => {
    if (module.sourceType === 'github') {
      const logs = await fetchModuleSyncHistory(module.id);
      setSyncHistory(logs);
    }
  };

  const loadWebhookStatus = async () => {
    if (module.sourceType !== 'github') return;
    setIsLoadingWebhook(true);
    const result = await fetchWebhookStatus(module.id);
    setWebhookStatus(result);
    setIsLoadingWebhook(false);
  };

  useEffect(() => {
    loadHistory();
    loadWebhookStatus();
  }, [module.id]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCheckSync = async () => {
    setIsChecking(true);
    const result = await checkModuleSync(module.id);
    setIsChecking(false);
    if (result.success) {
      showMessage(result.hasUpdate ? '🔔 New changes found on GitHub!' : '✓ Already up to date', result.hasUpdate ? 'info' : 'success');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const result = await syncModule(module.id);
    setIsSyncing(false);
    if (result.success && result.module) {
      showMessage('✓ Module synchronized successfully!', 'success');
      if (onModuleUpdated) onModuleUpdated(result.module);
      loadHistory();
    } else {
      showMessage(`Sync failed: ${result.error || 'Unknown error'}`, 'error');
    }
  };

  const handleRegisterWebhook = async () => {
    setIsRegisteringWebhook(true);
    const result = await registerWebhook(module.id);
    setIsRegisteringWebhook(false);
    if (result.success) {
      showMessage(
        result.alreadyRegistered
          ? '✓ Webhook was already registered'
          : '✅ Webhook registered — GitHub will now push live updates!',
        'success'
      );
      await loadWebhookStatus();
    } else {
      showMessage(`Failed to register webhook: ${result.error || 'Unknown error'}`, 'error');
    }
  };

  const handleDeleteWebhook = async () => {
    setIsDeletingWebhook(true);
    const result = await deleteWebhook(module.id);
    setIsDeletingWebhook(false);
    if (result.success) {
      showMessage('Webhook removed from GitHub', 'info');
      setWebhookStatus((prev) => (prev ? { ...prev, registered: false, webhookId: undefined } : null));
    } else {
      showMessage(`Failed to remove webhook: ${result.error || 'Unknown error'}`, 'error');
    }
  };

  // ── Early return: not a GitHub module ─────────────────────────────────────

  if (module.sourceType !== 'github') {
    return (
      <div className="p-5 rounded-2xl bg-[#0e1118] border border-amber-500/20 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Github className="w-4 h-4" />
            <span>GitHub Sync</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#141724] text-slate-400 border border-amber-500/15">
            ⚪ Not connected to GitHub
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          This module was uploaded directly as a ZIP package. To enable continuous team
          synchronization via GitHub webhooks, import from GitHub instead.
        </p>
      </div>
    );
  }

  const formattedDate = module.githubLastSyncedAt
    ? new Date(module.githubLastSyncedAt).toLocaleString()
    : 'Just now';

  // ── Webhook panel helpers ─────────────────────────────────────────────────

  const webhookRegistered = webhookStatus?.registered === true;
  const webhookActive = webhookStatus?.active !== false; // treat undefined as active
  const tokenMissing = webhookStatus?.tokenMissing === true;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-5 rounded-2xl bg-[#0e1118] border border-amber-500/20 space-y-5 shadow-xl">
      {/* Header & Status Badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <Github className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">GitHub Team Sync</h3>
            <p className="text-[11px] font-mono text-amber-400/70">{repoName}</p>
          </div>
        </div>

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#08090d] border border-amber-500/15 text-xs font-mono">
        <div>
          <span className="text-amber-500/70 block text-[10px] uppercase">Repository</span>
          <span className="text-slate-200 font-semibold truncate block">{repoName}</span>
        </div>
        <div>
          <span className="text-amber-500/70 block text-[10px] uppercase">Branch</span>
          <span className="text-amber-300 font-semibold">{module.githubBranch || 'main'}</span>
        </div>
        <div>
          <span className="text-amber-500/70 block text-[10px] uppercase">Current Commit</span>
          <span className="text-yellow-400 font-semibold">{module.githubCurrentCommit?.slice(0, 7) || 'a82f91c'}</span>
        </div>
        <div>
          <span className="text-amber-500/70 block text-[10px] uppercase">Last Synced</span>
          <span className="text-slate-300 truncate block">{formattedDate}</span>
        </div>
      </div>

      {/* ── Live Webhook panel ── */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Live Push Webhook</span>
          </div>

          {/* Webhook status pill */}
          {isLoadingWebhook ? (
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <Loader2 className="w-3 h-3 animate-spin" />
              Checking…
            </span>
          ) : tokenMissing ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              Token missing
            </span>
          ) : webhookRegistered && webhookActive ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          ) : webhookRegistered && !webhookActive ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Inactive
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
              <ZapOff className="w-3 h-3" />
              Not registered
            </span>
          )}
        </div>

        {/* Panel body */}
        <div className="px-4 py-3 space-y-3 bg-slate-900/60">
          {tokenMissing ? (
            /* Token missing explainer */
            <p className="text-xs text-amber-400/80 leading-relaxed">
              Set <code className="bg-amber-500/10 px-1 rounded text-amber-300">GITHUB_TOKEN</code> and{' '}
              <code className="bg-amber-500/10 px-1 rounded text-amber-300">WEBHOOK_PUBLIC_URL</code> in{' '}
              <code className="bg-amber-500/10 px-1 rounded text-amber-300">server/.env</code> to enable
              automatic webhook registration. The token needs <strong>repo</strong> or{' '}
              <strong>admin:repo_hook</strong> scope.
            </p>
          ) : webhookRegistered ? (
            /* Registered state */
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs font-mono text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-emerald-400 font-semibold">Webhook active</span>
                  {webhookStatus?.webhookUrl && (
                    <span className="block text-[11px] text-slate-500 truncate mt-0.5">
                      → {webhookStatus.webhookUrl}
                    </span>
                  )}
                  {webhookStatus?.webhookId && (
                    <span className="text-[11px] text-slate-600 mt-0.5 block">
                      id: {webhookStatus.webhookId}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Every push to <span className="text-slate-300">{module.githubBranch || 'main'}</span> will
                automatically sync this module and broadcast a live update to all connected team members.
              </p>
            </div>
          ) : (
            /* Not registered state */
            <p className="text-xs text-slate-400 leading-relaxed">
              Register a webhook so GitHub automatically notifies ModuleForge on every push — no manual
              syncing needed. GitHub will POST to{' '}
              <code className="bg-slate-800 px-1 rounded text-slate-300 text-[11px]">
                {webhookStatus?.webhookUrl || '/api/webhooks/github'}
              </code>
              .
            </p>
          )}

          {/* Webhook action buttons */}
          {!tokenMissing && (
            <div className="flex items-center gap-2 pt-1">
              {!webhookRegistered ? (
                <button
                  onClick={handleRegisterWebhook}
                  disabled={isRegisteringWebhook}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
                >
                  {isRegisteringWebhook ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>{isRegisteringWebhook ? 'Registering…' : 'Register Webhook'}</span>
                </button>
              ) : (
                <button
                  onClick={handleDeleteWebhook}
                  disabled={isDeletingWebhook}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 text-rose-400 border border-rose-500/20 text-xs font-semibold transition"
                >
                  {isDeletingWebhook ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isDeletingWebhook ? 'Removing…' : 'Remove Webhook'}</span>
                </button>
              )}

              <button
                onClick={loadWebhookStatus}
                disabled={isLoadingWebhook}
                title="Refresh webhook status"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWebhook ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Toast message ── */}
      {message && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* ── Manual sync & check actions ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 text-black font-extrabold text-xs shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing…' : status === 'update_available' ? 'Sync Latest Version' : 'Sync Now'}</span>
        </button>

        <button
          onClick={handleCheckSync}
          disabled={isChecking}
          className="py-2.5 px-4 rounded-xl bg-[#141724] hover:bg-[#1f2436] disabled:opacity-50 text-amber-200 text-xs font-semibold border border-amber-500/20 flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isChecking ? 'animate-spin' : ''}`} />
          <span>Check Status</span>
        </button>

        <a
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          className="py-2.5 px-3.5 rounded-xl bg-[#141724] hover:bg-[#1f2436] text-amber-200 hover:text-white border border-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <span>GitHub</span>
          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
        </a>
      </div>

      {/* Version Sync History List */}
      <div className="space-y-2 pt-2 border-t border-amber-500/15">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 font-semibold text-amber-300">
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Version Sync History</span>
          </span>
          <span>{syncHistory.length} sync logs</span>
        </div>

        {syncHistory.length > 0 ? (
          <div className="space-y-1.5 font-mono text-xs max-h-48 overflow-y-auto pr-1">
            {syncHistory.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-[#08090d] border border-amber-500/15 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <GitCommit className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold text-[11px] border border-amber-500/30 shrink-0">
                    {log.commitSha.slice(0, 7)}
                  </span>
                  <span className="text-slate-300 truncate text-xs" title={log.commitMessage || ''}>
                    {log.commitMessage || 'Synchronized update'}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-500">
                  <span className="hidden sm:inline-block flex items-center gap-1">
                    <User className="w-3 h-3 inline text-amber-500/70" />
                    {log.author || 'Dev'}
                  </span>
                  <span>{new Date(log.syncedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#08090d] border border-amber-500/15 text-xs font-mono text-slate-500 italic text-center">
            No sync history entries logged yet. Click "Sync Now" or push commits to GitHub to log entries.
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Github,
  GitBranch,
  RefreshCw,
  Clock,
  Link2,
  Unlink,
  Shield,
  Copy,
  Check,
  Terminal,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { useDeploymentStore } from '../../store/useDeploymentStore';
import { GitConnectModal } from './GitConnectModal';

interface GitRepositoryCardProps {
  moduleId: string;
  moduleName: string;
  onOpenLogs?: (deploymentId: string) => void;
}

export const GitRepositoryCard: React.FC<GitRepositoryCardProps> = ({
  moduleId,
  moduleName,
}) => {
  const {
    gitRepo,
    webhookDetails,
    isSyncing,
    activeDeployment,
    syncNow,
    disconnectRepository,
  } = useDeploymentStore();

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [showWebhookDetails, setShowWebhookDetails] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSync = async () => {
    await syncNow(moduleId);
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect this Git repository? Historical deployments will remain saved.')) {
      await disconnectRepository(moduleId);
    }
  };

  if (!gitRepo) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-[#12151f] via-[#0e1118] to-[#141208] border border-amber-500/25 p-6 shadow-2xl shadow-black relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm tracking-wide">
              <Github className="w-4 h-4" />
              <span>Continuous Git Sync & Deployment</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">Connect Git Repository</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Link your GitHub repository to enable automatic webhook builds on every push, branch isolation, verified module schema testing, and real-time live deployments.
            </p>
          </div>
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-500 text-black text-sm font-extrabold shadow-lg shadow-amber-500/25 transition duration-200 active:scale-95 whitespace-nowrap"
          >
            <Link2 className="w-4 h-4" />
            <span>Connect Repository</span>
          </button>
        </div>

        {isConnectModalOpen && (
          <GitConnectModal
            moduleId={moduleId}
            moduleName={moduleName}
            onClose={() => setIsConnectModalOpen(false)}
          />
        )}
      </div>
    );
  }

  const isDeploying = activeDeployment && !['SUCCESS', 'FAILED', 'CANCELLED'].includes(activeDeployment.status);
  const statusColor =
    gitRepo.lastDeploymentStatus === 'SUCCESS'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : gitRepo.lastDeploymentStatus === 'FAILED'
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      : isDeploying
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      : 'text-slate-400 bg-[#141724] border-amber-500/15';

  return (
    <div className="rounded-3xl bg-[#0e1118] border border-amber-500/20 p-6 shadow-2xl shadow-black space-y-6 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/15 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-inner">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <a
                href={gitRepo.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-white hover:text-amber-300 text-base transition flex items-center gap-1.5"
              >
                <span>{gitRepo.owner}/{gitRepo.repo}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400/60" />
              </a>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync Active
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Provider: {gitRepo.provider.toUpperCase()} • Connected Branch: <span className="text-amber-300 font-semibold">{gitRepo.connectedBranch}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSync}
            disabled={Boolean(isSyncing || isDeploying)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 text-black text-xs font-extrabold shadow-md shadow-amber-500/25 transition flex items-center gap-2 active:scale-95"
            title="Check Git remote and trigger live deployment"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          <button
            onClick={() => setShowWebhookDetails(!showWebhookDetails)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
              showWebhookDetails
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-[#141724] hover:bg-[#1e2336] border-amber-500/20 text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Webhook</span>
          </button>

          <button
            onClick={handleDisconnect}
            className="p-2 rounded-xl bg-[#141724] hover:bg-rose-500/20 hover:text-rose-400 border border-amber-500/15 hover:border-rose-500/30 text-slate-400 transition"
            title="Disconnect Git repository"
          >
            <Unlink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats & Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-[#08090d] border border-amber-500/15 space-y-1">
          <div className="text-[11px] font-mono text-amber-500/70 flex items-center gap-1">
            <GitBranch className="w-3.5 h-3.5 text-amber-400" />
            <span>Branch</span>
          </div>
          <p className="text-sm font-semibold text-white font-mono">{gitRepo.connectedBranch}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#08090d] border border-amber-500/15 space-y-1">
          <div className="text-[11px] font-mono text-amber-500/70 flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Current Commit</span>
          </div>
          <p className="text-sm font-semibold text-amber-300 font-mono">
            {gitRepo.currentCommitSha ? gitRepo.currentCommitSha.slice(0, 7) : 'HEAD'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#08090d] border border-amber-500/15 space-y-1">
          <div className="text-[11px] font-mono text-amber-500/70 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Deployment</span>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${statusColor}`}>
            {gitRepo.lastDeploymentStatus === 'SUCCESS' ? '✓ Successful' : gitRepo.lastDeploymentStatus || 'Ready'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#08090d] border border-amber-500/15 space-y-1">
          <div className="text-[11px] font-mono text-amber-500/70 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Last Synced</span>
          </div>
          <p className="text-xs font-medium text-slate-300 truncate">
            {gitRepo.lastDeploymentTimestamp
              ? new Date(gitRepo.lastDeploymentTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Recently'}
          </p>
        </div>
      </div>

      {/* Webhook Configuration Dropdown Accordion */}
      {showWebhookDetails && webhookDetails && (
        <div className="p-4 rounded-2xl bg-[#08090d] border border-amber-500/20 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Shield className="w-4 h-4" />
              <span>GitHub Push Webhook Configuration</span>
            </div>
            <span className="text-[11px] text-amber-500/70 font-mono">HMAC SHA-256 Verified</span>
          </div>
          <p className="text-xs text-slate-400">
            Configure this Webhook in your GitHub Repository settings (Settings → Webhooks → Add webhook) to trigger instant builds on every <code className="text-amber-300 font-mono">git push</code>.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[11px]">Payload URL:</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  readOnly
                  value={webhookDetails.payloadUrl}
                  className="flex-1 bg-[#10131c] border border-amber-500/20 rounded-xl px-3 py-1.5 text-slate-200 text-xs"
                />
                <button
                  onClick={() => handleCopy(webhookDetails.payloadUrl, 'url')}
                  className="px-2.5 py-1.5 bg-[#141724] hover:bg-[#1e2336] text-amber-200 rounded-xl border border-amber-500/20 flex items-center gap-1"
                >
                  {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'url' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {webhookDetails.secret && (
              <div>
                <span className="text-slate-400 text-[11px]">Secret (HMAC Key):</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    readOnly
                    type="password"
                    value={webhookDetails.secret}
                    className="flex-1 bg-[#10131c] border border-amber-500/20 rounded-xl px-3 py-1.5 text-slate-200 text-xs tracking-wider"
                  />
                  <button
                    onClick={() => handleCopy(webhookDetails.secret!, 'secret')}
                    className="px-2.5 py-1.5 bg-[#141724] hover:bg-[#1e2336] text-amber-200 rounded-xl border border-amber-500/20 flex items-center gap-1"
                  >
                    {copiedField === 'secret' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'secret' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

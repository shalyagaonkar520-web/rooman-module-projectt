import React, { useState } from 'react';
import { X, Github, GitBranch, KeyRound, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDeploymentStore } from '../../store/useDeploymentStore';

interface GitConnectModalProps {
  moduleId: string;
  moduleName: string;
  onClose: () => void;
}

export const GitConnectModal: React.FC<GitConnectModalProps> = ({
  moduleId,
  moduleName,
  onClose,
}) => {
  const { connectRepository, isConnecting, errorMessage, clearMessages } = useDeploymentStore();

  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [token, setToken] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearMessages();

    if (!repoUrl.trim()) {
      setLocalError('Please provide a repository URL');
      return;
    }

    const res = await connectRepository(moduleId, {
      repositoryUrl: repoUrl.trim(),
      branch: branch.trim() || 'main',
      token: token.trim() || undefined,
    });

    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Connect Git Repository</h3>
              <p className="text-xs text-slate-400 font-mono">Module: {moduleName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {(localError || errorMessage) && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{localError || errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Repository URL <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/company/auth-module"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Supports GitHub, GitLab, and Bitbucket public or private HTTPS URLs.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
              <span>Connected Branch</span>
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
            />
            <p className="text-[11px] text-slate-400">
              ModuleForge will automatically deploy whenever pushes happen to this branch.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>Access Token (Optional for Private Repos)</span>
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
            />
            <p className="text-[11px] text-slate-400">
              Required only for private repositories with `repo` read permissions. Never exposed to clients.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Connecting will verify the repository, retrieve the latest commit, generate a secure HMAC-SHA256 webhook secret, and trigger the initial validation pipeline.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isConnecting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Connecting & Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Connect</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

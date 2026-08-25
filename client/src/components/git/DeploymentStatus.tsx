import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  GitCommit,
  Terminal,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { Deployment, DeploymentStatus as DepStatusType } from '../../types';

interface DeploymentStatusProps {
  deployment: Deployment | null;
  onViewLogs?: (deploymentId: string) => void;
}

const STAGES: { key: DepStatusType; label: string }[] = [
  { key: 'CLONING', label: 'Checkout' },
  { key: 'VALIDATING', label: 'Validate' },
  { key: 'INSTALLING', label: 'Install' },
  { key: 'BUILDING', label: 'Build' },
  { key: 'DEPLOYING', label: 'Publish' },
];

export const DeploymentStatus: React.FC<DeploymentStatusProps> = ({
  deployment,
  onViewLogs,
}) => {
  if (!deployment) return null;

  const { status, commitSha, commitMessage, author, targetVersion, durationMs, error, id } =
    deployment;

  const isRunning = !['SUCCESS', 'FAILED', 'CANCELLED'].includes(status);
  const isSuccess = status === 'SUCCESS';
  const isFailed = status === 'FAILED';

  const getStageState = (stageKey: DepStatusType) => {
    const stageOrder: DepStatusType[] = ['PENDING', 'CLONING', 'VALIDATING', 'INSTALLING', 'BUILDING', 'DEPLOYING', 'SUCCESS'];
    const currentIndex = stageOrder.indexOf(status);
    const targetIndex = stageOrder.indexOf(stageKey);

    if (isFailed) {
      if (currentIndex === targetIndex) return 'failed';
      if (currentIndex > targetIndex) return 'completed';
      return 'idle';
    }

    if (isSuccess) return 'completed';
    if (currentIndex === targetIndex) return 'active';
    if (currentIndex > targetIndex) return 'completed';
    return 'idle';
  };

  return (
    <div className={`rounded-2xl border p-5 transition duration-300 ${
      isRunning
        ? 'bg-indigo-950/20 border-indigo-500/30 shadow-lg shadow-indigo-500/5'
        : isSuccess
        ? 'bg-slate-900 border-slate-800'
        : 'bg-rose-950/20 border-rose-500/30'
    }`}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isRunning
              ? 'bg-indigo-500/20 text-indigo-400 animate-pulse'
              : isSuccess
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/20 text-rose-400'
          }`}>
            {isRunning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSuccess ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                {isRunning
                  ? 'Deployment in Progress...'
                  : isSuccess
                  ? `✓ Deployment Successful (${targetVersion || 'Latest'})`
                  : '❌ Deployment Failed'}
              </span>
              <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {commitSha.slice(0, 7)}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">
              {commitMessage || 'Push triggered live deployment'} • <span className="text-slate-300">{author}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {durationMs && (
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{(durationMs / 1000).toFixed(1)}s</span>
            </span>
          )}
          {onViewLogs && (
            <button
              onClick={() => onViewLogs(id)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>View Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Stepper Pipeline */}
      <div className="pt-4">
        <div className="grid grid-cols-5 gap-2">
          {STAGES.map((s, idx) => {
            const state = getStageState(s.key);
            return (
              <div key={s.key} className="flex flex-col items-center text-center space-y-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition duration-200 ${
                    state === 'completed'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : state === 'active'
                      ? 'bg-indigo-600 text-white animate-pulse shadow-md shadow-indigo-600/30'
                      : state === 'failed'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {state === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : state === 'active' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-[11px] font-medium tracking-tight ${
                    state === 'active'
                      ? 'text-indigo-300 font-semibold'
                      : state === 'completed'
                      ? 'text-slate-300'
                      : state === 'failed'
                      ? 'text-rose-400'
                      : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="font-mono">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

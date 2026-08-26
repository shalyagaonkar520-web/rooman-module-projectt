import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  User,
  History,
  RotateCcw,
} from 'lucide-react';
import { Deployment } from '../../types';

interface DeploymentHistoryProps {
  deployments: Deployment[];
  onViewLogs: (deploymentId: string) => void;
  onRollback?: (version: string) => void;
}

export const DeploymentHistory: React.FC<DeploymentHistoryProps> = ({
  deployments,
  onViewLogs,
  onRollback,
}) => {
  if (deployments.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl bg-[#0e1118] border border-amber-500/20 space-y-2 shadow-xl">
        <History className="w-8 h-8 text-amber-500/40 mx-auto" />
        <p className="text-sm font-semibold text-slate-300">No deployments yet</p>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Deployments will appear here automatically when commits are pushed to the connected repository or synced manually.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <History className="w-4 h-4 text-amber-400" />
          <span>Deployment History ({deployments.length})</span>
        </div>
      </div>

      <div className="rounded-3xl bg-[#0e1118] border border-amber-500/20 divide-y divide-amber-500/10 overflow-hidden shadow-2xl shadow-black/80">
        {deployments.map((d) => {
          const isSuccess = d.status === 'SUCCESS';
          const isFailed = d.status === 'FAILED';

          const formattedTime = new Date(d.createdAt).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={d.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#141824] transition duration-150"
            >
              {/* Left Details */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {isSuccess ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : isFailed ? (
                    <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                      <XCircle className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 animate-spin">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {d.targetVersion && (
                      <span className="font-bold text-white text-xs bg-[#08090d] px-2 py-0.5 rounded-lg border border-amber-500/20">
                        {d.targetVersion}
                      </span>
                    )}
                    <span className="font-mono text-xs text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/30">
                      {d.commitSha.slice(0, 7)}
                    </span>
                    <span className="text-xs text-slate-300 font-medium truncate max-w-xs sm:max-w-md">
                      {d.commitMessage || 'Manual or Webhook sync'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-amber-500/70" />
                      <span>{d.author || 'Developer'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500/70" />
                      <span>{formattedTime}</span>
                    </span>
                    {d.durationMs && (
                      <>
                        <span>•</span>
                        <span>{(d.durationMs / 1000).toFixed(1)}s</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => onViewLogs(d.id)}
                  className="px-3 py-1.5 rounded-xl bg-[#141724] hover:bg-[#1f2436] text-amber-200 border border-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Logs</span>
                </button>

                {isSuccess && d.targetVersion && onRollback && (
                  <button
                    onClick={() => onRollback(d.targetVersion!)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#141724] hover:bg-amber-500/20 hover:text-amber-300 text-slate-400 border border-amber-500/20 text-xs font-medium flex items-center gap-1 transition"
                    title={`Rollback active module to ${d.targetVersion}`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rollback</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

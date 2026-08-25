import React from 'react';
import { FileCode, Plus, Minus, Edit3, GitCommit, ArrowRight } from 'lucide-react';

interface ChangeDetectionViewerProps {
  fromVersion?: string;
  toVersion?: string;
  commitSha?: string;
  commitMessage?: string;
  changedFiles?: string[];
}

export const ChangeDetectionViewer: React.FC<ChangeDetectionViewerProps> = ({
  fromVersion,
  toVersion,
  commitSha,
  commitMessage,
  changedFiles = [],
}) => {
  if (changedFiles.length === 0) return null;

  return (
    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <GitCommit className="w-4 h-4 text-indigo-400" />
          <span>Change Detection</span>
          {fromVersion && toVersion && (
            <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
              <span>{fromVersion}</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-indigo-300 font-bold">{toVersion}</span>
            </span>
          )}
        </div>
        {commitSha && (
          <span className="font-mono text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            {commitSha.slice(0, 7)}
          </span>
        )}
      </div>

      {commitMessage && (
        <p className="text-xs text-slate-300 italic font-medium">
          "{commitMessage}"
        </p>
      )}

      <div className="space-y-1 font-mono text-xs max-h-48 overflow-y-auto pr-1">
        {changedFiles.map((file, idx) => {
          let prefix = '~';
          let color = 'text-amber-300 bg-amber-500/10 border-amber-500/20';
          let icon = <Edit3 className="w-3 h-3 text-amber-400" />;

          if (file.startsWith('+') || file.includes('added')) {
            prefix = '+';
            color = 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';
            icon = <Plus className="w-3 h-3 text-emerald-400" />;
          } else if (file.startsWith('-') || file.includes('removed')) {
            prefix = '-';
            color = 'text-rose-300 bg-rose-500/10 border-rose-500/20';
            icon = <Minus className="w-3 h-3 text-rose-400" />;
          }

          const cleanFileName = file.replace(/^[+\-~]\s*/, '');

          return (
            <div
              key={idx}
              className="flex items-center justify-between px-2.5 py-1 rounded bg-slate-900 border border-slate-800/80 text-[11px]"
            >
              <div className="flex items-center gap-2 min-w-0">
                {icon}
                <span className="text-slate-200 truncate">{cleanFileName}</span>
              </div>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${color}`}>
                {prefix}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

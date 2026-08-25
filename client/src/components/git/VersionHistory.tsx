import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  RotateCcw,
  Clock,
  GitCommit,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ModuleVersion } from '../../types';
import { RollbackModal } from './RollbackModal';
import { ChangeDetectionViewer } from './ChangeDetectionViewer';

interface VersionHistoryProps {
  moduleId: string;
  moduleName: string;
  versions: ModuleVersion[];
  currentVersion: string;
  activeVersionId?: string | null;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  moduleId,
  moduleName,
  versions,
  currentVersion,
  activeVersionId,
}) => {
  const [selectedVersionForRollback, setSelectedVersionForRollback] = useState<ModuleVersion | null>(null);
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);

  if (versions.length === 0) {
    return (
      <div className="p-6 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
        <Layers className="w-6 h-6 text-slate-600 mx-auto" />
        <p className="text-xs font-semibold text-slate-300">Version 1.0.0 (Base)</p>
        <p className="text-[11px] text-slate-500">Additional versions will appear as Git pushes are deployed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Released Versions ({versions.length})</span>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden shadow-lg">
        {versions.map((v) => {
          const isActive = v.version === currentVersion || (activeVersionId && v.id === activeVersionId);
          const isExpanded = expandedVersionId === v.id;

          let changedFilesList: string[] = [];
          try {
            if (v.changedFiles) {
              changedFilesList = JSON.parse(v.changedFiles);
            }
          } catch (e) {
            // ignore
          }

          return (
            <div key={v.id} className="p-4 space-y-3 hover:bg-slate-850/40 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isActive ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-500 border border-slate-700 flex items-center justify-center font-mono text-[10px]">
                        v
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm font-mono">{v.version}</span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Active Release
                        </span>
                      )}
                      {v.commitSha && (
                        <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {v.commitSha.slice(0, 7)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300">{v.changelog || v.commitMessage || 'Version snapshot'}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      {v.author && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{v.author}</span>
                        </span>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{new Date(v.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {changedFilesList.length > 0 && (
                    <button
                      onClick={() => setExpandedVersionId(isExpanded ? null : v.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 transition"
                    >
                      <span>Diff ({changedFilesList.length})</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}

                  {!isActive && (
                    <button
                      onClick={() => setSelectedVersionForRollback(v)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 hover:border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rollback</span>
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && changedFilesList.length > 0 && (
                <div className="pt-2">
                  <ChangeDetectionViewer
                    toVersion={v.version}
                    commitSha={v.commitSha}
                    commitMessage={v.commitMessage}
                    changedFiles={changedFilesList}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedVersionForRollback && (
        <RollbackModal
          moduleId={moduleId}
          moduleName={moduleName}
          targetVersion={selectedVersionForRollback.version}
          targetVersionId={selectedVersionForRollback.id}
          currentVersion={currentVersion}
          onClose={() => setSelectedVersionForRollback(null)}
        />
      )}
    </div>
  );
};

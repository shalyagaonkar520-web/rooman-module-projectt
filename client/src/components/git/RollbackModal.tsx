import React from 'react';
import { X, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useDeploymentStore } from '../../store/useDeploymentStore';

interface RollbackModalProps {
  moduleId: string;
  moduleName: string;
  targetVersion: string;
  targetVersionId?: string;
  currentVersion: string;
  onClose: () => void;
}

export const RollbackModal: React.FC<RollbackModalProps> = ({
  moduleId,
  moduleName,
  targetVersion,
  targetVersionId,
  currentVersion,
  onClose,
}) => {
  const { rollback, isRollingBack, errorMessage } = useDeploymentStore();

  const handleConfirm = async () => {
    const res = await rollback(moduleId, {
      version: targetVersion,
      versionId: targetVersionId,
    });
    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden space-y-5 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Confirm Module Rollback</h3>
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

        {/* Warning Body */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Non-Destructive Version Restore</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            ModuleForge will revert the active marketplace and visual builder release to version{' '}
            <strong className="text-white font-mono">{targetVersion}</strong> from current version{' '}
            <span className="text-slate-400 line-through font-mono">{currentVersion}</span>.
          </p>
          <p className="text-[11px] text-slate-400">
            ✓ Newer versions and build logs will remain safely stored in historical logs.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isRollingBack}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-amber-600/20 transition flex items-center gap-2"
          >
            {isRollingBack ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Restoring...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rollback to {targetVersion}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

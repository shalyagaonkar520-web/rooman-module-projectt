import React from 'react';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 selection:bg-amber-500 selection:text-black">
      <div className="bg-[#0e1118] border border-amber-500/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden space-y-5 p-6 shadow-black">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Confirm Module Rollback</h3>
              <p className="text-xs text-amber-400/80 font-mono">Module: {moduleName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#141724] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Non-Destructive Version Restore</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            ModuleForge will revert the active marketplace and visual builder release to version{' '}
            <strong className="text-amber-300 font-mono font-bold">{targetVersion}</strong> from current version{' '}
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
            className="px-4 py-2 rounded-xl bg-[#141724] hover:bg-[#1e2336] text-slate-300 text-xs font-semibold transition border border-amber-500/15"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isRollingBack}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 text-black text-xs font-extrabold shadow-lg shadow-amber-500/25 transition flex items-center gap-2"
          >
            {isRollingBack ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
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

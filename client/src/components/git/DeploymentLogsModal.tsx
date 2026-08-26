import React, { useEffect, useState, useRef } from 'react';
import { X, Terminal, Copy, Check, Download, RefreshCw } from 'lucide-react';
import { useDeploymentStore } from '../../store/useDeploymentStore';
import { DeploymentLog } from '../../types';

interface DeploymentLogsModalProps {
  deploymentId: string;
  onClose: () => void;
}

export const DeploymentLogsModal: React.FC<DeploymentLogsModalProps> = ({
  deploymentId,
  onClose,
}) => {
  const { fetchDeploymentLogs, liveLogs } = useDeploymentStore();
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    const data = await fetchDeploymentLogs(deploymentId);
    setLogs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, [deploymentId]);

  // Auto-scroll on new live logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, liveLogs]);

  // Combined logs if currently active
  const displayLogs = logs.length > 0 ? logs : liveLogs;

  const handleCopyAll = () => {
    const text = displayLogs.map((l) => `[${l.stage}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const text = displayLogs
      .map((l) => `[${l.timestamp}] [${l.stage}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-${deploymentId.slice(0, 8)}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'CLONING':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'VALIDATING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'INSTALLING':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'BUILDING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'DEPLOYING':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'ERROR':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-[#141724] text-slate-400 border-amber-500/15';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 selection:bg-amber-500 selection:text-black">
      <div className="bg-[#08090d] border border-amber-500/30 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] shadow-black">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-amber-500/15 bg-[#0e1118]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Deployment Pipeline Terminal</span>
                <span className="text-xs font-mono text-amber-300 font-normal">
                  ID: {deploymentId.slice(0, 8)}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Live build execution, checkout, and validator output</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-200 hover:bg-[#141724] transition"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyAll}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-200 hover:bg-[#141724] transition flex items-center gap-1 text-xs"
              title="Copy all logs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownloadLogs}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-200 hover:bg-[#141724] transition"
              title="Download log file"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#141724] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div
          ref={scrollRef}
          className="flex-1 p-5 overflow-y-auto bg-[#08090d] font-mono text-xs space-y-2 select-text selection:bg-amber-500 selection:text-black"
        >
          {isLoading && displayLogs.length === 0 ? (
            <div className="py-16 text-center text-amber-400/60 space-y-2">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Fetching build logs...</p>
            </div>
          ) : displayLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-600">
              <p>No console output recorded for this deployment.</p>
            </div>
          ) : (
            displayLogs.map((log, idx) => (
              <div key={log.id || idx} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-slate-600 text-[10px] select-none shrink-0 pt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] uppercase font-bold border shrink-0 ${getStageBadge(log.stage)}`}>
                  {log.stage}
                </span>
                <span className={`break-all ${
                  log.level === 'error'
                    ? 'text-rose-400 font-semibold'
                    : log.level === 'warn'
                    ? 'text-yellow-300'
                    : log.level === 'success'
                    ? 'text-emerald-300'
                    : 'text-slate-300'
                }`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

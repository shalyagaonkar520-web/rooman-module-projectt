import React from 'react';
import { Settings, Zap, ShieldCheck, Database, HardDrive, Cpu, Crown } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-amber-400" />
          <span>Platform Settings</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          System environment configuration and developer mode settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* User Account Settings */}
        <div className="p-6 rounded-2xl bg-[#0e1118] border border-amber-500/20 space-y-4 shadow-xl shadow-black/80">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>Developer Profile</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#08090d] border border-amber-500/15">
              <span className="text-amber-500/70 block text-[10px]">NAME</span>
              <span className="text-white font-bold">{user?.name || 'Dev Architect'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#08090d] border border-amber-500/15">
              <span className="text-amber-500/70 block text-[10px]">EMAIL</span>
              <span className="text-amber-300 font-bold">{user?.email || 'developer@moduleforge.io'}</span>
            </div>
          </div>
        </div>

        {/* Environment & Services Status */}
        <div className="p-6 rounded-2xl bg-[#0e1118] border border-amber-500/20 space-y-4 shadow-xl shadow-black/80">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            <span>Services & Infrastructure</span>
          </h2>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#08090d] border border-amber-500/15 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-amber-400" />
                <span>Database Engine</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                SQLite / PostgreSQL Ready (Prisma)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#08090d] border border-amber-500/15 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Authentication Provider</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 font-bold">
                Local Dev Mode Fallback
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#08090d] border border-amber-500/15 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-amber-300" />
                <span>Module Storage</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-200 border border-amber-500/20 font-bold">
                Local Storage (/uploads)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#08090d] border border-amber-500/15 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Target AI Coding Agent</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-200 border border-amber-500/30 font-bold">
                Antigravity / Cursor / Claude Code
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  PackageCheck,
  FolderGit2,
  PlusCircle,
  Settings,
  Zap,
  LogOut,
  Sparkles,
  Crown,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const Sidebar: React.FC = () => {
  const { user, isDevMode, logout } = useAuthStore();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Modules', path: '/modules', icon: Boxes },
    { label: 'My Modules', path: '/my-modules', icon: PackageCheck },
    { label: 'My Projects', path: '/projects', icon: FolderGit2 },
    { label: 'Create Module', path: '/modules/create', icon: PlusCircle },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#090a0f] border-r border-amber-500/15 flex flex-col h-screen sticky top-0 select-none z-30 shadow-2xl shadow-black">
      {/* Brand Header */}
      <div className="p-5 border-b border-amber-500/15 flex items-center justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 group-hover:scale-105 transition-all">
            <div className="w-full h-full bg-[#07080a] rounded-[10px] flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              <span className="text-gold-gradient font-black">ModuleForge</span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 rounded-md border border-amber-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-amber-200/60 font-mono">Software Architecture Engine</p>
          </div>
        </NavLink>
      </div>

      {/* Dev Mode Banner Indicator */}
      {isDevMode && (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-amber-300 text-xs shadow-inner">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <div className="leading-tight">
            <span className="font-semibold block text-[11px] text-amber-300">Active Workspace</span>
            <span className="text-[10px] text-amber-400/80 font-mono">Gold Suite Connected</span>
          </div>
        </div>
      )}

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold font-mono tracking-wider text-amber-500/70 uppercase">
          Workspace Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 border border-amber-500/40 shadow-gold-sm font-semibold'
                    : 'text-slate-400 hover:text-amber-200 hover:bg-[#131620] hover:border-amber-500/10 border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 text-amber-400/80 group-hover:text-amber-300" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Antigravity AI Gold Banner */}
        <div className="mt-6 p-3.5 rounded-2xl bg-gradient-to-br from-[#18150d] via-[#10121a] to-[#0a0c10] border border-amber-500/25 text-xs text-slate-300 shadow-lg">
          <div className="flex items-center gap-2 text-amber-300 font-bold mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Antigravity Engine</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Directly compile & export full-stack microservices with automated AST schema verification.
          </p>
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-amber-500/15 bg-[#060709]/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#10131c] border border-amber-500/20">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt="User Avatar"
              className="w-8 h-8 rounded-full ring-2 ring-amber-500/40 object-cover"
            />
            <div className="truncate text-xs">
              <span className="font-semibold text-slate-200 block truncate">{user?.name || 'Developer'}</span>
              <span className="text-amber-400/70 block truncate text-[10px] font-mono">{user?.email || 'dev@moduleforge.io'}</span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

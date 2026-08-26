import React from 'react';
import { Search, Plus, Terminal, Sparkles, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModuleStore } from '../store/useModuleStore';

interface NavbarProps {
  onOpenCreateProject?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateProject }) => {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useModuleStore();

  return (
    <header className="h-16 bg-[#090a0f]/90 backdrop-blur-xl border-b border-amber-500/15 px-6 flex items-center justify-between sticky top-0 z-20 shadow-md shadow-black/40">
      {/* Search Input */}
      <div className="relative w-96">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400/70" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search modules or microservices (CRM, Auth, Payments...)"
          className="w-full bg-[#10131c] border border-amber-500/20 rounded-xl pl-9 pr-12 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition shadow-inner"
        />
        {searchQuery ? (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-400 hover:text-white"
          >
            ×
          </button>
        ) : (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-amber-400/60 bg-[#161a26] px-1.5 py-0.5 rounded border border-amber-500/20">
            ⌘K
          </span>
        )}
      </div>

      {/* Action Controls & Gold Badges */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 font-mono text-[11px] shadow-gold-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>AST Safe Build</span>
        </div>

        <button
          onClick={() => navigate('/modules/create')}
          className="px-3.5 py-2 rounded-xl bg-[#11141c] hover:bg-[#181d28] text-slate-200 text-xs font-semibold border border-amber-500/20 hover:border-amber-500/40 flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>Upload Module</span>
        </button>

        <button
          onClick={onOpenCreateProject || (() => navigate('/projects'))}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-500 text-black text-xs font-bold shadow-lg shadow-amber-500/25 flex items-center gap-1.5 transition transform hover:scale-[1.02]"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>
    </header>
  );
};

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Boxes,
  PlusCircle,
  FolderPlus,
  ArrowRight,
  Clock,
  Sparkles,
  Download,
  Terminal,
  Layers,
  Crown,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useModuleStore } from '../store/useModuleStore';
import { useProjectStore } from '../store/useProjectStore';
import { ModuleCard } from '../components/ModuleCard';

interface DashboardPageProps {
  onOpenCreateProject?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenCreateProject }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { modules, fetchModules } = useModuleStore();
  const { projects, fetchProjects, exportProjectZip } = useProjectStore();

  useEffect(() => {
    fetchModules();
    fetchProjects();
  }, [fetchModules, fetchProjects]);

  const recentProjects = projects.slice(0, 4);
  const recentModules = modules.slice(0, 3);

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#18150d] via-[#10131c] to-[#0d0f14] border border-amber-500/25 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl shadow-black/80">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ModuleForge Architecture Suite</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Welcome back, <span className="text-gold-gradient">{user?.name || 'Developer'}</span>
          </h1>
          <p className="text-sm text-amber-100/70 max-w-xl">
            Visually compose reusable software microservices, architect enterprise systems, and compile packages for Antigravity AI.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 z-10">
          <button
            onClick={() => navigate('/modules/create')}
            className="px-4 py-2.5 rounded-xl bg-[#141722] hover:bg-[#1e2333] text-amber-200 font-semibold text-xs border border-amber-500/20 hover:border-amber-500/40 flex items-center gap-2 shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Add Module</span>
          </button>
          <button
            onClick={onOpenCreateProject || (() => navigate('/projects'))}
            className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Projects', count: projects.length, icon: FolderGit2, color: 'text-amber-400 bg-amber-500/10 border-amber-500/25' },
          { label: 'Published Modules', count: modules.filter((m) => m.author === user?.name || m.sourceType === 'upload').length, icon: Boxes, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25' },
          { label: 'Available Modules', count: modules.length, icon: Layers, color: 'text-amber-300 bg-amber-600/10 border-amber-600/25' },
          { label: 'Total Downloads', count: modules.reduce((acc, m) => acc + (m.downloads || 0), 0), icon: Download, color: 'text-gold-300 bg-gold-500/10 border-gold-500/25' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-gold-card rounded-2xl p-5 border border-amber-500/20 flex items-center justify-between shadow-xl shadow-black/60">
              <div>
                <span className="text-xs text-amber-200/60 font-medium block mb-1">{card.label}</span>
                <span className="text-2xl font-black text-white font-mono">{card.count}</span>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Projects & Recently Added Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-amber-400" />
              <span>Recent Projects</span>
            </h2>
            <button
              onClick={() => navigate('/projects')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>View All ({projects.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentProjects.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0e1118]/80 border border-amber-500/20 text-center space-y-3 shadow-xl">
                <FolderGit2 className="w-8 h-8 text-amber-500/40 mx-auto" />
                <p className="text-sm text-slate-400">No projects created yet.</p>
                <button
                  onClick={onOpenCreateProject || (() => navigate('/projects'))}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-black rounded-xl text-xs font-bold"
                >
                  Create First Project
                </button>
              </div>
            ) : (
              recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-5 rounded-2xl bg-[#0f121a]/90 border border-amber-500/20 hover:border-amber-400/50 flex items-center justify-between gap-4 transition-all duration-200 group shadow-xl shadow-black/70"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white group-hover:text-amber-300 transition text-base">
                        {project.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/25">
                        {project.modules?.length || 0} modules
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {project.description || 'Custom software composition'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-amber-400/60 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500/70" />
                        Updated {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/builder/${project.id}`)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-gradient-to-r hover:from-amber-400 hover:to-yellow-500 text-amber-300 hover:text-black border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Open Builder</span>
                    </button>
                    <button
                      onClick={() => exportProjectZip(project.id)}
                      title="Export ZIP package"
                      className="p-2 rounded-xl bg-[#161a26] hover:bg-[#202636] text-amber-300 hover:text-white border border-amber-500/20 transition"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recently Added Marketplace Modules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-400" />
              <span>Available Modules</span>
            </h2>
            <button
              onClick={() => navigate('/modules')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Marketplace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {recentModules.map((mod) => (
              <ModuleCard key={mod.id} module={mod} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

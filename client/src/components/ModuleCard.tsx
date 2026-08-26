import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Github, Plus, Layers, ShieldCheck, Trash2 } from 'lucide-react';
import { Module } from '../types';
import { useProjectStore } from '../store/useProjectStore';

interface ModuleCardProps {
  module: Module;
  onAddToProject?: (module: Module) => void;
  onDeleteModule?: (module: Module) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, onAddToProject, onDeleteModule }) => {
  const navigate = useNavigate();
  const { currentProject, addModuleToCurrentProject } = useProjectStore();

  const technologies =
    Array.isArray(module.technologies) && module.technologies.length > 0
      ? module.technologies
      : ['React', 'Node.js'];

  const categoryColorMap: Record<string, string> = {
    CRM: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    Accounting: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    Inventory: 'bg-amber-600/10 text-amber-400 border-amber-600/30',
    Payments: 'bg-gold-500/15 text-gold-300 border-gold-500/30',
    Authentication: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  };

  const categoryBadgeClass =
    categoryColorMap[module.categoryName] || 'bg-[#181c26] text-amber-200 border-amber-500/20';

  const isAlreadyAdded = currentProject?.modules.some(
    (pm) => (pm.module?.id || pm.moduleId) === module.id
  );

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToProject) {
      onAddToProject(module);
    } else if (currentProject) {
      addModuleToCurrentProject(module);
    } else {
      navigate('/projects');
    }
  };

  return (
    <div
      onClick={() => navigate(`/modules/${module.id}`)}
      className="glass-gold-card rounded-2xl p-5 border border-amber-500/20 hover:border-amber-400/60 cursor-pointer flex flex-col justify-between group relative overflow-hidden transition-all duration-300 shadow-xl shadow-black/80"
    >
      {/* Top Gold Accent Sheen */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${categoryBadgeClass}`}>
            {module.categoryName}
          </span>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span className="text-amber-200/80">v{module.version}</span>
            {module.sourceType === 'github' ? (
              <span
                title={
                  module.githubSyncStatus === 'update_available'
                    ? 'Update available on GitHub'
                    : 'Synced with GitHub'
                }
                className={`flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                  module.githubSyncStatus === 'update_available'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                <Github className="w-3 h-3 inline" />
                <span>{module.githubSyncStatus === 'update_available' ? 'Update' : 'Synced'}</span>
              </span>
            ) : (
              <span title="AST Verified Architecture">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 inline" />
              </span>
            )}
          </div>
        </div>

        {/* Title & Author */}
        <div className="flex items-start gap-3 mb-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-gold-sm transition-all">
            <Layers className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors text-base leading-snug">
              {module.name}
            </h3>
            <p className="text-[11px] text-amber-400/60 font-mono">by {module.author}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
          {module.description}
        </p>

        {/* Tech Stack Pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {technologies.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 rounded-lg bg-[#0e1118] border border-amber-500/15 text-[10px] text-amber-200/80 font-mono"
            >
              {tech}
            </span>
          ))}
          {technologies.length > 3 && (
            <span className="px-1.5 py-0.5 text-[10px] text-amber-400/60 font-mono">
              +{technologies.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer Stats & Actions */}
      <div className="pt-3.5 border-t border-amber-500/15 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <Download className="w-3.5 h-3.5 text-amber-400/70" />
          <span>{module.downloads} downloads</span>
        </div>

        <div className="flex items-center gap-2">
          {onDeleteModule && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteModule(module);
              }}
              className="p-1.5 rounded-lg bg-[#141722] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-amber-500/15 transition"
              title="Delete Module"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleAdd}
            disabled={isAlreadyAdded}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              isAlreadyAdded
                ? 'bg-[#181c26] text-amber-400/50 cursor-default border border-amber-500/15'
                : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-500 text-black shadow-md shadow-amber-500/25 hover:shadow-amber-500/40'
            }`}
          >
            {isAlreadyAdded ? (
              'Added ✓'
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Module</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

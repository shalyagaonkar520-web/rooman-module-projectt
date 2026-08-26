import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Download,
  Github,
  Plus,
  ArrowLeft,
  Layers,
  Sparkles,
  CheckCircle2,
  FileCode2,
  Code2,
  Terminal,
  ExternalLink,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Module, ModuleJson } from '../types';
import { useProjectStore } from '../store/useProjectStore';
import { useModuleStore } from '../store/useModuleStore';
import { useDeploymentStore } from '../store/useDeploymentStore';
import { GitRepositoryCard } from '../components/git/GitRepositoryCard';
import { DeploymentStatus } from '../components/git/DeploymentStatus';
import { DeploymentHistory } from '../components/git/DeploymentHistory';
import { VersionHistory } from '../components/git/VersionHistory';
import { DeploymentLogsModal } from '../components/git/DeploymentLogsModal';

export const ModuleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, addModuleToCurrentProject } = useProjectStore();
  const { deleteModule } = useModuleStore();
  const {
    fetchGitDetails,
    fetchDeployments,
    fetchVersions,
    subscribeToLiveDeployments,
    deployments,
    activeDeployment,
    versions,
    currentVersion,
    activeVersionId,
  } = useDeploymentStore();

  const [module, setModule] = useState<Module | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'git' | 'versions' | 'ai' | 'files'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingLogsDeploymentId, setViewingLogsDeploymentId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetch(`/api/modules/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Module not found');
        return res.json();
      })
      .then((data) => {
        setModule(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });

    fetchGitDetails(id);
    fetchDeployments(id);
    fetchVersions(id);

    const unsubscribe = subscribeToLiveDeployments(id);
    return () => unsubscribe();
  }, [id, fetchGitDetails, fetchDeployments, fetchVersions, subscribeToLiveDeployments]);

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-amber-300">Loading module specifications...</p>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4 pt-16">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error || 'Module not found'}
        </div>
        <button
          onClick={() => navigate('/modules')}
          className="px-4 py-2 bg-[#141724] text-amber-200 border border-amber-500/20 rounded-xl text-xs font-semibold"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  let parsed: ModuleJson | null = null;
  try {
    parsed = typeof module.moduleJson === 'string' ? JSON.parse(module.moduleJson) : module.moduleJson;
  } catch (e) {
    // ignore
  }

  const isAlreadyAdded = currentProject?.modules.some(
    (pm) => (pm.module?.id || pm.moduleId) === module.id
  );

  const handleDownload = () => {
    window.open(`/api/modules/${module.id}/download`, '_blank');
  };

  const handleAdd = () => {
    if (currentProject) {
      addModuleToCurrentProject(module);
      navigate(`/builder/${currentProject.id}`);
    } else {
      navigate('/projects');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 selection:bg-amber-500 selection:text-black">
      {/* Back Link */}
      <button
        onClick={() => navigate('/modules')}
        className="inline-flex items-center gap-2 text-xs font-mono text-amber-400/80 hover:text-amber-300 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Modules</span>
      </button>

      {/* Module Overview Header */}
      <div className="p-8 rounded-3xl bg-[#0e1118] border border-amber-500/25 space-y-6 relative overflow-hidden shadow-2xl shadow-black/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Layers className="w-7 h-7 text-amber-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-white">{module.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                  v{module.version}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#161a26] text-amber-200 border border-amber-500/20">
                  {module.categoryName}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                by <span className="text-amber-400 font-semibold">{module.author}</span> • Updated {new Date(module.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {module.githubUrl && (
              <a
                href={module.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#141724] hover:bg-[#1f2436] text-amber-200 text-xs font-semibold border border-amber-500/20 flex items-center gap-2 transition"
              >
                <Github className="w-4 h-4" />
                <span>View Repository</span>
              </a>
            )}

            <button
              onClick={async () => {
                let targetProjectId = currentProject?.id;
                if (!targetProjectId) {
                  const newProj = await useProjectStore.getState().createProject(`${module.name} Workspace`);
                  targetProjectId = newProj?.id;
                }
                if (targetProjectId) {
                  let pm = currentProject?.modules.find((p) => p.moduleId === module.id);
                  if (!pm) {
                    addModuleToCurrentProject(module);
                    const freshProj = useProjectStore.getState().currentProject;
                    pm = freshProj?.modules.find((p) => p.moduleId === module.id);
                  }
                  if (pm) {
                    useProjectStore.getState().startLocalModule(targetProjectId, pm.id);
                  }
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View & Run Local</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-xl bg-[#141724] hover:bg-[#1f2436] text-amber-200 text-xs font-semibold border border-amber-500/20 flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download ZIP</span>
            </button>

            <button
              onClick={handleAdd}
              disabled={isAlreadyAdded}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                isAlreadyAdded
                  ? 'bg-[#181c28] text-amber-500/40 cursor-default border border-amber-500/15'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/30'
              }`}
            >
              {isAlreadyAdded ? (
                'Added to Canvas ✓'
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add to Project</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#141724] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-amber-500/15 transition"
              title="Delete Module Folder"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed border-t border-amber-500/15 pt-4">
          {module.description}
        </p>

        {/* Quick Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 font-mono text-xs text-slate-400">
          <div>
            <span className="text-amber-500/70 block text-[10px]">TOTAL DOWNLOADS</span>
            <span className="text-white font-bold">{module.downloads}</span>
          </div>
          <div>
            <span className="text-amber-500/70 block text-[10px]">SOURCE TYPE</span>
            <span className="text-amber-300 font-bold uppercase">{module.sourceType}</span>
          </div>
          <div>
            <span className="text-amber-500/70 block text-[10px]">TECHNOLOGIES</span>
            <span className="text-white font-bold">{module.technologies?.slice(0, 2).join(', ') || 'React'}</span>
          </div>
          <div>
            <span className="text-amber-500/70 block text-[10px]">VERSION</span>
            <span className="text-amber-400 font-bold">v{module.version}</span>
          </div>
        </div>
      </div>

      {/* Git Repository Integration Card */}
      <GitRepositoryCard
        moduleId={module.id}
        moduleName={module.name}
        onOpenLogs={(depId) => setViewingLogsDeploymentId(depId)}
      />

      {/* Live Deployment Status (if active/recent) */}
      {activeDeployment && (
        <DeploymentStatus
          deployment={activeDeployment}
          onViewLogs={(depId) => setViewingLogsDeploymentId(depId)}
        />
      )}

      {/* Module Runtime Configuration Specifications */}
      <div className="p-5 rounded-2xl bg-[#0e1118] border border-amber-500/20 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>Module Runtime Configuration</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
            Active Spec (v{currentVersion || module.version})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[#08090d] border border-amber-500/15">
            <span className="text-amber-500/70 block text-[10px] uppercase">Frontend Command</span>
            <span className="text-amber-300 font-bold">{module.frontendCommand || 'npm run dev'}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#08090d] border border-amber-500/15">
            <span className="text-amber-500/70 block text-[10px] uppercase">Backend Command</span>
            <span className="text-yellow-400 font-bold">{module.backendCommand || 'None'}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#08090d] border border-amber-500/15">
            <span className="text-amber-500/70 block text-[10px] uppercase">Frontend Port / URL</span>
            <span className="text-slate-200 font-bold">{module.frontendUrl || `http://localhost:${module.frontendPort || 5173}`}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#08090d] border border-amber-500/15">
            <span className="text-amber-500/70 block text-[10px] uppercase">Working Dir</span>
            <span className="text-slate-200 font-bold">{module.workingDir || '.'}</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-amber-500/15 gap-6 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition relative whitespace-nowrap ${
            activeTab === 'overview'
              ? 'text-amber-300 border-b-2 border-amber-400 font-bold'
              : 'text-slate-400 hover:text-amber-200'
          }`}
        >
          Specifications & Schema
        </button>
        <button
          onClick={() => setActiveTab('git')}
          className={`pb-3 transition relative whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'git'
              ? 'text-amber-300 border-b-2 border-amber-400 font-bold'
              : 'text-slate-400 hover:text-amber-200'
          }`}
        >
          <Github className="w-4 h-4 text-amber-400" />
          <span>Deployments ({deployments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          className={`pb-3 transition relative whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'versions'
              ? 'text-amber-300 border-b-2 border-amber-400 font-bold'
              : 'text-slate-400 hover:text-amber-200'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Version History ({versions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 transition relative whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'ai'
              ? 'text-amber-300 border-b-2 border-amber-400 font-bold'
              : 'text-slate-400 hover:text-amber-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>AI Agent Instructions</span>
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`pb-3 transition relative whitespace-nowrap ${
            activeTab === 'files'
              ? 'text-amber-300 border-b-2 border-amber-400 font-bold'
              : 'text-slate-400 hover:text-amber-200'
          }`}
        >
          File Structure
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'git' && (
        <div className="space-y-6">
          <DeploymentHistory
            deployments={deployments}
            onViewLogs={(depId) => setViewingLogsDeploymentId(depId)}
            onRollback={(ver) => {
              const target = versions.find((v) => v.version === ver);
              if (target) {
                useDeploymentStore.getState().rollback(module.id, { version: ver, versionId: target.id });
              }
            }}
          />
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="space-y-6">
          <VersionHistory
            moduleId={module.id}
            moduleName={module.name}
            versions={versions}
            currentVersion={currentVersion || module.version}
            activeVersionId={activeVersionId}
          />
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Routes */}
          <div className="p-5 rounded-2xl bg-[#0e1118] border border-amber-500/20 space-y-3 shadow-xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>Exposed Routes & Endpoints</span>
            </h3>
            {parsed?.routes && parsed.routes.length > 0 ? (
              <ul className="space-y-1.5 font-mono text-xs">
                {parsed.routes.map((route: string, i: number) => (
                  <li key={i} className="p-2 rounded-xl bg-[#08090d] border border-amber-500/15 text-amber-300">
                    {route}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">No routes specified.</p>
            )}
          </div>

          {/* Inputs & Outputs */}
          <div className="p-5 rounded-2xl bg-[#0e1118] border border-amber-500/20 space-y-3 shadow-xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-400" />
              <span>Inputs & Output Schemas</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[11px] font-mono text-amber-500/70 block mb-1">OUTPUTS</span>
                {parsed?.outputs && parsed.outputs.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {parsed.outputs.map((out: any, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-xl bg-[#08090d] border border-amber-500/15 text-amber-300 font-mono">
                        {out.name}: <span className="text-slate-400">{out.type}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 italic">None</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="p-6 rounded-3xl bg-[#14120a] border border-amber-500/30 space-y-4 shadow-2xl">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-base">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>AI Coding Agent Integration Guide (`description_for_ai`)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-mono bg-[#08090d] p-4 rounded-2xl border border-amber-500/20">
            {parsed?.description_for_ai || 'No specific description_for_ai provided. Coding agents will analyze module entry points and schemas.'}
          </p>
          <div className="text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-amber-200 block">Antigravity Execution Tip:</span>
            <p>
              When you prompt Antigravity with this exported project, reference this module by name. Antigravity will automatically parse `PROJECT.json` and read these exact instructions.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'files' && (
        <div className="p-6 rounded-2xl bg-[#0e1118] border border-amber-500/20 space-y-4 font-mono text-xs shadow-xl">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-amber-400" />
            <span>Declared Entry Points</span>
          </h3>
          <div className="bg-[#08090d] p-4 rounded-xl border border-amber-500/15 space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500">Frontend Entry Point:</span>
              <span className="text-amber-300 font-semibold">{parsed?.entryPoints?.frontend || 'frontend/'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500">Backend Entry Point:</span>
              <span className="text-yellow-400 font-semibold">{parsed?.entryPoints?.backend || 'backend/'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0e1118] border border-amber-500/30 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl shadow-black">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Delete Module Folder?</h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete module folder <strong className="text-white">{module.name}</strong> (v{module.version})? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-[#141724] text-slate-300 text-xs font-semibold hover:bg-[#1e2336] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeleting(true);
                  const res = await deleteModule(module.id);
                  setIsDeleting(false);
                  if (res.success) {
                    navigate('/modules');
                  } else {
                    alert(res.error || 'Failed to delete module');
                  }
                }}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition"
              >
                {isDeleting ? 'Deleting...' : 'Delete Module Folder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deployment Logs Modal */}
      {viewingLogsDeploymentId && (
        <DeploymentLogsModal
          deploymentId={viewingLogsDeploymentId}
          onClose={() => setViewingLogsDeploymentId(null)}
        />
      )}
    </div>
  );
};

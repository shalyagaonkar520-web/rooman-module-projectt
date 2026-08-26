import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ModuleDetailsPage } from './pages/ModuleDetailsPage';
import { CreateModulePage } from './pages/CreateModulePage';
import { VisualBuilderPage } from './pages/VisualBuilderPage';
import { ModuleWorkspacePage } from './pages/ModuleWorkspacePage';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { MyModulesPage } from './pages/MyModulesPage';
import { MyProjectsPage } from './pages/MyProjectsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuthStore } from './store/useAuthStore';
import { useProjectStore } from './store/useProjectStore';
import { FolderGit2, Loader2, Sparkles, X } from 'lucide-react';

// ── Auth guard: redirects to /login if not authenticated ─────────────────────
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// ── Main App ──────────────────────────────────────────────────────────────────
export const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const { createProject } = useProjectStore();

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const isPublicRoute =
    location.pathname === '/' || location.pathname === '/login';
  const isBuilderRoute = location.pathname.startsWith('/builder/');
  const isWorkspaceRoute = location.pathname.includes('/workspace');
  const isInviteRoute =
    location.pathname === '/join-project' ||
    location.pathname.startsWith('/invites/');

  const handleQuickCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const project = await createProject(newProjectName, newProjectDesc);
    setIsProjectModalOpen(false);
    setNewProjectName('');
    setNewProjectDesc('');
    if (project) {
      navigate(`/builder/${project.id}`);
    }
  };

  // ── Invite acceptance — public, full screen ───────────────────────────────
  if (isInviteRoute) {
    return (
      <Routes>
        <Route path="/join-project" element={<AcceptInvitePage />} />
        <Route path="/invites/:token" element={<AcceptInvitePage />} />
      </Routes>
    );
  }

  // ── Git workspace — protected, full screen ────────────────────────────────
  if (isWorkspaceRoute) {
    return (
      <Routes>
        <Route
          path="/projects/:projectId/modules/:pmId/workspace"
          element={
            <RequireAuth>
              <ModuleWorkspacePage />
            </RequireAuth>
          }
        />
      </Routes>
    );
  }

  // ── Visual builder — protected, full screen ───────────────────────────────
  if (isBuilderRoute) {
    return (
      <Routes>
        <Route
          path="/builder/:projectId"
          element={
            <RequireAuth>
              <VisualBuilderPage />
            </RequireAuth>
          }
        />
      </Routes>
    );
  }

  // ── Public routes (landing + login) ──────────────────────────────────────
  if (isPublicRoute) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );
  }

  // ── Protected dashboard layout ────────────────────────────────────────────
  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-[#060709] text-slate-100 selection:bg-amber-500 selection:text-black">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar onOpenCreateProject={() => setIsProjectModalOpen(true)} />
          <main className="flex-1 overflow-y-auto pb-16">
            <Routes>
              <Route
                path="/dashboard"
                element={<DashboardPage onOpenCreateProject={() => setIsProjectModalOpen(true)} />}
              />
              <Route path="/modules" element={<MarketplacePage />} />
              <Route path="/modules/create" element={<CreateModulePage />} />
              <Route path="/modules/:id" element={<ModuleDetailsPage />} />
              <Route path="/my-modules" element={<MyModulesPage />} />
              <Route
                path="/projects"
                element={<MyProjectsPage onOpenCreateProject={() => setIsProjectModalOpen(true)} />}
              />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>

        {/* Global Quick Create Project Modal */}
        {isProjectModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-b from-[#13161f] to-[#0d0f14] border border-amber-500/25 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl shadow-black/90">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                    <FolderGit2 className="w-4 h-4 text-amber-400" />
                  </div>
                  <span>Create New Project</span>
                </h2>
                <button
                  onClick={() => setIsProjectModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickCreateProject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-amber-200/90">Project Name</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Sales & ERP Workspace"
                    className="w-full bg-[#08090d] border border-amber-500/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-amber-200/90">Description</label>
                  <textarea
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="Composition combining CRM, Books and Inventory..."
                    className="w-full bg-[#08090d] border border-amber-500/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 h-24"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsProjectModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#1a1e28] hover:bg-[#252b3a] border border-white/5 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-500 text-black text-xs font-bold shadow-lg shadow-amber-500/25 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create & Open Builder</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
};

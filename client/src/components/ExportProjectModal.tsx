import React, { useState } from 'react';
import { Download, Copy, Check, X, Terminal, FileCode, Package } from 'lucide-react';
import { Project } from '../types';
import { useProjectStore } from '../store/useProjectStore';

interface ExportProjectModalProps {
  project: Project;
  onClose: () => void;
}

export const ExportProjectModal: React.FC<ExportProjectModalProps> = ({ project, onClose }) => {
  const { exportProjectZip } = useProjectStore();
  const [isCopied, setIsCopied] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  let portCounter = 3000;
  const moduleRuntimeSpecs = project.modules && project.modules.length > 0
    ? project.modules
        .map((pm, idx) => {
          const modName = pm.module?.name || `Module ${idx + 1}`;
          const assignedPort = pm.module?.frontendPort && pm.module.frontendPort !== 5173
            ? pm.module.frontendPort
            : (portCounter++);
          const defaultCmd = pm.module?.frontendCommand || `npx vite --host 0.0.0.0 --port ${assignedPort} --strictPort`;
          return `  - **Module ${idx + 1}** (\`${modName}\`): Port \`${assignedPort}\` via \`${defaultCmd}\``;
        })
        .join('\n')
    : '  - No modules selected.';

  const promptText = `TASK: Unified Multi-Module Application Shell & Process Orchestrator
Create a single, unified Application Shell platform (\`/shell\`) and a background local process runner (\`/launcher\`) to run all software modules located in \`/modules\` seamlessly under ONE platform interface.

---

### ⚠️ STRICT COMPLIANCE RULES:
1. **DO NOT MODIFY MODULE CODE**: Do not rebuild, redesign, or edit any files, CSS, endpoints, database schemas, or logic inside \`/modules\`. All original modules must remain 100% intact and untouched.
2. **SINGLE UNIFIED PLATFORM**: The user must only ever need to access ONE URL (e.g. \`http://localhost:4567\`). All modules must run embedded inside this platform without spawning separate browser popups or requiring manual port navigation.

---

### 🛠️ ARCHITECTURE SPECIFICATIONS:

#### 1. Deterministic Port & Runtime Configuration (\`module-runtime.json\`)
- Assign distinct, non-overlapping ports and strict launch commands to prevent port bumping or collision:
${moduleRuntimeSpecs}
  - **Platform Host**: Port \`4567\`.

#### 2. Local Process Launcher (\`/launcher/launcher.js\`)
- An Express server running on port \`4567\` that:
  - Serves the \`/shell\` directory as static files on the root (\`http://localhost:4567\`).
  - Automatically spawns child processes for all configured modules in their respective working directories with cross-platform shell support.
  - Handles clean process termination on Windows (\`taskkill /F /T /PID\`) and POSIX (\`proc.kill()\`).
  - Does NOT automatically pop open separate browser tabs for individual ports.
  - Provides REST endpoints: \`GET /status\`, \`GET /modules\`, \`POST /start-module\`, and \`POST /stop-module\`.

#### 3. High-Speed Shell UI (\`/shell/index.html\`)
- **Aesthetic**: Premium dark glassmorphic design (\`#080c14\` background, translucent panels, glowing active status badges).
- **Sidebar**: Dashboard home view + dedicated buttons for each integrated module with real-time status dots.
- **On-Demand Lazy Loading**:
  - Do NOT load all iframes simultaneously on initial page load (prevents browser lag and high RAM/CPU usage).
  - Use \`data-src\` and inject \`iframe.src\` only when the user selects that module tab for the first time.
  - Keep active iframes loaded in memory for 0ms instant tab switching.
- **Full Hardware & API Permissions**:
  - Grant complete browser API capabilities to the embedded views:
    \`allow="accelerometer; autoplay; camera; clipboard-read; clipboard-write; display-capture; encrypted-media; fullscreen; geolocation; gyroscope; magnetometer; microphone; midi; payment; picture-in-picture; screen-wake-lock; web-share"\`
    \`allowfullscreen\`
- **Utility Header**:
  - Module title badge, port indicator, 🔄 Reload Frame button, and ↗ Popout Tab shortcut for optional full-screen viewing.

---

### ✅ EXECUTION & VERIFICATION:
1. Run \`npm install\` across all sub-projects (\`/launcher\` and each directory in \`/modules\`).
2. Verify all local ports are free and initialize any required databases cleanly.
3. Start the launcher daemon: \`node launcher/launcher.js\`.
4. Verify HTTP 200 responses across all module ports and launch \`http://localhost:4567\`.`;

  const handleDownload = () => {
    exportProjectZip(project.id);
    setHasDownloaded(true);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto selection:bg-amber-500 selection:text-black">
      <div className="bg-[#0e1118] border border-amber-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 relative my-6 shadow-black">
        {/* Header */}
        <div className="bg-[#090a0f] p-5 border-b border-amber-500/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export & Run Project</h2>
              <p className="text-xs text-slate-400">
                Download project archive and run the orchestration prompt for <strong className="text-amber-200">{project.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#181c28] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Action Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Option 1: Export ZIP */}
            <button
              onClick={handleDownload}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>{hasDownloaded ? 'Re-download ZIP' : '1. Export ZIP Archive'}</span>
            </button>

            {/* Option 2: Copy Prompt */}
            <button
              onClick={handleCopyPrompt}
              className="py-3 px-4 rounded-xl bg-[#181c28] hover:bg-[#222738] text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center justify-center gap-2 transition"
            >
              {isCopied ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4 text-amber-400" />}
              <span>{isCopied ? 'Copied Prompt ✓' : '2. Copy & Run This Prompt'}</span>
            </button>
          </div>

          {/* Prompt Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Terminal className="w-3.5 h-3.5" />
                <span>Run This Prompt (Also saved as PROMPT.md in ZIP)</span>
              </span>
              <button
                onClick={handleCopyPrompt}
                className="text-amber-400 hover:text-amber-300 font-semibold"
              >
                {isCopied ? 'Copied ✓' : 'Copy Full Prompt'}
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-[#08090d] border border-amber-500/15 text-[11px] font-mono text-slate-300 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap select-all">
              {promptText}
            </pre>
          </div>

          {/* Quick instructions */}
          <div className="p-3.5 rounded-2xl bg-[#08090d] border border-amber-500/20 text-xs text-slate-400 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Extract the exported ZIP and paste this prompt into your coding assistant to orchestrate all modules under one unified interface!
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#090a0f] border-t border-amber-500/15 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#141724] hover:bg-[#1e2336] text-amber-200 font-semibold text-xs transition border border-amber-500/15"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

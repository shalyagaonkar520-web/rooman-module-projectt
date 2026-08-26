import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  ArrowRight,
  Sparkles,
  Download,
  Terminal,
  Layers,
  Code2,
  CheckCircle2,
  Cpu,
  Workflow,
  Zap,
  Crown,
  ShieldCheck,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#060709] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Top Header */}
      <header className="h-20 border-b border-amber-500/15 px-8 flex items-center justify-between sticky top-0 bg-[#090a0f]/90 backdrop-blur-xl z-50 shadow-md shadow-black/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#07080a] rounded-[10px] flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-gold-gradient">ModuleForge</span>
            <span className="ml-2 px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 rounded border border-amber-500/30">
              GOLD EDITION
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-semibold text-amber-200/80 hover:text-amber-300 transition px-3 py-2"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/modules')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-500/25 transition flex items-center gap-2"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 text-center overflow-hidden max-w-6xl mx-auto">
        {/* Glowing Background Gold Atmospheric Spotlights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] bg-yellow-500/08 rounded-full blur-[110px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono mb-8 animate-pulse-subtle shadow-gold-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Next-Gen Visual Software Composer for AI Agents</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.15] mb-6">
          Architect with modules.{' '}
          <span className="text-gold-gradient block sm:inline">
            Ship with precision.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
          Discover reusable software modules, visually assemble microservices, and compile clean, ready-to-build architectures for AI coding agents.
        </p>

        {/* Hero CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <button
            onClick={() => navigate('/modules')}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-500 text-black font-extrabold text-sm shadow-xl shadow-amber-500/30 flex items-center gap-2.5 transition transform hover:-translate-y-0.5"
          >
            <Boxes className="w-4 h-4" />
            <span>Explore Modules</span>
          </button>
          <button
            onClick={() => navigate('/modules/create')}
            className="px-6 py-3.5 rounded-xl bg-[#11141c] hover:bg-[#181d28] text-amber-200 font-semibold text-sm border border-amber-500/25 hover:border-amber-500/50 flex items-center gap-2.5 transition shadow-lg"
          >
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>Upload Module</span>
          </button>
        </div>

        {/* Visual Workflow Diagram */}
        <div className="relative rounded-2xl bg-[#0e1118]/90 border border-amber-500/25 p-8 shadow-2xl shadow-black max-w-4xl mx-auto backdrop-blur-xl">
          <div className="absolute -top-3 left-6 px-3 py-1 bg-[#07080a] border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 rounded-md shadow-sm">
            VISUAL WORKFLOW ARCHITECTURE
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center pt-2">
            {/* Input Modules */}
            <div className="sm:col-span-2 grid grid-cols-2 gap-2.5">
              {[
                { name: 'CRM', category: 'Customer Care', color: 'border-amber-500/40 text-amber-300 bg-amber-500/10' },
                { name: 'Books', category: 'Accounting', color: 'border-yellow-500/40 text-yellow-300 bg-yellow-500/10' },
                { name: 'Inventory', category: 'Stock Control', color: 'border-amber-600/40 text-amber-400 bg-amber-600/10' },
                { name: 'Payments', category: 'Transactions', color: 'border-gold-500/40 text-gold-300 bg-gold-500/10' },
              ].map((mod) => (
                <div
                  key={mod.name}
                  className={`p-3 rounded-xl border ${mod.color} flex flex-col text-left transition transform hover:scale-105 shadow-sm`}
                >
                  <span className="font-bold text-sm text-white">{mod.name}</span>
                  <span className="text-[10px] font-mono opacity-80">{mod.category}</span>
                </div>
              ))}
            </div>

            {/* Arrow 1 */}
            <div className="flex flex-col items-center justify-center text-slate-500 font-mono text-xs py-2">
              <div className="w-8 h-8 rounded-full bg-[#181c26] border border-amber-500/30 flex items-center justify-center text-amber-400 mb-1">
                ↓
              </div>
              <span className="text-amber-200/70 text-[11px]">Compose</span>
            </div>

            {/* Project Box */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-[#181a24] to-[#10121a] border border-amber-500/40 text-center flex flex-col items-center justify-center shadow-gold-sm">
              <Code2 className="w-6 h-6 text-amber-400 mb-1" />
              <span className="font-bold text-sm text-white">Your Project</span>
              <span className="text-[10px] text-amber-300 font-mono">PROJECT.json</span>
            </div>

            {/* Arrow 2 & Export */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-xl bg-gradient-to-b from-[#1c1810] to-[#121008] border border-amber-500/50 text-center flex flex-col items-center justify-center w-full shadow-gold-sm">
                <Download className="w-5 h-5 text-amber-400 mb-1" />
                <span className="font-bold text-xs text-amber-200">Export ZIP</span>
                <span className="text-[10px] text-amber-400 font-mono">my-erp.zip</span>
              </div>
            </div>
          </div>

          {/* Antigravity Destination */}
          <div className="mt-6 pt-6 border-t border-amber-500/15 flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Target Agent:</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30">
                Antigravity / Cursor / Claude Code
              </span>
            </div>
            <span className="text-amber-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Zero-Leak AST Standard
            </span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-[#090a0f]/70 border-t border-amber-500/15 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-white mb-3">How ModuleForge Operates</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              From modular software upload to instant AI agent orchestration in structured steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload or Import',
                desc: 'Upload a ZIP or import any public GitHub repository containing a module.json file.',
                icon: Terminal,
              },
              {
                step: '02',
                title: 'AST Validation',
                desc: 'Our validation engine checks entry points, schemas, dependencies, and AI instructions.',
                icon: Workflow,
              },
              {
                step: '03',
                title: 'Visual Drag & Drop',
                desc: 'Browse the marketplace, drag CRM, Books, Inventory into your canvas, and structure your app.',
                icon: Layers,
              },
              {
                step: '04',
                title: 'Download Ready ZIP',
                desc: 'Generate a single downloadable package containing all source files, PROJECT.json, and README.md.',
                icon: Download,
              },
              {
                step: '05',
                title: 'Open in Antigravity',
                desc: 'Extract locally, open in Antigravity or your favorite coding agent, and prompt it to build the UI.',
                icon: Cpu,
              },
              {
                step: '06',
                title: 'Pristine Architecture',
                desc: 'Source code remains pristine. ModuleForge packages clean codebases without dark magic.',
                icon: Zap,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="p-6 rounded-2xl bg-[#0f121a] border border-amber-500/20 space-y-3 relative group hover:border-amber-400/60 transition-all shadow-xl shadow-black/80">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black font-mono text-amber-500/40">{item.step}</span>
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-slate-100 text-base">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-amber-500/15 py-8 px-8 text-center text-xs text-slate-500 font-mono flex flex-col sm:flex-row justify-between items-center max-w-6xl mx-auto w-full gap-4">
        <div className="text-amber-200/60">ModuleForge — Reusable Software Module Platform</div>
        <div className="text-amber-400/80 font-semibold">Engineered for Antigravity & AI Coding Agents</div>
      </footer>
    </div>
  );
};

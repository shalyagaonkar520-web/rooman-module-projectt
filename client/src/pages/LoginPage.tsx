import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Zap, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginDevMode } = useAuthStore();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const result = isRegister
      ? await register(name, email, password)
      : await login(email, password);

    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setErrorMsg(result.error ?? 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#060709] flex flex-col justify-center items-center p-6 select-none relative overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* Background Gold Ambient Spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-xl shadow-amber-500/30 mx-auto">
            <div className="w-full h-full bg-[#07080a] rounded-[14px] flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {isRegister ? 'Create Developer Workspace' : 'Welcome to ModuleForge'}
          </h1>
          <p className="text-xs text-amber-400/70 font-mono">
            High-Performance Modular Architecture Engine
          </p>
        </div>

        {/* Dev Mode Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs space-y-1.5 shadow-gold-sm">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Developer Mode Active</span>
          </div>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            Local development authentication is active. Instant sign-in available.
          </p>
        </div>

        {/* Auth Form Box */}
        <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-[#0e1118]/90 border border-amber-500/25 space-y-4 shadow-2xl shadow-black backdrop-blur-xl">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-amber-200/90">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Developer Name"
                className="w-full bg-[#07090e] border border-amber-500/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-amber-200/90">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-400/70" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@moduleforge.io"
                className="w-full bg-[#07090e] border border-amber-500/20 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-amber-200/90">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-400/70" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#07090e] border border-amber-500/20 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 font-mono"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition"
          >
            <span>{isRegister ? 'Sign Up' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

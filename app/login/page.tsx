"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { login } from "@/lib/actions/auth-actions";
import { Loader2, Eye, EyeOff, Zap, Shield, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const FEATURES = [
  { icon: Zap, title: "Autonomous Workflows", desc: "Deploy AI agents that handle complex pipelines 24/7" },
  { icon: BarChart3, title: "Revenue Intelligence", desc: "Real-time insight into what your AI has generated" },
  { icon: Shield, title: "Compliance-First", desc: "Built-in DNC, consent, and audit trail management" },
];

function LoginContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  
  const [error, setError] = useState<string | null>(urlError);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const submitRef = useRef<boolean>(false);

  // Cycle through features
  useEffect(() => {
    const t = setInterval(() => setActiveFeature(p => (p + 1) % FEATURES.length), 3000);
    return () => clearInterval(t);
  }, []);

  async function handleLogin(formData: FormData) {
    if (submitRef.current) return;
    submitRef.current = true;
    setIsPending(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      submitRef.current = false;
    }
    setIsPending(false);
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden" style={{ background: '#060A11', fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
      
      {/* Ambient blobs */}
      <div className="absolute top-[-15%] right-[-5%] w-[60%] h-[60%] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-[-15%] left-[-5%] w-[60%] h-[60%] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      {/* Left Branding Panel */}
      <div className="hidden md:flex flex-col w-[45%] p-12 justify-between relative z-10 border-r"
        style={{ background: 'rgba(10,14,20,0.95)', borderColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(40px)' }}
      >
        {/* Top dot grid decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px', width: '100%', height: '100%' }} />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="mb-12 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl p-2 border"
              style={{ background: 'rgba(0,229,255,0.08)', borderColor: 'rgba(0,229,255,0.2)', boxShadow: '0 0 20px rgba(0,229,255,0.15)' }}
            >
              <img src="/logo.png" alt="Knoxified" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.4))' }} />
            </div>
            <div>
              <p className="font-extrabold text-lg text-white tracking-wide">Knoxified OS</p>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#00E5FF', opacity: 0.7 }}>Enterprise</p>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.1] mb-5 tracking-tight max-w-md">
            Manage your Enterprise AI Systems{' '}
            <span style={{ background: 'linear-gradient(135deg, #00E5FF, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              with Precision.
            </span>
          </h1>
          <p className="text-white/40 text-base max-w-md mb-3 leading-relaxed">
            The unified platform for orchestrating autonomous workflows, scaling voice agents, and driving compliance-first automation.
          </p>
          <p className="text-sm tracking-widest uppercase font-bold" style={{ color: '#00E5FF', opacity: 0.6 }}>&quot;Think. Automate. Elevate&quot;</p>

          {/* Animated feature cards */}
          <div className="mt-12 space-y-2">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const isActive = activeFeature === i;
              return (
                <div 
                  key={i}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all duration-500"
                  style={{
                    background: isActive ? 'rgba(0,229,255,0.05)' : 'rgba(255,255,255,0.02)',
                    borderColor: isActive ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.04)',
                    boxShadow: isActive ? '0 0 20px rgba(0,229,255,0.08)' : 'none',
                    transform: isActive ? 'translateX(4px)' : 'none'
                  }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                    style={{ background: isActive ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.04)' }}
                  >
                    <Icon size={16} style={{ color: isActive ? '#00E5FF' : 'rgba(255,255,255,0.3)', filter: isActive ? 'drop-shadow(0 0 5px rgba(0,229,255,0.6))' : 'none' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold transition-colors" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' }}>{f.title}</p>
                    <p className="text-[12px] transition-colors" style={{ color: isActive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="relative z-10 text-[12px] text-white/20 font-medium">
          &copy; {new Date().getFullYear()} Knoxified. All rights reserved.
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10">
        
        {/* Mobile branding */}
        <div className="md:hidden flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl p-2.5 border mb-4" style={{ background: 'rgba(0,229,255,0.08)', borderColor: 'rgba(0,229,255,0.2)' }}>
            <img src="/logo.png" alt="Knoxified" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.4))' }} />
          </div>
          <p className="font-extrabold text-white text-xl">Knoxified OS</p>
          <p className="text-[11px] font-bold uppercase tracking-widest mt-1" style={{ color: '#00E5FF', opacity: 0.7 }}>Enterprise</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="relative rounded-3xl border overflow-hidden"
            style={{ 
              background: 'rgba(15, 22, 36, 0.8)', 
              borderColor: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(40px)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
            }}
          >
            {/* Top accent bar */}
            <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, #00E5FF, #8b5cf6, transparent)' }} />
            {/* Subtle corner glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)', filter: 'blur(20px)' }} />
            
            <div className="p-8 relative z-10">
              <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-white mb-1.5 tracking-tight">Welcome back</h2>
                <p className="text-white/40 text-sm font-medium">Sign in to your enterprise dashboard.</p>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm flex items-start gap-3 mb-6 backdrop-blur-sm">
                  <svg className="mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                  <p>{error}</p>
                </div>
              )}

              <form action={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-bold text-white/40 uppercase tracking-wider" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full border rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/20 transition-all"
                    style={{ 
                      background: 'rgba(255,255,255,0.04)', 
                      borderColor: 'rgba(255,255,255,0.08)',
                    }}
                    placeholder="name@company.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[12px] font-bold text-white/40 uppercase tracking-wider" htmlFor="password">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-[12px] font-semibold hover:opacity-70 transition-opacity" style={{ color: '#00E5FF' }}>
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      required
                      className="w-full border rounded-2xl pl-4 pr-12 py-3 text-white text-sm placeholder:text-white/20 transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-white/60 transition-colors rounded-lg"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full text-slate-900 font-bold py-3 rounded-2xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  style={{ 
                    background: 'linear-gradient(135deg, #00E5FF 0%, #3b82f6 100%)',
                    boxShadow: '0 0 24px rgba(0,229,255,0.3), 0 4px 12px rgba(0,0,0,0.3)'
                  }}
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </button>

                <button 
                  type="button" 
                  onClick={() => { document.cookie = "bypass_login=true; path=/"; window.location.href = "/"; }} 
                  className="w-full text-white/50 hover:text-white/80 border font-semibold py-3 rounded-2xl transition-all flex items-center justify-center text-sm"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  Bypass Login (Dev Mode)
                </button>
              </form>
            </div>
          </div>

          <div className="pt-5 text-center">
            <p className="text-white/30 text-sm font-medium">
              Don&apos;t have an account?{" "}
              <a
                href="https://knoxified.org/get-started"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold hover:opacity-70 transition-opacity"
                style={{ color: '#00E5FF' }}
              >
                Get Started
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060A11' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl p-2 border" style={{ background: 'rgba(0,229,255,0.08)', borderColor: 'rgba(0,229,255,0.2)' }}>
            <img src="/logo.png" alt="" className="w-full h-full object-contain" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#00E5FF' }} />
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

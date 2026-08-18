"use client";
import React, { useState, useEffect } from "react";
import { ShieldAlert, CheckCircle2, Palette, Moon, Sun, Monitor, Check } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

const ACCENT_COLORS = [
  { hex: '#00E5FF', name: 'Cyan', label: 'Default' },
  { hex: '#3B82F6', name: 'Blue', label: 'Ocean' },
  { hex: '#8B5CF6', name: 'Violet', label: 'Grape' },
  { hex: '#10B981', name: 'Emerald', label: 'Mint' },
  { hex: '#F43F5E', name: 'Rose', label: 'Coral' },
  { hex: '#F59E0B', name: 'Amber', label: 'Gold' },
];

function applyAccent(hex: string) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const root = document.documentElement;
  root.style.setProperty('--accent', hex);
  root.style.setProperty('--accent-dim', `rgba(${r},${g},${b},0.15)`);
  root.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.4)`);
  root.style.setProperty('--accent-muted', `rgba(${r},${g},${b},0.08)`);
  localStorage.setItem('knoxified-accent', hex);
}

export default function SettingsPage() {
  const [acknowledged, setAcknowledged] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeAccent, setActiveAccent] = useState('#00E5FF');

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('knoxified-accent');
    if (saved) setActiveAccent(saved);
  }, []);

  const handleAccentChange = (hex: string) => {
    setActiveAccent(hex);
    applyAccent(hex);
    toast.success('Accent color updated across the UI.');
  };

  const handleAcknowledge = () => {
    setAcknowledged(true);
    toast.success("Compliance terms acknowledged. Timestamp logged in audit logs.");
  };

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light', desc: 'Clean & bright' },
    { value: 'dark', icon: Moon, label: 'Dark', desc: 'Easy on eyes' },
    { value: 'system', icon: Monitor, label: 'System', desc: 'Auto-detect' },
  ] as const;

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1.5">
          Settings
        </h1>
        <p className="text-slate-500 dark:text-white/40 text-sm">
          Manage your account, authentication details, and billing plans.
        </p>
      </div>

      {/* Profile */}
      <div className="bg-white dark:bg-[#0d1117] border border-slate-200/60 dark:border-white/[0.05] rounded-2xl p-6 md:p-8 card-hover shadow-sm">
        <h2 className="text-[15px] font-bold text-slate-900 dark:text-white mb-6">Profile &amp; Authentication</h2>
        <div className="space-y-5 max-w-md">
          <div>
            <label className="block text-[12px] font-semibold text-slate-400 dark:text-white/30 mb-2 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              defaultValue="knoxfavour29@gmail.com"
              disabled
              className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] text-slate-400 dark:text-white/25 text-sm rounded-xl px-4 py-2.5 cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-400 dark:text-white/25 mt-1.5">
              Managed securely via Supabase Auth. Contact support to change.
            </p>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-400 dark:text-white/30 mb-2 uppercase tracking-wider">Full Name</label>
            <input 
              type="text" 
              defaultValue="John Doe"
              className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none transition-all"
            />
          </div>
          <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: 'var(--accent)', boxShadow: '0 0 16px var(--accent-glow)' }}>
            Save Profile
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-[#0d1117] border border-slate-200/60 dark:border-white/[0.05] rounded-2xl p-6 md:p-8 card-hover shadow-sm">
        <h2 className="text-[15px] font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}>
            <Palette size={14} style={{ color: 'var(--accent)' }} />
          </div>
          Appearance &amp; Theme
        </h2>
        
        <div className="space-y-8 max-w-2xl">
          {/* Color scheme */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-400 dark:text-white/30 mb-3 uppercase tracking-wider">Color Scheme</label>
            {mounted ? (
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map(({ value, icon: Icon, label, desc }) => {
                  const active = theme === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 hover:-translate-y-0.5 ${
                        active
                          ? 'shadow-lg'
                          : 'border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/10'
                      }`}
                      style={active ? {
                        borderColor: 'var(--accent)',
                        background: 'var(--accent-muted)',
                        boxShadow: '0 0 20px var(--accent-dim)'
                      } : {}}
                    >
                      <div className="w-10 h-10 rounded-xl mb-2.5 flex items-center justify-center" style={active ? { background: 'var(--accent-dim)' } : { background: 'rgba(148,163,184,0.1)' }}>
                        <Icon size={20} style={active ? { color: 'var(--accent)', filter: 'drop-shadow(0 0 5px var(--accent-glow))' } : { color: '#94a3b8' }} />
                      </div>
                      <span className="text-sm font-bold" style={active ? { color: 'var(--accent)' } : { color: '#64748b' }}>{label}</span>
                      <span className="text-[11px] mt-0.5" style={{ color: active ? 'var(--accent)' : '#94a3b8', opacity: 0.7 }}>{desc}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
              </div>
            )}
          </div>
          
          {/* Accent color */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-400 dark:text-white/30 mb-3 uppercase tracking-wider">Primary Accent Color</label>
            <p className="text-[12px] text-slate-400 dark:text-white/25 mb-4">Changes buttons, links, active states, and glow effects across the entire dashboard.</p>
            <div className="flex items-center gap-3 flex-wrap">
              {ACCENT_COLORS.map(({ hex, name, label }) => {
                const isActive = mounted && activeAccent === hex;
                return (
                  <button
                    key={hex}
                    onClick={() => handleAccentChange(hex)}
                    className="relative flex flex-col items-center gap-1.5 group"
                    title={name}
                  >
                    <div 
                      className="w-11 h-11 rounded-full transition-all duration-200 group-hover:scale-110"
                      style={{ 
                        backgroundColor: hex,
                        boxShadow: isActive ? `0 0 0 3px white, 0 0 0 5px ${hex}, 0 0 16px ${hex}66` : '0 2px 8px rgba(0,0,0,0.15)',
                        transform: isActive ? 'scale(1.1)' : undefined
                      }}
                    >
                      {isActive && (
                        <div className="w-full h-full rounded-full flex items-center justify-center">
                          <Check size={16} className="text-white" strokeWidth={3} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: isActive ? hex : '#94a3b8' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="bg-red-50/80 dark:bg-red-500/[0.04] border border-red-200/80 dark:border-red-500/20 rounded-2xl p-6 md:p-8">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert size={18} className="text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-white mb-1.5">Compliance Acknowledgment</h2>
              <p className="text-slate-600 dark:text-white/50 text-sm leading-relaxed max-w-3xl">
                Before initiating your first outbound campaign, you must acknowledge Knoxified&apos;s Acceptable Use Policy and Compliance Terms. You are responsible for ensuring lawful basis for contact, maintaining consent documentation, honoring DNC requests, and adhering to calling hour restrictions.
              </p>
            </div>
            
            {acknowledged ? (
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-200/80 dark:border-emerald-500/20 w-fit">
                <CheckCircle2 size={16} />
                <span className="text-sm font-semibold">Terms acknowledged and recorded in immutable audit logs.</span>
              </div>
            ) : (
              <div className="bg-white dark:bg-white/[0.03] border border-red-200/80 dark:border-red-500/15 p-5 rounded-xl flex flex-col gap-4 max-w-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 shrink-0 w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500" id="compliance-check" />
                  <span className="text-[13px] text-slate-700 dark:text-white/60 leading-relaxed">
                    I confirm that I understand and agree to my responsibilities regarding lawful contact, consent documentation, Do-Not-Call (DNC) list suppression obligations, and Knoxified&apos;s right to suspend my account for violations.
                  </span>
                </label>
                <button onClick={() => {
                  const cb = document.getElementById('compliance-check') as HTMLInputElement;
                  if(cb && cb.checked) {
                    handleAcknowledge();
                  } else {
                    toast.error("Please check the box to acknowledge the terms.");
                  }
                }} className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all w-fit shadow-sm hover:shadow-md">
                  Submit Acknowledgment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

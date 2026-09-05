"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, BrainCircuit, Play, Settings, X, ShieldCheck, RefreshCcw, Volume2 } from "lucide-react";
import { useSystems } from "@/lib/services/hooks";
import { toggleSystemActivation } from "@/lib/actions/dashboard-actions";

const TIER_LABELS: Record<string, string> = { pro: "Pro Tier", enterprise: "Enterprise Tier", custom: "Custom" };

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

export default function SystemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: systems, loading, setData } = useSystems();
  const [showConfig, setShowConfig] = useState(false);
  const [recordingEnabled, setRecordingEnabled] = useState(true);
  const [isPending, startTransition] = useTransition();

  if (loading) {
    return <div className="animate-pulse glass-card rounded-xl h-[400px] w-full"></div>;
  }

  const system = systems.find((s) => s.id === params.id);

  if (!system) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BrainCircuit className="text-amber-500 dark:text-[#F59E0B] mb-4" size={32} />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">System Not Found</h2>
        <p className="text-slate-500 dark:text-[#888] mb-6">The system you are looking for does not exist or has been removed.</p>
        <button onClick={() => router.push('/systems')} className="text-[color:var(--accent)] hover:opacity-80 text-sm font-medium">Return to Systems</button>
      </div>
    );
  }

  const isActive = system.isEnabled;
  const isCustom = system.tier === "custom";

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleSystemActivation(system.id, !isActive);
      if (result?.error === "locked") {
        toast.error("This account is locked to browsing only. Upgrade to a paid plan to activate systems.");
        return;
      }
      if (result?.error) {
        toast.error("Couldn't update that system: " + result.error);
        return;
      }
      setData((prev) =>
        prev.map((s) =>
          s.id === system.id
            ? { ...s, isEnabled: !isActive, activatedAt: !isActive ? new Date().toISOString() : null }
            : s
        )
      );
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <nav className="flex items-center text-sm font-medium mb-4 space-x-2">
          <button
            onClick={() => router.push('/systems')}
            className="text-slate-500 dark:text-[#888] hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={14} className="mr-1" />
            Systems
          </button>
          <span className="text-slate-300 dark:text-[#444]">/</span>
          <span className="text-slate-900 dark:text-white">{system.name}</span>
        </nav>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${isActive ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent)] border-[color:var(--accent)]/30' : 'bg-slate-50 dark:bg-[#020617] text-slate-400 dark:text-[#666] border-slate-200 dark:border-white/5'}`}>
              <BrainCircuit size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{system.name}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-[#888] border-slate-200 dark:border-transparent">
                  {TIER_LABELS[system.tier] || system.tier}
                </span>
                {isActive && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-[#10B981]">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                    Active{system.activatedAt ? ` since ${timeAgo(system.activatedAt)}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowConfig(true)} className="px-4 py-2 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
              <Settings size={16} /> Configuration
            </button>
            {!isCustom && (
              <button
                onClick={handleToggle}
                disabled={isPending}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-transparent text-red-500 dark:text-[#EF4444] hover:bg-red-100 dark:bg-[#EF4444]/10 border border-[#EF4444]'
                    : 'bg-[color:var(--accent)] text-slate-900 hover:opacity-90 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                }`}
              >
                {isPending ? <RefreshCcw size={16} className="animate-spin" /> : <Play size={16} />}
                {isActive ? 'Deactivate System' : 'Activate System'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F172A] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Settings size={18} className="text-[color:var(--accent)]"/> System Configuration</h2>
              <button onClick={() => setShowConfig(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="bg-slate-50 dark:bg-[#020617]/50 rounded-lg border border-slate-200 dark:border-white/5 p-5">
                 <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                   <ShieldCheck size={16} className="text-emerald-600 dark:text-[#10B981]" /> Compliance & Legal Settings
                 </h3>
                 <p className="text-xs text-slate-500 dark:text-[#888] mb-6 max-w-lg">These settings are enforced by default to ensure all outbound voice agents operate within legal requirements for AI disclosure and call recording.</p>

                 <div className="space-y-6">
                   <div className="flex items-start justify-between">
                     <div>
                       <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">AI Identification Disclosure (Default-On)</p>
                       <p className="text-xs text-slate-500 dark:text-[#888] max-w-md">Every Voice Agent call will open with a disclosure that the recipient is speaking with an AI system. This cannot be disabled here.</p>
                     </div>
                     <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-not-allowed opacity-80" title="Enforced by System">
                       <div className="absolute right-1 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                     </div>
                   </div>

                   <div className="flex items-start justify-between pt-4 border-t border-slate-200 dark:border-white/5">
                     <div>
                       <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Call Recording & Disclosure</p>
                       <p className="text-xs text-slate-500 dark:text-[#888] max-w-md">When enabled, all calls are recorded and a recording disclosure is announced near the start. Disabling this logs an entry to the Immutable Audit Logs.</p>
                     </div>
                     <button
                       onClick={() => setRecordingEnabled(!recordingEnabled)}
                       className={`w-10 h-5 rounded-full relative transition-colors ${recordingEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                     >
                       <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${recordingEnabled ? 'right-1' : 'left-1'}`}></div>
                     </button>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-6">
        <p className="text-slate-500 dark:text-[#888] text-[15px] leading-relaxed">{system.description}</p>
      </div>

      {isActive ? (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-2 mb-2">
            <Volume2 size={18} className="text-[color:var(--accent)]" /> Voice Agent Tuning
          </h3>
          <p className="text-slate-500 dark:text-[#888] text-sm leading-relaxed">
            Your voice agent now speaks with {system.name.toLowerCase()}-specific knowledge and tone on every call, in
            addition to your Business Memory from Agent Config. Real call activity for this system shows up in{" "}
            <button onClick={() => router.push('/conversations')} className="text-[color:var(--accent)] hover:underline font-medium">Conversations</button>.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0F172A] rounded-xl border-dashed">
          <BrainCircuit className="text-slate-300 dark:text-[#333] mb-4" size={48} />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">System is Offline</h2>
          <p className="text-slate-500 dark:text-[#888] mb-6 max-w-sm">
            {isCustom
              ? "This is a bespoke build -- reach out and we'll scope it with you."
              : "Activate this system to give your voice agent this industry's knowledge and tone."}
          </p>
          {isCustom ? (
            <a href="mailto:hello@knoxified.org?subject=Custom%20Agent%20System" className="px-5 py-2.5 bg-amber-500 text-slate-900 text-sm font-semibold rounded-lg transition-all hover:opacity-90 flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              Talk to Us
            </a>
          ) : (
            <button
              onClick={handleToggle}
              disabled={isPending}
              className="px-5 py-2.5 bg-[color:var(--accent)] text-slate-900 text-sm font-semibold rounded-lg transition-all hover:opacity-90 flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.3)]"
            >
              {isPending ? <RefreshCcw size={16} className="animate-spin" /> : <Play size={16} />}
              Activate System
            </button>
          )}
        </div>
      )}
    </div>
  );
}

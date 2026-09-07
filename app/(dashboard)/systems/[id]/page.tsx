"use client";

import { useState, useTransition, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, BrainCircuit, Play, Settings, X, ShieldCheck, RefreshCcw, Volume2, Phone, Brain, Check, AlertTriangle } from "lucide-react";

const TIER_ACCENT: Record<string, { icon: string; iconActive: string; badge: string; button: string }> = {
  pro: { icon: "text-slate-400 dark:text-[#666]", iconActive: "bg-[color:var(--accent)]/10 text-[color:var(--accent)] border-[color:var(--accent)]/30", badge: "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-[#888]", button: "bg-[color:var(--accent)] text-slate-900 shadow-[0_0_15px_rgba(0,229,255,0.3)]" },
  enterprise: { icon: "text-slate-400 dark:text-[#666]", iconActive: "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/30", badge: "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300", button: "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)]" },
  custom: { icon: "text-slate-400 dark:text-[#666]", iconActive: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30", badge: "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400", button: "bg-amber-500 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.3)]" },
};
import { useSystems } from "@/lib/services/hooks";
import { toggleSystemActivation } from "@/lib/actions/dashboard-actions";
import { getAgentIdentity } from "@/lib/actions/agent-identity-actions";
import { getSystemAutomations, toggleUserAutomation, getAgentReadiness, SystemAutomation } from "@/lib/actions/system-automation-actions";
import { AgentAvatar } from "@/components/AgentAvatar";

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
  const [identity, setIdentity] = useState({ agentNickname: "Alex", agentAvatar: "bot", organizationName: "" });
  const [automations, setAutomations] = useState<SystemAutomation[]>([]);
  const [automationsLoading, setAutomationsLoading] = useState(true);
  const [pendingAutomationId, setPendingAutomationId] = useState<string | null>(null);
  const [readiness, setReadiness] = useState({ hasPhoneNumber: false, hasMemory: false });
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    getAgentIdentity().then(setIdentity);
    getAgentReadiness().then(setReadiness);
  }, []);

  useEffect(() => {
    if (typeof params.id !== "string") return;
    setAutomationsLoading(true);
    getSystemAutomations(params.id).then((result) => {
      setAutomations(result.automations);
      setAutomationsLoading(false);
    });
  }, [params.id]);

  const handlePreviewVoice = () => {
    setIsPreviewing(true);
    import("@/lib/actions/voice-preview-actions").then(async ({ previewAgentVoice }) => {
      const result = await previewAgentVoice();
      setIsPreviewing(false);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.audioDataUrl) {
        new Audio(result.audioDataUrl).play();
      }
    });
  };

  const handleToggleAutomation = (automation: SystemAutomation) => {
    setPendingAutomationId(automation.id);
    startTransition(async () => {
      const result = await toggleUserAutomation(automation.id, automation.key, !automation.isEnabled);
      setPendingAutomationId(null);
      if (result?.error === "locked") {
        toast.error("This account is locked to browsing only. Upgrade to a paid plan to activate automations.");
        return;
      }
      if (result?.error === "slot_limit") {
        toast.error(`Your plan allows ${result.limit} active automation slot${result.limit === 1 ? "" : "s"} (${result.used} in use). Upgrade to activate more.`);
        return;
      }
      if (result?.error) {
        toast.error("Couldn't update that automation: " + result.error);
        return;
      }
      setAutomations((prev) => prev.map((a) => (a.id === automation.id ? { ...a, isEnabled: !automation.isEnabled } : a)));
      // This automation may also belong to other systems (see
      // toggleUserAutomation) -- refresh the current system's own derived
      // active/percentage from the source of truth rather than guessing.
      if (typeof params.id === "string") {
        const refreshed = await getSystemAutomations(params.id);
        setAutomations(refreshed.automations);
      }
    });
  };

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

  const isCustom = system.tier === "custom";
  const isPro = system.tier === "pro";
  const accent = TIER_ACCENT[system.tier] || TIER_ACCENT.pro;

  const enabledAutomationCount = automations.filter((a) => a.isEnabled).length;
  const totalAutomationCount = automations.length;
  const activationPercent = totalAutomationCount > 0 ? Math.round((enabledAutomationCount / totalAutomationCount) * 100) : 0;
  // Pro-tier systems derive "active" from their automations (see
  // toggleUserAutomation) rather than a manual toggle -- use that as the
  // source of truth here instead of system.isEnabled, which only refreshes
  // on a full page reload of useSystems().
  const isActive = isPro ? activationPercent === 100 && totalAutomationCount > 0 : system.isEnabled;

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
            {isPro ? (
              <AgentAvatar avatarKey={identity.agentAvatar} size="lg" />
            ) : (
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${isActive ? accent.iconActive : 'bg-slate-50 dark:bg-[#020617] text-slate-400 dark:text-[#666] border-slate-200 dark:border-white/5'}`}>
                <BrainCircuit size={28} />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{system.name}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border border-transparent ${accent.badge}`}>
                  {TIER_LABELS[system.tier] || system.tier}
                </span>
                {isActive ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-[#10B981]">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                    Active{system.activatedAt ? ` since ${timeAgo(system.activatedAt)}` : ""}
                  </span>
                ) : isPro && totalAutomationCount > 0 ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {activationPercent}% Active
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowConfig(true)} className="px-4 py-2 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
              <Settings size={16} /> Configuration
            </button>
            {!isCustom && !isPro && (
              <button
                onClick={handleToggle}
                disabled={isPending}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-transparent text-red-500 dark:text-[#EF4444] hover:bg-red-100 dark:bg-[#EF4444]/10 border border-[#EF4444]'
                    : `${accent.button} hover:opacity-90`
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

      {isPro ? (
        <>
          {/* Voice agent interface -- this agent is inbound-only, it never
              places outbound calls on its own */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-4">
                <AgentAvatar avatarKey={identity.agentAvatar} size="lg" />
                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{identity.agentNickname}</p>
                  <p className="text-[13px] text-slate-500 dark:text-[#888]">
                    {identity.organizationName ? `Answering for ${identity.organizationName}` : "Your voice agent"} &middot; Inbound calls only
                  </p>
                </div>
              </div>
              <button
                onClick={handlePreviewVoice}
                disabled={isPreviewing}
                className="flex items-center justify-center gap-2 bg-[color:var(--accent)] text-slate-900 px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(0,229,255,0.25)] shrink-0"
              >
                {isPreviewing ? <RefreshCcw size={16} className="animate-spin" /> : <Volume2 size={16} />}
                {isPreviewing ? "Generating..." : "Preview Voice"}
              </button>
            </div>

            {/* Readiness checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`flex items-center gap-3 rounded-lg p-3 border ${readiness.hasPhoneNumber ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20" : "bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${readiness.hasPhoneNumber ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"}`}>
                  {readiness.hasPhoneNumber ? <Check size={16} /> : <AlertTriangle size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Phone number</p>
                  {readiness.hasPhoneNumber ? (
                    <p className="text-[12px] text-emerald-700 dark:text-emerald-400">Forwarding connected</p>
                  ) : (
                    <button onClick={() => router.push("/agent-config")} className="text-[12px] text-amber-700 dark:text-amber-400 hover:underline">Not set &mdash; add one</button>
                  )}
                </div>
              </div>
              <div className={`flex items-center gap-3 rounded-lg p-3 border ${readiness.hasMemory ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20" : "bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${readiness.hasMemory ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"}`}>
                  {readiness.hasMemory ? <Check size={16} /> : <AlertTriangle size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Business memory</p>
                  {readiness.hasMemory ? (
                    <p className="text-[12px] text-emerald-700 dark:text-emerald-400">Set</p>
                  ) : (
                    <button onClick={() => router.push("/agent-config")} className="text-[12px] text-amber-700 dark:text-amber-400 hover:underline">Not set &mdash; add one</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Automations for this system -- ALL of them need to be active
              for the system itself to count as Active (see
              toggleUserAutomation), not a single button */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 dark:text-white font-semibold text-base">Automations</h3>
              {totalAutomationCount > 0 && (
                <span className="text-[13px] font-medium text-slate-500 dark:text-[#888]">{enabledAutomationCount} of {totalAutomationCount} active</span>
              )}
            </div>

            {totalAutomationCount > 0 && (
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden mb-5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${activationPercent === 100 ? "bg-emerald-500" : "bg-amber-500"}`}
                  style={{ width: `${activationPercent}%` }}
                />
              </div>
            )}

            {automationsLoading ? (
              <div className="animate-pulse grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-white/5" />)}
              </div>
            ) : automations.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-[#666] text-center py-8">
                Automations for this system haven't been connected yet &mdash; check back soon.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {automations.map((a) => {
                  const isRowPending = isPending && pendingAutomationId === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => handleToggleAutomation(a)}
                      disabled={isRowPending}
                      className={`relative flex flex-col items-center text-center gap-2 rounded-xl p-4 border backdrop-blur-md transition-all disabled:opacity-60 ${
                        a.isEnabled
                          ? "bg-gradient-to-br from-white to-emerald-50 dark:from-[#0F172A] dark:to-emerald-950/30 border-emerald-300 dark:border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.12)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                          : "bg-gradient-to-br from-white to-amber-50/60 dark:from-[#0F172A] dark:to-amber-950/10 border-amber-200 dark:border-amber-500/20 hover:border-amber-400 dark:hover:border-amber-400/50"
                      }`}
                    >
                      <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${a.isEnabled ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" : "bg-amber-400"}`} />
                      <span className="text-2xl">{isRowPending ? <RefreshCcw size={22} className="animate-spin mx-auto" /> : a.icon || "⚡"}</span>
                      <span className="text-[12px] font-semibold text-slate-900 dark:text-white leading-tight">{a.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : isActive ? (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-2 mb-2">
            <Volume2 size={18} className="text-[color:var(--accent)]" /> Voice Agent Tuning
          </h3>
          <div className="flex items-center gap-3 mb-3">
            <AgentAvatar avatarKey={identity.agentAvatar} size="sm" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{identity.agentNickname}</p>
          </div>
          <p className="text-slate-500 dark:text-[#888] text-sm leading-relaxed">
            {identity.agentNickname} now speaks with {system.name.toLowerCase()}-specific knowledge and tone on every call, in
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
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all hover:opacity-90 flex items-center gap-2 ${accent.button}`}
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

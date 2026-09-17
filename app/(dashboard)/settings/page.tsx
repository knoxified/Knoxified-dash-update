"use client";
import React, { useState, useEffect, useTransition } from "react";
import { ShieldAlert, CheckCircle2, Palette, Moon, Sun, Monitor, Check, PhoneOff, Lock, History, FileText, AlertTriangle, Plus, Search, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  getSuppressionList,
  addToSuppressionList,
  removeFromSuppressionList,
  getAuditLogs,
  getDisclosureSettings,
  toggleRecordingDisclosure,
  getComplianceAcknowledgment,
  submitComplianceAcknowledgment,
} from "@/lib/actions/compliance-actions";

const ACCENT_COLORS = [
  { hex: '#00E5FF', name: 'Cyan', label: 'Default' },
  { hex: '#3B82F6', name: 'Blue', label: 'Ocean' },
  { hex: '#8B5CF6', name: 'Violet', label: 'Grape' },
  { hex: '#10B981', name: 'Emerald', label: 'Mint' },
  { hex: '#F43F5E', name: 'Rose', label: 'Coral' },
  { hex: '#F59E0B', name: 'Amber', label: 'Gold' },
];

// Bump this whenever any of the linked policy documents materially change --
// re-prompts everyone to accept again, and keeps an honest record of which
// version of the policies each person actually agreed to.
const CURRENT_POLICY_VERSION = "2026-09-17";

const POLICY_LINKS = [
  { label: "Terms and Conditions", href: "https://knoxified.org/legal/terms" },
  { label: "Privacy Policy", href: "https://knoxified.org/legal/privacy" },
  { label: "Acceptable Use Policy", href: "https://knoxified.org/legal/acceptable-use" },
  { label: "AI Calling Guide", href: "https://knoxified.org/legal/ai-calling-guide" },
  { label: "Data Processing Agreement", href: "https://knoxified.org/legal/dpa" },
  { label: "Refund Policy", href: "https://knoxified.org/legal/refunds" },
  { label: "Compliance Page", href: "https://knoxified.org/legal/compliance" },
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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeAccent, setActiveAccent] = useState('#00E5FF');

  // Real profile + compliance status, not hardcoded placeholders
  const [profile, setProfile] = useState<{ fullName: string | null; email: string | null }>({ fullName: null, email: null });
  const [acknowledgedAt, setAcknowledgedAt] = useState<string | null>(null);
  const [agreedVersion, setAgreedVersion] = useState<string | null>(null);
  const [checkedBox, setCheckedBox] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Compliance data moved in from the standalone Compliance page
  const [suppressionList, setSuppressionList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [recordingDisclosure, setRecordingDisclosure] = useState(true);
  const [newPhone, setNewPhone] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('knoxified-accent');
    if (saved) setActiveAccent(saved);

    async function loadData() {
      try {
        const [suppression, logs, disclosure, compliance] = await Promise.all([
          getSuppressionList(),
          getAuditLogs(),
          getDisclosureSettings(),
          getComplianceAcknowledgment(),
        ]);
        setSuppressionList(suppression);
        setAuditLogs(logs);
        setRecordingDisclosure(disclosure.require_recording_disclosure);
        setAcknowledgedAt(compliance.acknowledgedAt);
        setAgreedVersion(compliance.agreedVersion);
        setProfile({ fullName: compliance.fullName, email: compliance.email });
      } catch (err: any) {
        setLoadError(err.message);
        toast.error("Failed to load account data — see console for details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAccentChange = (hex: string) => {
    setActiveAccent(hex);
    applyAccent(hex);
    toast.success('Accent color updated across the UI.');
  };

  const handleAcknowledge = () => {
    if (!checkedBox) {
      toast.error("Check the box to confirm you've read and agree to the policies first.");
      return;
    }
    startTransition(async () => {
      try {
        await submitComplianceAcknowledgment(CURRENT_POLICY_VERSION);
        setAcknowledgedAt(new Date().toISOString());
        setAgreedVersion(CURRENT_POLICY_VERSION);
        const logs = await getAuditLogs();
        setAuditLogs(logs);
        toast.success("Policies acknowledged and recorded.");
      } catch (err: any) {
        toast.error(`Failed to record acknowledgment: ${err.message}`);
      }
    });
  };

  const handleAddSuppression = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = newPhone.trim();
    if (!normalizedPhone) return;
    if (suppressionList.some(entry => entry.phone_number === normalizedPhone)) {
      toast.error(`${normalizedPhone} is already on the suppression list.`);
      return;
    }
    startTransition(async () => {
      try {
        await addToSuppressionList(normalizedPhone, "manual_upload");
        const [suppression, logs] = await Promise.all([getSuppressionList(), getAuditLogs()]);
        setSuppressionList(suppression);
        setAuditLogs(logs);
        setNewPhone("");
        toast.success("Number added to suppression list");
      } catch (err: any) {
        toast.error(`Failed to add number: ${err.message}`);
      }
    });
  };

  const handleRemoveSuppression = (id: string, phone: string) => {
    startTransition(async () => {
      try {
        await removeFromSuppressionList(id, phone);
        const [suppression, logs] = await Promise.all([getSuppressionList(), getAuditLogs()]);
        setSuppressionList(suppression);
        setAuditLogs(logs);
        toast.success("Number removed from suppression list");
      } catch (err: any) {
        toast.error(`Failed to remove number: ${err.message}`);
      }
    });
  };

  const handleToggleDisclosure = (enabled: boolean) => {
    startTransition(async () => {
      try {
        await toggleRecordingDisclosure(enabled);
        setRecordingDisclosure(enabled);
        const logs = await getAuditLogs();
        setAuditLogs(logs);
        toast.success(`Recording disclosure ${enabled ? "enabled" : "disabled"}`);
      } catch (err: any) {
        toast.error(`Failed to update disclosure setting: ${err.message}`);
      }
    });
  };

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light', desc: 'Clean & bright' },
    { value: 'dark', icon: Moon, label: 'Dark', desc: 'Easy on eyes' },
    { value: 'system', icon: Monitor, label: 'System', desc: 'Auto-detect' },
  ] as const;

  const filteredSuppressionList = suppressionList.filter(entry =>
    entry.phone_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isCurrentVersionAcknowledged = acknowledgedAt && agreedVersion === CURRENT_POLICY_VERSION;

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-red-500 dark:text-red-400">
        <p className="font-semibold mb-2">Could not load account data</p>
        <p className="text-sm">{loadError}</p>
      </div>
    );
  }

  if (loading) {
    return <div className="animate-pulse glass-card rounded-xl h-64 w-full"></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1.5">
          Settings
        </h1>
        <p className="text-slate-500 dark:text-white/40 text-sm">
          Manage your account, appearance, and compliance obligations.
        </p>
      </div>

      {/* Profile -- now pulling real auth/profile data instead of hardcoded placeholders */}
      <div className="bg-white dark:bg-[#0d1117] border border-slate-200/60 dark:border-white/[0.05] rounded-2xl p-6 md:p-8 card-hover shadow-sm">
        <h2 className="text-[15px] font-bold text-slate-900 dark:text-white mb-6">Profile &amp; Authentication</h2>
        <div className="space-y-5 max-w-md">
          <div>
            <label className="block text-[12px] font-semibold text-slate-400 dark:text-white/30 mb-2 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              value={profile.email || ""}
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
              defaultValue={profile.fullName || ""}
              placeholder="Not set yet"
              className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none transition-all"
            />
          </div>
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
                        active ? 'shadow-lg' : 'border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/10'
                      }`}
                      style={active ? { borderColor: 'var(--accent)', background: 'var(--accent-muted)', boxShadow: '0 0 20px var(--accent-dim)' } : {}}
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
              <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
            )}
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-400 dark:text-white/30 mb-3 uppercase tracking-wider">Primary Accent Color</label>
            <p className="text-[12px] text-slate-400 dark:text-white/25 mb-4">Changes buttons, links, active states, and glow effects across the entire dashboard.</p>
            <div className="flex items-center gap-3 flex-wrap">
              {ACCENT_COLORS.map(({ hex, name, label }) => {
                const isActive = mounted && activeAccent === hex;
                return (
                  <button key={hex} onClick={() => handleAccentChange(hex)} className="relative flex flex-col items-center gap-1.5 group" title={name}>
                    <div className="w-11 h-11 rounded-full transition-all duration-200 group-hover:scale-110" style={{ backgroundColor: hex, boxShadow: isActive ? `0 0 0 3px white, 0 0 0 5px ${hex}, 0 0 16px ${hex}66` : '0 2px 8px rgba(0,0,0,0.15)', transform: isActive ? 'scale(1.1)' : undefined }}>
                      {isActive && <div className="w-full h-full rounded-full flex items-center justify-center"><Check size={16} className="text-white" strokeWidth={3} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} /></div>}
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: isActive ? hex : '#94a3b8' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Suppression List (moved from the standalone Compliance page) */}
      <div className="bg-white dark:bg-[#0d1117] border border-slate-200/60 dark:border-white/[0.05] rounded-2xl p-6 md:p-8 card-hover shadow-sm">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PhoneOff className="w-4 h-4 text-rose-500 dark:text-rose-400" /> Suppression List
            </h2>
            <p className="text-sm text-slate-500 dark:text-white/40 mt-1">
              Manage blocked numbers to comply with the <a href="https://www.donotcall.gov/" target="_blank" rel="noopener noreferrer" className="text-[color:var(--accent)] hover:underline">National Do Not Call Registry</a>.
            </p>
          </div>
          <div className="relative shrink-0">
            <Search className="w-4 h-4 text-slate-400 dark:text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search numbers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 pl-9 pr-3 py-1.5 text-sm text-slate-900 dark:text-white w-56 focus:outline-none focus:border-[color:var(--accent)] transition-colors" />
          </div>
        </div>
        <form onSubmit={handleAddSuppression} className="flex gap-2 mb-4">
          <input type="text" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+1 (555) 000-0000"
            className="flex-1 rounded-xl bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[color:var(--accent)] transition-colors" />
          <button type="submit" disabled={isPending} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-900 flex items-center gap-1 disabled:opacity-50 hover:opacity-90 transition-all" style={{ background: 'var(--accent)', boxShadow: '0 0 15px var(--accent-glow)' }}>
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredSuppressionList.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-white/30">{suppressionList.length === 0 ? "No numbers on the suppression list yet." : "No numbers match your search."}</p>
          )}
          {filteredSuppressionList.map((entry) => {
            const isHighRisk = entry.reason?.toLowerCase().includes("dnc");
            return (
              <div key={entry.id} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/[0.02] px-4 py-3 border border-slate-200/80 dark:border-white/5">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <p className="text-sm text-slate-900 dark:text-slate-200 font-medium w-36 shrink-0">{entry.phone_number}</p>
                  <p className="text-xs text-slate-500 dark:text-white/30 truncate flex-1">{entry.reason} &middot; {new Date(entry.added_at).toLocaleDateString()}</p>
                  {isHighRisk && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 px-2 py-1 rounded-full uppercase tracking-wider shrink-0">
                      <AlertTriangle className="w-3 h-3" /> DNC
                    </span>
                  )}
                </div>
                <button onClick={() => handleRemoveSuppression(entry.id, entry.phone_number)} disabled={isPending} className="text-xs text-slate-400 dark:text-white/30 hover:text-rose-500 dark:hover:text-rose-400 transition-colors ml-4 shrink-0 font-medium">
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call Recording Disclosure (moved from the standalone Compliance page) */}
      <div className="bg-white dark:bg-[#0d1117] border border-slate-200/60 dark:border-white/[0.05] rounded-2xl p-6 md:p-8 card-hover shadow-sm">
        <h2 className="text-[15px] font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500 dark:text-white/40" /> Call Recording Disclosure
        </h2>
        <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" checked={recordingDisclosure} disabled={isPending} onChange={(e) => handleToggleDisclosure(e.target.checked)} className="w-4 h-4 accent-[color:var(--accent)]" />
          Disclose to call recipients that the call may be recorded
        </label>
      </div>

      {/* Compliance Acknowledgment -- real now: links to all seven actual
          policy documents on the marketing site (open in a new tab so
          someone can read before agreeing, same pattern as any other
          sign-up flow's "I agree to the Terms" checkbox), and calls the
          real submitComplianceAcknowledgment action instead of just
          setting local state and claiming it was logged. */}
      <div className="bg-red-50/80 dark:bg-red-500/[0.04] border border-red-200/80 dark:border-red-500/20 rounded-2xl p-6 md:p-8">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert size={18} className="text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-white mb-1.5">Policy Acknowledgment</h2>
              <p className="text-slate-600 dark:text-white/50 text-sm leading-relaxed max-w-2xl">
                Before using features that place outbound calls or contact people on your behalf, you must read and agree to the following. You're responsible for lawful basis for contact, consent documentation, honoring Do-Not-Call requests, and calling-hour restrictions.
              </p>
            </div>

            {isCurrentVersionAcknowledged ? (
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-200/80 dark:border-emerald-500/20 w-fit">
                <CheckCircle2 size={16} />
                <span className="text-sm font-semibold">
                  Acknowledged {new Date(acknowledgedAt!).toLocaleDateString()} (policy version {agreedVersion})
                </span>
              </div>
            ) : (
              <div className="bg-white dark:bg-white/[0.03] border border-red-200/80 dark:border-red-500/15 p-5 rounded-xl flex flex-col gap-4 max-w-xl">
                {acknowledgedAt && (
                  <p className="text-[12px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle size={13} /> The policies have been updated since you last agreed (version {agreedVersion}) -- please review and re-accept.
                  </p>
                )}
                <ul className="space-y-1.5">
                  {POLICY_LINKS.map((doc) => (
                    <li key={doc.href}>
                      <a href={doc.href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[color:var(--accent)] hover:underline inline-flex items-center gap-1.5">
                        {doc.label} <ExternalLink size={11} />
                      </a>
                    </li>
                  ))}
                </ul>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={checkedBox} onChange={(e) => setCheckedBox(e.target.checked)} className="mt-1 shrink-0 w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500" />
                  <span className="text-[13px] text-slate-700 dark:text-white/60 leading-relaxed">
                    I confirm I&apos;ve read and agree to the Terms and Conditions, Privacy Policy, Acceptable Use Policy, AI Calling Guide, Data Processing Agreement, Refund Policy, and Compliance Page linked above.
                  </span>
                </label>
                <button onClick={handleAcknowledge} disabled={isPending} className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all w-fit shadow-sm">
                  I Agree
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log (moved from the standalone Compliance page) */}
      <div className="bg-white dark:bg-[#0d1117] border border-slate-200/60 dark:border-white/[0.05] rounded-2xl p-6 md:p-8 card-hover shadow-sm">
        <h2 className="text-[15px] font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500 dark:text-white/40" /> Audit Log
        </h2>
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {auditLogs.length === 0 && <p className="text-sm text-slate-500 dark:text-white/30">No audit events yet.</p>}
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 text-sm">
              <FileText className="w-4 h-4 text-slate-400 dark:text-white/25 mt-0.5 shrink-0" />
              <div>
                <p className="text-slate-800 dark:text-slate-200">{log.action}</p>
                <p className="text-slate-500 dark:text-white/30 text-xs">{log.metadata?.details} &middot; {new Date(log.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

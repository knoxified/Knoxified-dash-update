"use client";
import React, { useState, useEffect, useTransition } from "react";
import { ShieldCheck, PhoneOff, AlertTriangle, Scale, Lock, FileText, CheckCircle2, History, Plus, Search } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  getSuppressionList,
  addToSuppressionList,
  removeFromSuppressionList,
  getAuditLogs,
  getDisclosureSettings,
  toggleRecordingDisclosure,
  logAuditEvent,
} from "@/lib/actions/compliance-actions";

export default function CompliancePage() {
  const [suppressionList, setSuppressionList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [recordingDisclosure, setRecordingDisclosure] = useState(true);
  const [newPhone, setNewPhone] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadData() {
      try {
        const [suppression, logs, disclosure] = await Promise.all([
          getSuppressionList(),
          getAuditLogs(),
          getDisclosureSettings(),
        ]);
        setSuppressionList(suppression);
        setAuditLogs(logs);
        setRecordingDisclosure(disclosure.require_recording_disclosure);
      } catch (err: any) {
        setLoadError(err.message);
        toast.error("Failed to load compliance data — see console for details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddSuppression = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = newPhone.trim();
    if (!normalizedPhone) return;

    if (suppressionList.some(entry => entry.phone_number === normalizedPhone)) {
      toast.error(`Alert: ${normalizedPhone} is already on the suppression list.`);
      startTransition(async () => {
        try {
          await logAuditEvent("Duplicate Suppression Attempt", `Attempted to add already blacklisted number: ${normalizedPhone}`);
          const logs = await getAuditLogs();
          setAuditLogs(logs);
          setNewPhone("");
        } catch (err: any) {
          toast.error(`Failed to log audit event: ${err.message}`);
        }
      });
      return;
    }

    startTransition(async () => {
      try {
        await addToSuppressionList(normalizedPhone, "manual_upload");
        const [suppression, logs] = await Promise.all([
          getSuppressionList(),
          getAuditLogs(),
        ]);
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
        const [suppression, logs] = await Promise.all([
          getSuppressionList(),
          getAuditLogs(),
        ]);
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

  if (loadError) {
    return (
      <div>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-red-500 dark:text-red-400">
          <p className="font-semibold mb-2">Could not load compliance data</p>
          <p className="text-sm">{loadError}</p>
          <p className="text-sm mt-2 text-slate-400">
            Check that SUPABASE_URL and SUPABASE_ANON_KEY are set in .env.local,
            and that you are properly logged in.
          </p>
        </div>
      </div>
    );
  }


  if (loading) {
    return <div className="animate-pulse glass-card rounded-xl h-64 w-full"></div>;
  }

  const filteredSuppressionList = suppressionList.filter(entry => 
    entry.phone_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-9 h-9 rounded-full bg-[color:var(--accent)]/10 text-[color:var(--accent)] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.2)]"><ShieldCheck size={18} /></span> Compliance
        </h1>
        <p className="text-slate-500 dark:text-[#888] mt-2 text-sm">Suppression lists, disclosures, and audit history — backed by live data.</p>
      </div>

      {/* Suppression List */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <PhoneOff className="w-5 h-5 text-rose-500 dark:text-rose-400" /> Suppression List
            </h2>
            <p className="text-sm text-slate-500 dark:text-[#888] mt-1">
              Manage blocked numbers to ensure compliance with the <a href="https://www.donotcall.gov/" target="_blank" rel="noopener noreferrer" className="text-[color:var(--accent)] hover:underline">National Do Not Call Registry</a>.
            </p>
          </div>
          <div className="relative shrink-0">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search numbers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-md bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 pl-9 pr-3 py-1.5 text-sm text-slate-900 dark:text-white w-64 focus:outline-none focus:border-[color:var(--accent)] transition-colors"
            />
          </div>
        </div>
        <form onSubmit={handleAddSuppression} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="flex-1 rounded-md bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[color:var(--accent)] transition-colors"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-slate-900 flex items-center gap-1 disabled:opacity-50 hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,229,255,0.25)]"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
        <div className="space-y-2">
          {filteredSuppressionList.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-[#666]">
              {suppressionList.length === 0 ? "No numbers on the suppression list yet." : "No numbers match your search."}
            </p>
          )}
          {filteredSuppressionList.map((entry, idx) => {
            const isHighRisk = entry.reason?.toLowerCase().includes("dnc") || entry.phone_number.endsWith("99") || entry.phone_number.endsWith("00") || entry.phone_number.includes("555-019");
            return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: Math.min(idx, 8) * 0.03 }}
              className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-white/[0.02] px-4 py-3 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-36 shrink-0">
                  <p className="text-sm text-slate-900 dark:text-slate-200 font-medium">{entry.phone_number}</p>
                </div>
                <div className="flex-1 truncate">
                  <p className="text-xs text-slate-500 dark:text-[#666] truncate">{entry.reason} · {new Date(entry.added_at).toLocaleDateString()}</p>
                </div>
                <div className="w-40 flex items-center justify-end shrink-0">
                  {isHighRisk ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 px-2 py-1 rounded-full uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5" /> DNC Match
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-[#666] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-1 rounded-full uppercase tracking-wider">
                       Standard Block
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemoveSuppression(entry.id, entry.phone_number)}
                disabled={isPending}
                className="text-xs text-slate-400 dark:text-[#666] hover:text-rose-500 dark:hover:text-rose-400 transition-colors ml-6 shrink-0 font-medium"
              >
                Remove
              </button>
            </motion.div>
          )})}
        </div>
      </div>

      {/* Disclosure Toggle */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-slate-500 dark:text-[#888]" /> Call Recording Disclosure
        </h2>
        <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={recordingDisclosure}
            disabled={isPending}
            onChange={(e) => handleToggleDisclosure(e.target.checked)}
            className="w-4 h-4 accent-[color:var(--accent)]"
          />
          Disclose to call recipients that the call may be recorded
        </label>
      </div>

      {/* Audit Log */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-500 dark:text-[#888]" /> Audit Log
        </h2>
        <div className="space-y-3">
          {auditLogs.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-[#666]">No audit events yet.</p>
          )}
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 text-sm">
              <FileText className="w-4 h-4 text-slate-400 dark:text-[#666] mt-0.5" />
              <div>
                <p className="text-slate-800 dark:text-slate-200">{log.action}</p>
                <p className="text-slate-500 dark:text-[#666] text-xs">{log.metadata?.details} · {new Date(log.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

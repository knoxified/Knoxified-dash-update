"use client";
import React, { useState, useEffect, useTransition } from "react";
import { ShieldCheck, PhoneOff, AlertTriangle, Scale, Lock, FileText, CheckCircle2, History, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  getSuppressionList,
  addToSuppressionList,
  removeFromSuppressionList,
  getAuditLogs,
  getDisclosureSettings,
  toggleRecordingDisclosure,
} from "@/lib/actions/compliance-actions";

const CURRENT_USER_ID = "ad409f1e-7150-4ed1-a4d1-ab5d523ab265";

export default function CompliancePage() {
  const [suppressionList, setSuppressionList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [recordingDisclosure, setRecordingDisclosure] = useState(true);
  const [newPhone, setNewPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadData() {
      try {
        const [suppression, logs, disclosure] = await Promise.all([
          getSuppressionList(CURRENT_USER_ID),
          getAuditLogs(CURRENT_USER_ID),
          getDisclosureSettings(CURRENT_USER_ID),
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
    if (!newPhone.trim()) return;
    startTransition(async () => {
      try {
        await addToSuppressionList(CURRENT_USER_ID, newPhone, "manual_upload");
        const [suppression, logs] = await Promise.all([
          getSuppressionList(CURRENT_USER_ID),
          getAuditLogs(CURRENT_USER_ID),
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
        await removeFromSuppressionList(CURRENT_USER_ID, id, phone);
        const [suppression, logs] = await Promise.all([
          getSuppressionList(CURRENT_USER_ID),
          getAuditLogs(CURRENT_USER_ID),
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
        await toggleRecordingDisclosure(CURRENT_USER_ID, enabled);
        setRecordingDisclosure(enabled);
        const logs = await getAuditLogs(CURRENT_USER_ID);
        setAuditLogs(logs);
        toast.success(`Recording disclosure ${enabled ? "enabled" : "disabled"}`);
      } catch (err: any) {
        toast.error(`Failed to update disclosure setting: ${err.message}`);
      }
    });
  };

  if (loadError) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-red-400">
          <p className="font-semibold mb-2">Could not load compliance data</p>
          <p className="text-sm">{loadError}</p>
          <p className="text-sm mt-2 text-slate-400">
            Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local,
            and that CURRENT_USER_ID in this file points at a real row in the users table.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-slate-400">Loading compliance data...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-cyan-400" /> Compliance
        </h1>
        <p className="text-slate-400 mt-1">Suppression lists, disclosures, and audit history — backed by live data.</p>
      </div>

      {/* Suppression List */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <PhoneOff className="w-5 h-5 text-rose-400" /> Suppression List
        </h2>
        <form onSubmit={handleAddSuppression} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="flex-1 rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 flex items-center gap-1 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
        <div className="space-y-2">
          {suppressionList.length === 0 && (
            <p className="text-sm text-slate-500">No numbers on the suppression list yet.</p>
          )}
          {suppressionList.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-md bg-slate-800/50 px-4 py-2">
              <div>
                <p className="text-sm text-slate-200">{entry.phone_number}</p>
                <p className="text-xs text-slate-500">{entry.reason} · {new Date(entry.added_at).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => handleRemoveSuppression(entry.id, entry.phone_number)}
                disabled={isPending}
                className="text-xs text-slate-400 hover:text-red-400"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Disclosure Toggle */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-slate-400" /> Call Recording Disclosure
        </h2>
        <label className="flex items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={recordingDisclosure}
            disabled={isPending}
            onChange={(e) => handleToggleDisclosure(e.target.checked)}
            className="w-4 h-4"
          />
          Disclose to call recipients that the call may be recorded
        </label>
      </div>

      {/* Audit Log */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400" /> Audit Log
        </h2>
        <div className="space-y-3">
          {auditLogs.length === 0 && (
            <p className="text-sm text-slate-500">No audit events yet.</p>
          )}
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 text-sm">
              <FileText className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                <p className="text-slate-200">{log.action}</p>
                <p className="text-slate-500 text-xs">{log.metadata?.details} · {new Date(log.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

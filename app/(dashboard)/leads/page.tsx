"use client";
import { Select } from "@/components/ui/Select";
import React, { useEffect, useMemo, useState } from "react";
import { Download, Search, UserPlus, PhoneIncoming } from "lucide-react";
import { toast } from "sonner";
import { getLeads, addLead, type Lead, type LeadSource } from "@/lib/actions/leads-actions";

type Tab = "all" | LeadSource;

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "inbound_call", label: "Inbound calls" },
  { key: "leadreach", label: "LeadReach" },
  { key: "manual", label: "Added by you" },
];

const SOURCE_LABEL: Record<LeadSource, string> = {
  inbound_call: "Inbound call",
  leadreach: "LeadReach",
  manual: "Added by you",
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newLead, setNewLead] = useState({ name: "", phone: "", company: "", consentSource: "" });

  const refresh = async () => {
    const res = await getLeads();
    setLeads(res.leads);
    setLoadError(res.error);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    getLeads().then((res) => {
      if (cancelled) return;
      setLeads(res.leads);
      setLoadError(res.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone || !newLead.consentSource) {
      toast.error("Name, phone, and consent source are mandatory.");
      return;
    }
    setSaving(true);
    const res = await addLead(newLead);
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error || "Couldn't save that lead.");
      return;
    }
    setShowAdd(false);
    setNewLead({ name: "", phone: "", company: "", consentSource: "" });
    toast.success("Lead added with documented consent.");
    refresh();
  };

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: leads.length, inbound_call: 0, leadreach: 0, manual: 0 };
    for (const l of leads) c[l.source]++;
    return c;
  }, [leads]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (tab !== "all" && l.source !== tab) return false;
      if (!q) return true;
      return [l.name, l.phone, l.email, l.company].some((v) => v?.toLowerCase().includes(q));
    });
  }, [leads, tab, query]);

  const handleExport = () => {
    if (visible.length === 0) {
      toast.error("Nothing to export yet.");
      return;
    }
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Name", "Phone", "Email", "Company", "Source", "Consent Source", "Calls", "Date Added"],
      ...visible.map((l) => [
        l.name, l.phone, l.email, l.company, SOURCE_LABEL[l.source], l.consent_source ?? "", l.call_count, l.created_at,
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
            Leads Directory
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm max-w-2xl">
            Everyone who has called your agent, plus leads you add or push from LeadReach. Consent documentation is strictly required before any outbound campaigns can be initiated.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 bg-[color:var(--accent)] text-slate-900 hover:opacity-90 text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_28px_rgba(0,229,255,0.4)]">
            <UserPlus size={16} /> Add Lead
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 glass-card card-hover text-slate-900 dark:text-white text-sm font-medium px-4 py-2 rounded-lg">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="glass-card rounded-xl p-5 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add New Contact</h3>
          <form onSubmit={handleAddLead} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-[#888] mb-1">Full Name *</label>
              <input required value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-[#888] mb-1">Phone Number *</label>
              <input required value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-[#888] mb-1">Company</label>
              <input value={newLead.company} onChange={e => setNewLead({...newLead, company: e.target.value})} className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-[#888] mb-1">Consent Source *</label>
              <Select 
                required 
                value={newLead.consentSource} 
                onChange={(val) => setNewLead({...newLead, consentSource: val})} 
                options={[
                  { value: "Existing Customer", label: "Existing Customer" },
                  { value: "Submitted Inquiry Form", label: "Submitted Inquiry Form" },
                  { value: "Prior Call", label: "Prior Call" },
                  { value: "Uploaded List (Documented Consent)", label: "Uploaded List (Documented Consent)" }
                ]}
              />
            </div>
            <button type="submit" disabled={saving} className="disabled:opacity-60 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors w-full">
              {saving ? "Saving..." : "Save Contact"}
            </button>
          </form>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  tab === t.key
                    ? "bg-[color:var(--accent)]/15 text-slate-900 dark:text-white ring-1 ring-[color:var(--accent)]/40"
                    : "text-slate-500 dark:text-[#888] hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                {t.label} <span className="opacity-60">{counts[t.key]}</span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#888]" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads..."
              className="bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] w-full md:w-[300px] transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-[#888]">Loading leads...</div>
        ) : loadError ? (
          <div className="p-10 text-center text-sm text-red-500">Couldn&apos;t load your leads: {loadError}</div>
        ) : visible.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-[color:var(--accent)]/10 text-[color:var(--accent)] flex items-center justify-center mx-auto mb-4">
              <PhoneIncoming size={22} />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
              {leads.length === 0 ? "No leads yet" : "No leads match this view"}
            </p>
            <p className="text-xs text-slate-500 dark:text-[#888]">
              {leads.length === 0
                ? "Callers appear here automatically after they talk to your agent. You can also add a lead yourself, or push results from LeadReach."
                : "Try a different tab or clear your search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-white/[0.02] text-xs uppercase font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="px-5 py-4">Lead Info</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Source</th>
                  <th className="px-5 py-4">Consent</th>
                  <th className="px-5 py-4 text-right">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {visible.map((lead) => {
                  const displayName = lead.name || (lead.source === "inbound_call" ? "Unknown caller" : lead.email || "Unnamed lead");
                  const initials = lead.name
                    ? lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                    : "?";
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[color:var(--accent)]/10 text-[color:var(--accent)] flex items-center justify-center text-[11px] font-bold shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">{displayName}</div>
                            <div className="text-[12px] text-slate-500 dark:text-[#888]">{lead.company || lead.email || ""}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-900 dark:text-slate-300">{lead.phone || "—"}</td>
                      <td className="px-5 py-4">
                        <span className="text-[12px] text-slate-700 dark:text-slate-300">{SOURCE_LABEL[lead.source]}</span>
                        {lead.source === "inbound_call" && lead.call_count > 1 && (
                          <span className="ml-1.5 text-[11px] text-slate-500 dark:text-[#888]">{lead.call_count} calls</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {lead.consent_source ? (
                          <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded text-[11px] font-bold">
                            {lead.consent_source}
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded text-[11px] font-bold">
                            No consent on file
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-500">{formatDate(lead.last_contact_at || lead.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

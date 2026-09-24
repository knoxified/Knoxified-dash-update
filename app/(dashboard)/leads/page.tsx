"use client";
import { Select } from "@/components/ui/Select";
import React, { useEffect, useMemo, useState } from "react";
import { Download, Search, UserPlus, PhoneIncoming, Upload, X, Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getLeads, addLead, importLeads, getLeadTimeline, type Lead, type LeadSource, type TimelineItem } from "@/lib/actions/leads-actions";
import { parseCsv, detectColumns, rowsToLeads, type ColumnMap } from "@/lib/csv";
import CampaignLauncher from "@/components/CampaignLauncher";

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
  const router = useRouter();

  // Selection + campaign launcher
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [launcherOpen, setLauncherOpen] = useState(false);

  // CSV import
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState("");
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importData, setImportData] = useState<string[][]>([]);
  const [importMap, setImportMap] = useState<ColumnMap>({});
  const [importConsent, setImportConsent] = useState("");
  const [importing, setImporting] = useState(false);

  // Lead detail drawer
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[] | null>(null);

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

  const resetImport = () => {
    setImportOpen(false);
    setImportFile("");
    setImportHeaders([]);
    setImportData([]);
    setImportMap({});
    setImportConsent("");
  };

  const handleFilePicked = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("That file is too large. Keep it under 2 MB.");
      return;
    }
    const rows = parseCsv(await file.text());
    if (rows.length < 2) {
      toast.error("That file needs a header row and at least one lead.");
      return;
    }
    setImportFile(file.name);
    setImportHeaders(rows[0]);
    setImportData(rows.slice(1));
    setImportMap(detectColumns(rows[0]));
  };

  const setMapping = (field: "name" | "phone" | "email" | "company", value: string) => {
    setImportMap((prev) => {
      const next: ColumnMap = { ...prev };
      if (value === "") delete next[field];
      else next[field] = Number(value);
      if (field === "name") {
        delete next.firstName;
        delete next.lastName;
      }
      return next;
    });
  };

  const importPreview = useMemo(() => rowsToLeads(importData, importMap), [importData, importMap]);
  const importUsable = importPreview.filter((r) => r.phone || r.email).length;

  const handleImport = async () => {
    if (!importConsent) {
      toast.error("Choose a consent source for this list.");
      return;
    }
    setImporting(true);
    const res = await importLeads(importPreview, importConsent);
    setImporting(false);
    if (!res.ok) {
      toast.error(res.error || "Import failed.");
      return;
    }
    toast.success(
      `${res.inserted} lead${res.inserted === 1 ? "" : "s"} imported` +
        (res.duplicates ? `, ${res.duplicates} already in your list` : "") +
        (res.invalid ? `, ${res.invalid} skipped (no valid phone or email)` : "") +
        "."
    );
    resetImport();
    refresh();
  };

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const openLead = (lead: Lead) => {
    setDrawerLead(lead);
    setTimeline(null);
    getLeadTimeline(lead.id).then((res) => setTimeline(res.items));
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
          <button onClick={() => setImportOpen(true)} className="flex items-center gap-2 glass-card card-hover text-slate-900 dark:text-white text-sm font-medium px-4 py-2 rounded-lg">
            <Upload size={16} /> Import CSV
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
                  <th className="pl-5 pr-0 py-4 w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all leads in this view"
                      checked={visible.length > 0 && visible.every((l) => selected.has(l.id))}
                      onChange={(e) =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          visible.forEach((l) => (e.target.checked ? next.add(l.id) : next.delete(l.id)));
                          return next;
                        })
                      }
                    />
                  </th>
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
                      <td className="pl-5 pr-0 py-4 w-8">
                        <input type="checkbox" aria-label={`Select ${displayName}`} checked={selected.has(lead.id)} onChange={() => toggleSelected(lead.id)} />
                      </td>
                      <td className="px-5 py-4">
                        <button type="button" onClick={() => openLead(lead)} className="flex items-center gap-2.5 text-left">
                          <div className="w-8 h-8 rounded-full bg-[color:var(--accent)]/10 text-[color:var(--accent)] flex items-center justify-center text-[11px] font-bold shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">{displayName}</div>
                            <div className="text-[12px] text-slate-500 dark:text-[#888]">{lead.company || lead.email || ""}</div>
                          </div>
                        </button>
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

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full pl-5 pr-2 py-2 shadow-2xl">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <button onClick={() => setLauncherOpen(true)} className="flex items-center gap-1.5 bg-[color:var(--accent)] text-slate-900 text-sm font-semibold rounded-full px-4 py-1.5 hover:opacity-90">
            <Mail size={14} /> Start email sequence
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs opacity-70 hover:opacity-100 pr-2">Clear</button>
        </div>
      )}

      <CampaignLauncher
        open={launcherOpen}
        onClose={() => setLauncherOpen(false)}
        mode="leads"
        leadIds={Array.from(selected)}
        audienceLabel={`${selected.size} selected lead${selected.size === 1 ? "" : "s"}`}
        onLaunched={() => {
          setSelected(new Set());
          router.push("/campaigns");
        }}
      />

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Import leads from CSV</h2>
              <button onClick={resetImport} className="text-slate-500 hover:text-slate-900 dark:hover:text-white" aria-label="Close"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {importData.length === 0 ? (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl p-10 cursor-pointer hover:border-[color:var(--accent)] transition-colors text-center">
                  <Upload size={26} className="text-[color:var(--accent)]" />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Choose a CSV file</span>
                  <span className="text-xs text-slate-500 dark:text-[#888]">Export from Excel or Google Sheets. Needs a header row. Up to 1,000 leads.</span>
                  <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => handleFilePicked(e.target.files?.[0])} />
                </label>
              ) : (
                <>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <strong>{importFile}</strong>: {importData.length} rows, {importUsable} with a phone or email.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {([
                      ["name", "Name"],
                      ["phone", "Phone"],
                      ["email", "Email"],
                      ["company", "Company"],
                    ] as const).map(([field, label]) => (
                      <div key={field}>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{label} column</label>
                        <Select
                          value={importMap[field] !== undefined ? String(importMap[field]) : importMap.firstName !== undefined && field === "name" ? "first-last" : ""}
                          onChange={(v) => setMapping(field, v === "first-last" ? "" : v)}
                          options={[
                            { value: "", label: "Not in my file" },
                            ...(importMap.firstName !== undefined && field === "name" ? [{ value: "first-last", label: "First + last name columns" }] : []),
                            ...importHeaders.map((h, i) => ({ value: String(i), label: h || `Column ${i + 1}` })),
                          ]}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/5 overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
                      <thead className="bg-slate-50 dark:bg-white/[0.02] uppercase text-slate-500">
                        <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Phone</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Company</th></tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 3).map((r, i) => (
                          <tr key={i} className="border-t border-slate-200 dark:border-white/5">
                            <td className="px-3 py-2">{r.name || "—"}</td><td className="px-3 py-2">{r.phone || "—"}</td><td className="px-3 py-2">{r.email || "—"}</td><td className="px-3 py-2">{r.company || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Consent source <span className="text-rose-500">*</span></label>
                    <Select
                      value={importConsent}
                      onChange={setImportConsent}
                      placeholder="How do these people know you?"
                      options={[
                        { value: "Existing Customers (Implied Consent)", label: "Existing Customers (Implied Consent)" },
                        { value: "Inbound Inquiry / Web Form", label: "Inbound Inquiry / Web Form" },
                        { value: "Explicit Opt-In List", label: "Explicit Opt-In List" },
                      ]}
                    />
                    <p className="text-[11px] text-slate-500 dark:text-[#888] mt-1">Applies to every lead in this file. Only import people you have a lawful basis to contact.</p>
                  </div>
                </>
              )}
            </div>
            {importData.length > 0 && (
              <div className="p-5 border-t border-slate-200 dark:border-white/5 flex justify-end gap-3">
                <button onClick={resetImport} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#888] hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">Cancel</button>
                <button onClick={handleImport} disabled={importing || importUsable === 0} className="px-4 py-2 text-sm font-medium bg-[color:var(--accent)] text-slate-900 rounded-lg hover:opacity-90 disabled:opacity-60">
                  {importing ? "Importing..." : `Import ${importUsable} lead${importUsable === 1 ? "" : "s"}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {drawerLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setDrawerLead(null)}>
          <aside className="w-full max-w-md h-full bg-white dark:bg-[#0F172A] border-l border-slate-200 dark:border-white/10 shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-white/5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{drawerLead.name || (drawerLead.source === "inbound_call" ? "Unknown caller" : drawerLead.email || "Unnamed lead")}</h2>
                <p className="text-sm text-slate-500 dark:text-[#888]">{drawerLead.company || SOURCE_LABEL[drawerLead.source]}</p>
              </div>
              <button onClick={() => setDrawerLead(null)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white" aria-label="Close"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-5 text-sm">
              <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                <p><span className="text-slate-500 dark:text-[#888]">Phone:</span> {drawerLead.phone || "—"}</p>
                <p><span className="text-slate-500 dark:text-[#888]">Email:</span> {drawerLead.email || "—"}</p>
                <p><span className="text-slate-500 dark:text-[#888]">Source:</span> {SOURCE_LABEL[drawerLead.source]}</p>
                <p><span className="text-slate-500 dark:text-[#888]">Consent:</span> {drawerLead.consent_source || "No consent on file"}</p>
              </div>
              {drawerLead.email && (
                <button
                  onClick={() => {
                    setSelected(new Set([drawerLead.id]));
                    setDrawerLead(null);
                    setLauncherOpen(true);
                  }}
                  className="flex items-center gap-2 bg-[color:var(--accent)] text-slate-900 text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90"
                >
                  <Mail size={15} /> Start email sequence
                </button>
              )}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#888] mb-3">Activity</h3>
                {timeline === null ? (
                  <p className="text-slate-500 dark:text-[#888]">Loading...</p>
                ) : timeline.length === 0 ? (
                  <p className="text-slate-500 dark:text-[#888]">No calls or emails yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {timeline.map((t, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="w-7 h-7 shrink-0 rounded-full bg-[color:var(--accent)]/10 text-[color:var(--accent)] flex items-center justify-center">
                          {t.kind === "call" ? <Phone size={13} /> : <Mail size={13} />}
                        </div>
                        <div className="min-w-0">
                          {t.kind === "call" ? (
                            <>
                              <p className="text-slate-900 dark:text-white font-medium">Call · {Math.max(1, Math.round(t.durationSecs / 60))} min</p>
                              {t.snippet && <p className="text-slate-500 dark:text-[#888] truncate">&ldquo;{t.snippet}&rdquo;</p>}
                            </>
                          ) : (
                            <>
                              <p className="text-slate-900 dark:text-white font-medium truncate">{t.subject}</p>
                              <p className="text-slate-500 dark:text-[#888]">Email {t.step} · {t.status}</p>
                            </>
                          )}
                          <p className="text-[11px] text-slate-400">{formatDate(t.at)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

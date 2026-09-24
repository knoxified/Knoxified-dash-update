"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Mail, Pause, Play, ChevronDown, ChevronRight, X, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Select } from "@/components/ui/Select";
import ScheduleManager from "@/components/ScheduleManager";
import CampaignLauncher from "@/components/CampaignLauncher";
import { getLeads, type Lead } from "@/lib/actions/leads-actions";
import {
  getCampaigns,
  getCampaignRecipients,
  setCampaignStatus,
  markRecipientReplied,
  type CampaignSummary,
  type RecipientRow,
} from "@/lib/actions/email-actions";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  completed: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400",
  draft: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400",
};
const STATUS_LABEL: Record<string, string> = { active: "Sending", paused: "Paused", completed: "Completed", draft: "Draft" };

const RECIPIENT_LABEL: Record<string, string> = {
  active: "In sequence",
  paused: "Paused",
  completed: "Finished",
  replied: "Replied",
  unsubscribed: "Unsubscribed",
  failed: "Failed",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<RecipientRow[] | null>(null);

  const [audienceOpen, setAudienceOpen] = useState(false);
  const [segment, setSegment] = useState("all");
  const [launcherOpen, setLauncherOpen] = useState(false);

  const load = async () => {
    const [c, l] = await Promise.all([getCampaigns(), getLeads()]);
    setCampaigns(c.campaigns);
    setLoadError(c.error);
    setLeads(l.leads);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCampaigns(), getLeads()]).then(([c, l]) => {
      if (cancelled) return;
      setCampaigns(c.campaigns);
      setLoadError(c.error);
      setLeads(l.leads);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const emailable = useMemo(() => leads.filter((l) => l.email), [leads]);
  const segments = useMemo(() => {
    const by = (src: string) => emailable.filter((l) => l.source === src);
    return [
      { value: "all", name: "All leads with an email", ids: emailable.map((l) => l.id) },
      { value: "leadreach", name: "LeadReach leads", ids: by("leadreach").map((l) => l.id) },
      { value: "manual", name: "Added or imported by you", ids: by("manual").map((l) => l.id) },
      { value: "inbound_call", name: "Inbound callers", ids: by("inbound_call").map((l) => l.id) },
    ];
  }, [emailable]);
  const chosen = segments.find((s) => s.value === segment) || segments[0];

  const toggleExpand = (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    setRecipients(null);
    getCampaignRecipients(id).then((r) => setRecipients(r.recipients));
  };

  const handleStatus = async (c: CampaignSummary) => {
    const next = c.status === "paused" ? "active" : "paused";
    const res = await setCampaignStatus(c.id, next);
    if (!res.ok) {
      toast.error(res.error || "Couldn't update the campaign.");
      return;
    }
    toast.success(next === "paused" ? "Campaign paused. Nothing more will send until you resume." : "Campaign resumed.");
    load();
  };

  const handleReplied = async (campaignId: string, recipientId: string) => {
    const res = await markRecipientReplied(recipientId);
    if (!res.ok) {
      toast.error(res.error || "Couldn't update that person.");
      return;
    }
    toast.success("Marked as replied. No more emails will go to them.");
    getCampaignRecipients(campaignId).then((r) => setRecipients(r.recipients));
    load();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">Campaigns</h1>
          <p className="text-slate-500 dark:text-[#888] text-sm max-w-2xl">
            Send a 4-email follow-up sequence to your leads, one email every few days, and see who is still in it, who replied and who opted out.
          </p>
        </div>
        <button
          onClick={() => setAudienceOpen(true)}
          className="flex items-center gap-2 bg-[color:var(--accent)] hover:opacity-90 text-slate-900 text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_28px_rgba(0,229,255,0.4)]"
        >
          <Plus size={18} /> New Campaign
        </button>
      </div>

      {audienceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Who should get it?</h2>
              <button onClick={() => setAudienceOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {emailable.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  None of your leads have an email address yet.{" "}
                  <Link href="/leads" className="text-[color:var(--accent)] underline">Import a CSV</Link> or push results from LeadReach first.
                </p>
              ) : (
                <>
                  <Select
                    value={segment}
                    onChange={setSegment}
                    options={segments.map((s) => ({ value: s.value, label: `${s.name} (${s.ids.length})` }))}
                  />
                  <p className="text-xs text-slate-500 dark:text-[#888]">
                    Want to pick individual people? Select them on the <Link href="/leads" className="underline">Leads page</Link>. Sequences written by MailCraft are on the <Link href="/emails" className="underline">Emails page</Link>.
                  </p>
                </>
              )}
            </div>
            {emailable.length > 0 && (
              <div className="p-5 border-t border-slate-200 dark:border-white/5 flex justify-end gap-3">
                <button onClick={() => setAudienceOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#888] hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">Cancel</button>
                <button
                  disabled={chosen.ids.length === 0}
                  onClick={() => {
                    setAudienceOpen(false);
                    setLauncherOpen(true);
                  }}
                  className="px-4 py-2 text-sm font-medium bg-[color:var(--accent)] text-slate-900 rounded-lg hover:opacity-90 disabled:opacity-60"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <CampaignLauncher
        open={launcherOpen}
        onClose={() => setLauncherOpen(false)}
        mode="leads"
        leadIds={chosen.ids}
        audienceLabel={`${chosen.name} (${chosen.ids.length})`}
        onLaunched={() => load()}
      />

      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-[#888]">Loading campaigns...</div>
        ) : loadError ? (
          <div className="p-10 text-center text-sm text-red-500">Couldn&apos;t load your campaigns: {loadError}</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-[color:var(--accent)]/10 text-[color:var(--accent)] flex items-center justify-center mx-auto mb-4">
              <Megaphone size={22} />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">No campaigns yet</p>
            <p className="text-xs text-slate-500 dark:text-[#888]">
              Your first campaign takes about two minutes: pick your leads, check the four emails and launch.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/5">
            {campaigns.map((c) => {
              const pct = c.emailsPlanned > 0 ? Math.min(100, Math.round((c.emailsSent / c.emailsPlanned) * 100)) : 0;
              const open = expanded === c.id;
              return (
                <li key={c.id}>
                  <div className="p-5 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <button onClick={() => toggleExpand(c.id)} className="flex items-center gap-2 text-left min-w-0">
                        {open ? <ChevronDown size={16} className="shrink-0 text-slate-400" /> : <ChevronRight size={16} className="shrink-0 text-slate-400" />}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">{c.name}</p>
                          <p className="text-xs text-slate-500 dark:text-[#888]">
                            Started {formatDate(c.createdAt)} · {c.gapDays} days between emails
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${STATUS_STYLE[c.status] || STATUS_STYLE.draft}`}>
                          {STATUS_LABEL[c.status] || c.status}
                        </span>
                        {(c.status === "active" || c.status === "paused") && (
                          <button
                            onClick={() => handleStatus(c)}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1"
                          >
                            {c.status === "paused" ? <><Play size={12} /> Resume</> : <><Pause size={12} /> Pause</>}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                        <div className="h-full bg-[color:var(--accent)] transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-[#888]">
                        <span><strong className="text-slate-900 dark:text-white">{c.emailsSent}</strong> of {c.emailsPlanned} emails sent</span>
                        <span><strong className="text-slate-900 dark:text-white">{c.totalRecipients}</strong> people</span>
                        <span><strong className="text-slate-900 dark:text-white">{c.active}</strong> still in sequence</span>
                        <span><strong className="text-slate-900 dark:text-white">{c.replied}</strong> replied</span>
                        <span><strong className="text-slate-900 dark:text-white">{c.unsubscribed}</strong> unsubscribed</span>
                        {c.failed > 0 && <span className="text-amber-600 dark:text-amber-400"><strong>{c.failed}</strong> failed</span>}
                      </div>
                    </div>
                  </div>

                  {open && (
                    <div className="px-5 pb-5">
                      <div className="rounded-lg border border-slate-200 dark:border-white/5 overflow-x-auto">
                        {recipients === null ? (
                          <p className="p-4 text-sm text-slate-500 dark:text-[#888]">Loading...</p>
                        ) : (
                          <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
                            <thead className="bg-slate-50 dark:bg-white/[0.02] uppercase text-slate-500">
                              <tr>
                                <th className="px-3 py-2">Person</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Progress</th>
                                <th className="px-3 py-2">Next email</th>
                                <th className="px-3 py-2" />
                              </tr>
                            </thead>
                            <tbody>
                              {recipients.map((r) => (
                                <tr key={r.id} className="border-t border-slate-200 dark:border-white/5 align-top">
                                  <td className="px-3 py-2 text-slate-900 dark:text-white">
                                    {r.email}
                                    {r.last_error && r.status === "active" && (
                                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 max-w-xs">{r.last_error}</p>
                                    )}
                                    {r.last_error && r.status === "failed" && (
                                      <p className="text-[11px] text-rose-500 mt-0.5 max-w-xs">{r.last_error}</p>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">{RECIPIENT_LABEL[r.status] || r.status}</td>
                                  <td className="px-3 py-2">
                                    {r.status === "completed" ? r.total_steps : Math.max(0, r.current_step - 1)} of {r.total_steps} sent
                                  </td>
                                  <td className="px-3 py-2">{r.status === "active" ? formatDate(r.next_send_at) : "—"}</td>
                                  <td className="px-3 py-2 text-right">
                                    {(r.status === "active" || r.status === "paused") && (
                                      <button onClick={() => handleReplied(c.id, r.id)} className="text-[11px] font-medium text-[color:var(--accent)] hover:underline">
                                        Mark replied
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-[#888] mt-2 flex items-center gap-1.5">
                        <Mail size={12} /> When someone replies, mark them so the rest of their sequence stops. Unsubscribes stop automatically.
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ScheduleManager type="call" targetId="global" />
    </div>
  );
}

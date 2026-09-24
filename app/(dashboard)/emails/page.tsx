"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ChevronDown, ChevronRight, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import CampaignLauncher from "@/components/CampaignLauncher";
import {
  getEmails,
  getSenderInfo,
  deleteDraftSequences,
  updateDraftEmail,
  type EmailRow,
} from "@/lib/actions/email-actions";

type Tab = "drafts" | "scheduled" | "sent";

const TABS: { key: Tab; label: string }[] = [
  { key: "drafts", label: "Drafts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "sent", label: "Sent" },
];

const inputCls =
  "w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00E5FF]";

function formatDateTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function EmailsPage() {
  const router = useRouter();
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mailboxConnected, setMailboxConnected] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("drafts");

  const [openSeq, setOpenSeq] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [launcherOpen, setLauncherOpen] = useState(false);

  const [editing, setEditing] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");

  const refresh = async () => {
    const res = await getEmails();
    setEmails(res.emails);
    setLoadError(res.error);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([getEmails(), getSenderInfo()]).then(([res, info]) => {
      if (cancelled) return;
      setEmails(res.emails);
      setLoadError(res.error);
      setMailboxConnected(info.connectedProviders.length > 0);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const drafts = useMemo(() => {
    const groups = new Map<string, EmailRow[]>();
    for (const e of emails) {
      if (e.status !== "draft") continue;
      const key = e.sequence_id || e.id;
      groups.set(key, [...(groups.get(key) || []), e]);
    }
    return [...groups.entries()].map(([id, rows]) => ({ id, rows: rows.sort((a, b) => a.step - b.step) }));
  }, [emails]);

  const scheduled = useMemo(() => emails.filter((e) => e.status === "scheduled").sort((a, b) => a.created_at.localeCompare(b.created_at)), [emails]);
  const sent = useMemo(() => emails.filter((e) => e.status === "sent" || e.status === "failed"), [emails]);

  const counts: Record<Tab, number> = { drafts: drafts.length, scheduled: scheduled.length, sent: sent.length };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleDelete = async () => {
    const res = await deleteDraftSequences([...selected]);
    if (!res.ok) {
      toast.error(res.error || "Couldn't delete those drafts.");
      return;
    }
    toast.success("Drafts deleted.");
    setSelected(new Set());
    refresh();
  };

  const startEdit = (e: EmailRow) => {
    setEditing(e.id);
    setEditSubject(e.subject);
    setEditBody(e.body);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const res = await updateDraftEmail(editing, editSubject, editBody);
    if (!res.ok) {
      toast.error(res.error || "Couldn't save that email.");
      return;
    }
    setEditing(null);
    toast.success("Email updated.");
    refresh();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">Emails</h1>
        <p className="text-slate-500 dark:text-[#888] text-sm max-w-2xl">
          Everything MailCraft drafts and every sequence email, before and after it goes out. Review, edit and send from here.
        </p>
      </div>

      {mailboxConnected === false && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>
            Emails send from your own mailbox. <Link href="/integrations" className="font-semibold underline">Connect Google, Microsoft 365 or Zoho in Integrations</Link> before launching a sequence.
          </p>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
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
          {tab === "drafts" && selected.size > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={handleDelete} className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-lg px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                <Trash2 size={13} /> Delete
              </button>
              <button onClick={() => setLauncherOpen(true)} className="flex items-center gap-1.5 text-xs font-semibold bg-[color:var(--accent)] text-slate-900 rounded-lg px-3 py-1.5 hover:opacity-90">
                <Mail size={13} /> Start sequence for {selected.size}
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-[#888]">Loading emails...</div>
        ) : loadError ? (
          <div className="p-10 text-center text-sm text-red-500">Couldn&apos;t load your emails: {loadError}</div>
        ) : tab === "drafts" ? (
          drafts.length === 0 ? (
            <EmptyState title="No drafts yet" text="When MailCraft writes a sequence for someone, it appears here so you can review it before anything is sent." />
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-white/5">
              {drafts.map((g) => {
                const open = openSeq === g.id;
                const first = g.rows[0];
                return (
                  <li key={g.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selected.has(g.id)} onChange={() => toggle(g.id)} aria-label={`Select sequence for ${first.to_email}`} />
                      <button onClick={() => setOpenSeq(open ? null : g.id)} className="flex items-center gap-2 text-left flex-1 min-w-0">
                        {open ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">{first.to_name ? `${first.to_name} · ` : ""}{first.to_email}</p>
                          <p className="text-xs text-slate-500 dark:text-[#888] truncate">{first.subject}</p>
                        </div>
                      </button>
                      <span className="text-[11px] text-slate-500 dark:text-[#888] shrink-0">{g.rows.length} emails · {first.source === "mailcraft" ? "MailCraft" : "Draft"}</span>
                    </div>

                    {open && (
                      <div className="mt-4 ml-8 space-y-3">
                        {g.rows.map((e) => (
                          <div key={e.id} className="rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#020617]/50 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-[#888] mb-2">Email {e.step}</p>
                            {editing === e.id ? (
                              <div className="space-y-2">
                                <input value={editSubject} onChange={(ev) => setEditSubject(ev.target.value)} className={inputCls} />
                                <textarea value={editBody} rows={7} onChange={(ev) => setEditBody(ev.target.value)} className={inputCls} />
                                <div className="flex gap-2">
                                  <button onClick={saveEdit} className="text-xs font-semibold bg-[color:var(--accent)] text-slate-900 rounded-lg px-3 py-1.5 hover:opacity-90">Save</button>
                                  <button onClick={() => setEditing(null)} className="text-xs font-medium text-slate-500 px-3 py-1.5">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{e.subject}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap mt-1">{e.body}</p>
                                <button onClick={() => startEdit(e)} className="text-[11px] font-medium text-[color:var(--accent)] hover:underline mt-2">Edit</button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )
        ) : tab === "scheduled" ? (
          scheduled.length === 0 ? (
            <EmptyState title="Nothing scheduled" text="Emails waiting for their turn in a running sequence show up here." />
          ) : (
            <EmailTable rows={scheduled} whenLabel="Step" />
          )
        ) : sent.length === 0 ? (
          <EmptyState title="Nothing sent yet" text="Once a campaign starts sending, every email is logged here." />
        ) : (
          <EmailTable rows={sent} whenLabel="Sent" />
        )}
      </div>

      <CampaignLauncher
        open={launcherOpen}
        onClose={() => setLauncherOpen(false)}
        mode="sequences"
        sequenceIds={[...selected]}
        audienceLabel={`${selected.size} drafted sequence${selected.size === 1 ? "" : "s"}`}
        onLaunched={() => {
          setSelected(new Set());
          router.push("/campaigns");
        }}
      />
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="p-12 text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-[color:var(--accent)]/10 text-[color:var(--accent)] flex items-center justify-center mx-auto mb-4">
        <Mail size={22} />
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">{title}</p>
      <p className="text-xs text-slate-500 dark:text-[#888]">{text}</p>
    </div>
  );
}

function EmailTable({ rows, whenLabel }: { rows: EmailRow[]; whenLabel: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
        <thead className="bg-slate-50 dark:bg-white/[0.02] text-xs uppercase font-medium text-slate-500 border-b border-slate-200 dark:border-white/5">
          <tr>
            <th className="px-5 py-3">To</th>
            <th className="px-5 py-3">Subject</th>
            <th className="px-5 py-3">Email</th>
            <th className="px-5 py-3 text-right">{whenLabel === "Sent" ? "Sent" : "Status"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
          {rows.map((e) => (
            <tr key={e.id}>
              <td className="px-5 py-3 text-slate-900 dark:text-white">{e.to_email}</td>
              <td className="px-5 py-3 max-w-xs truncate">
                {e.subject}
                {e.status === "failed" && e.error && <p className="text-[11px] text-rose-500 truncate">{e.error}</p>}
              </td>
              <td className="px-5 py-3">{e.step} of 4</td>
              <td className="px-5 py-3 text-right">
                {e.status === "failed" ? <span className="text-rose-500">Failed</span> : e.status === "sent" ? formatDateTime(e.sent_at) : "Waiting"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

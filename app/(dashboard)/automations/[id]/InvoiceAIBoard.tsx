"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  getInvoiceData, saveInvoiceSettings, saveInvoiceClient, deleteInvoiceClient,
  saveInvoice, deleteDraftInvoice, markInvoicePaid, voidInvoice, draftInvoiceWithAI, sendInvoice,
} from "@/lib/actions/invoice-actions";
import { calcTotals, displayStatus, money, type InvoiceItem } from "@/lib/invoices";

type Data = Awaited<ReturnType<typeof getInvoiceData>>;
type Tab = "invoices" | "editor" | "clients" | "settings";
type Draft = {
  id: string | null; client_id: string; issue_date: string; due_date: string; currency: string;
  items: InvoiceItem[]; tax_rate: string; notes: string; source: "manual" | "ai";
};

const card = "bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-4";
const input = "w-full rounded-lg border border-slate-300 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400";
const btn = "rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50";
const btnPrimary = `${btn} bg-blue-600 text-white hover:bg-blue-500`;
const btnGhost = `${btn} border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5`;
const lbl = "block text-xs font-medium text-slate-500 dark:text-[#888] mb-1";

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  void: "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-500",
};

export default function InvoiceAIBoard() {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<Tab>("invoices");
  const [busy, setBusy] = useState<string | null>(null);
  const [provider, setProvider] = useState("");
  const [seed, setSeed] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    try { setData(await getInvoiceData()); } catch { toast.error("Could not load InvoiceAI."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="animate-pulse bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl h-64 w-full" />;

  const currency = data.settings?.currency || "USD";
  const dueDays = data.settings?.default_due_days ?? 14;
  const blank = (): Draft => ({
    id: null, client_id: "", issue_date: today(), due_date: addDays(dueDays), currency,
    items: [{ description: "", quantity: 1, unit_price: 0 }], tax_rate: "0",
    notes: data.settings?.default_notes || "", source: "manual",
  });

  const act = async (key: string, fn: () => Promise<any>, okMsg: string) => {
    setBusy(key);
    const r = await fn();
    setBusy(null);
    if (r.ok) { toast.success(okMsg); await load(); } else toast.error(r.error);
  };

  const providerSelect = data.connectedProviders.length > 1 ? (
    <select className={input + " max-w-[200px]"} value={provider || data.connectedProviders[0]} onChange={(e) => setProvider(e.target.value)}>
      {data.connectedProviders.map((p: string) => <option key={p} value={p}>Send from {p[0].toUpperCase() + p.slice(1)}</option>)}
    </select>
  ) : null;

  return (
    <div className="space-y-4">
      {!data.catalogReady && <div className={`${card} text-sm`}>InvoiceAI isn't available on your account yet.</div>}
      {data.catalogReady && !data.enabled && (
        <div className={`${card} text-sm`}>
          InvoiceAI is off. You can draft invoices, but to send them turn it on from the <Link href="/automations" className="underline">Automations</Link> page.
        </div>
      )}
      {data.connectedProviders.length === 0 && (
        <div className={`${card} text-sm`}>
          No email connected. Connect Google, Microsoft or Zoho in <Link href="/integrations" className="underline">Integrations</Link> to send invoices from your own address.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["invoices", "editor", "clients", "settings"] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? btnPrimary : btnGhost}
            onClick={() => { if (t === "editor") setSeed(null); setTab(t); }}>
            {t === "editor" ? "New invoice" : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
        {tab === "invoices" && <div className="ml-auto">{providerSelect}</div>}
      </div>

      {tab === "invoices" && (
        <div className="space-y-3">
          {data.invoices.length === 0 && <div className={`${card} text-sm text-slate-500`}>No invoices yet. Create your first one with New invoice.</div>}
          {data.invoices.map((inv: any) => {
            const status = displayStatus(inv.status, inv.due_date);
            const link = `${typeof window !== "undefined" ? window.location.origin : ""}/invoice/${inv.public_token}`;
            const name = data.clients.find((c: any) => c.id === inv.client_id)?.name || "Unknown client";
            return (
              <div key={inv.id} className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white">{inv.number}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${STATUS_STYLE[status]}`}>{status}</span>
                    {inv.viewed_at && inv.status === "sent" && <span className="text-xs text-slate-500">viewed</span>}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-[#888] truncate">{name} · due {inv.due_date}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-2 font-semibold text-slate-900 dark:text-white">{money(Number(inv.total), inv.currency)}</span>
                  {inv.status === "draft" && (
                    <>
                      <button className={btnGhost} onClick={() => { setSeed({ id: inv.id, client_id: inv.client_id, issue_date: inv.issue_date, due_date: inv.due_date, currency: inv.currency, items: inv.items, tax_rate: String(inv.tax_rate), notes: inv.notes || "", source: inv.source }); setTab("editor"); }}>Edit</button>
                      <button className={btnPrimary} disabled={busy === inv.id} onClick={() => act(inv.id, () => sendInvoice(inv.id, provider || undefined), "Invoice sent.")}>{busy === inv.id ? "Sending…" : "Send"}</button>
                      <button className={btnGhost} onClick={() => confirm("Delete this draft?") && act(inv.id, () => deleteDraftInvoice(inv.id), "Draft deleted.")}>Delete</button>
                    </>
                  )}
                  {inv.status === "sent" && (
                    <>
                      <button className={btnGhost} disabled={busy === inv.id} onClick={() => act(inv.id, () => sendInvoice(inv.id, provider || undefined), "Invoice resent.")}>{busy === inv.id ? "Sending…" : "Resend"}</button>
                      <button className={btnPrimary} onClick={() => act(inv.id, () => markInvoicePaid(inv.id), "Marked as paid.")}>Mark paid</button>
                      <button className={btnGhost} onClick={() => confirm("Void this invoice?") && act(inv.id, () => voidInvoice(inv.id), "Invoice voided.")}>Void</button>
                    </>
                  )}
                  {inv.status !== "draft" && (
                    <button className={btnGhost} onClick={() => { navigator.clipboard?.writeText(link); toast.success("Link copied."); }}>Copy link</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "editor" && (
        <Editor
          key={seed?.id || "new"} data={data} seed={seed || blank()} providerSelect={providerSelect}
          onDone={async (sendId: string | null) => {
            await load();
            setTab("invoices");
            if (sendId) {
              setBusy(sendId);
              const r = await sendInvoice(sendId, provider || undefined);
              setBusy(null);
              if (r.ok) toast.success("Invoice sent."); else toast.error(r.error + " It's saved as a draft.");
              await load();
            }
          }}
        />
      )}
      {tab === "clients" && <Clients data={data} reload={load} />}
      {tab === "settings" && <Settings data={data} reload={load} />}
    </div>
  );
}

// ---------------- Editor ----------------

function Editor({ data, seed, onDone, providerSelect }: { data: Data; seed: Draft; onDone: (sendId: string | null) => Promise<void>; providerSelect: ReactNode }) {
  const [d, setD] = useState<Draft>(seed);
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const setItem = (i: number, patch: Partial<InvoiceItem>) => set("items", d.items.map((it, n) => (n === i ? { ...it, ...patch } : it)));
  const totals = calcTotals(d.items.filter((i) => i.description.trim()), Number(d.tax_rate) || 0);

  const runAI = async () => {
    setAiBusy(true);
    const r = await draftInvoiceWithAI(aiText);
    setAiBusy(false);
    if (!r.ok) return toast.error(r.error);
    setD((p) => ({ ...p, items: r.items, notes: p.notes || r.notes, source: "ai" }));
    toast.success("Draft filled in. Check the amounts before sending.");
  };

  const save = async (send: boolean) => {
    setSaving(true);
    const r = await saveInvoice({ ...d, tax_rate: Number(d.tax_rate) || 0 });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Draft saved.");
    await onDone(send ? r.id : null);
  };

  return (
    <div className="space-y-4">
      {data.clients.length === 0 && <div className={`${card} text-sm`}>Add a client first in the Clients tab.</div>}

      <div className={`${card} space-y-2`}>
        <label className={lbl}>Describe the work (optional). AI fills in the line items from your words.</label>
        <textarea className={input} rows={3} value={aiText} onChange={(e) => setAiText(e.target.value)}
          placeholder="e.g. 6 hours of website changes at $80/hour and one logo redesign for $250" />
        <button className={btnGhost} disabled={aiBusy || aiText.trim().length < 5} onClick={runAI}>{aiBusy ? "Drafting…" : "Draft with AI"}</button>
      </div>

      <div className={`${card} grid gap-3 sm:grid-cols-4`}>
        <div className="sm:col-span-2">
          <label className={lbl}>Client</label>
          <select className={input} value={d.client_id} onChange={(e) => set("client_id", e.target.value)}>
            <option value="">Select a client</option>
            {data.clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}
          </select>
        </div>
        <div><label className={lbl}>Issue date</label><input type="date" className={input} value={d.issue_date} onChange={(e) => set("issue_date", e.target.value)} /></div>
        <div><label className={lbl}>Due date</label><input type="date" className={input} value={d.due_date} onChange={(e) => set("due_date", e.target.value)} /></div>
      </div>

      <div className={`${card} space-y-3`}>
        <p className="text-sm font-medium text-slate-900 dark:text-white">Line items</p>
        {d.items.map((it, i) => (
          <div key={i} className="grid grid-cols-12 gap-2">
            <input className={`${input} col-span-12 sm:col-span-6`} placeholder="Description" value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} />
            <input className={`${input} col-span-4 sm:col-span-2`} type="number" min="0" step="any" placeholder="Qty" value={it.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) })} />
            <input className={`${input} col-span-5 sm:col-span-3`} type="number" min="0" step="any" placeholder="Price" value={it.unit_price} onChange={(e) => setItem(i, { unit_price: Number(e.target.value) })} />
            <button className={`${btnGhost} col-span-3 sm:col-span-1`} onClick={() => set("items", d.items.length > 1 ? d.items.filter((_, n) => n !== i) : d.items)} aria-label="Remove line">✕</button>
          </div>
        ))}
        <button className={btnGhost} onClick={() => set("items", [...d.items, { description: "", quantity: 1, unit_price: 0 }])}>+ Add line</button>

        <div className="grid gap-3 sm:grid-cols-2 pt-2">
          <div><label className={lbl}>Tax rate (%)</label><input className={input} type="number" min="0" max="100" step="any" value={d.tax_rate} onChange={(e) => set("tax_rate", e.target.value)} /></div>
          <div className="text-sm sm:text-right space-y-0.5 text-slate-700 dark:text-slate-200">
            <p>Subtotal {money(totals.subtotal, d.currency)}</p>
            {totals.tax_rate > 0 && <p>Tax {money(totals.tax_amount, d.currency)}</p>}
            <p className="font-semibold">Total {money(totals.total, d.currency)}</p>
          </div>
        </div>
        <div><label className={lbl}>Notes (shown on the invoice)</label><textarea className={input} rows={2} value={d.notes} onChange={(e) => set("notes", e.target.value)} /></div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className={btnGhost} disabled={saving} onClick={() => save(false)}>Save draft</button>
        <button className={btnPrimary} disabled={saving || !data.enabled} onClick={() => save(true)}>Save and send</button>
        {providerSelect}
      </div>
    </div>
  );
}

// ---------------- Clients ----------------

function Clients({ data, reload }: { data: Data; reload: () => Promise<void> }) {
  const empty = { id: "", name: "", email: "", phone: "", company: "", address: "", notes: "" };
  const [f, setF] = useState<any>(empty);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const r = await saveInvoiceClient({ ...f, id: f.id || undefined });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Client saved.");
    setF(empty);
    await reload();
  };

  return (
    <div className="space-y-4">
      <div className={`${card} grid gap-3 sm:grid-cols-2`}>
        <div><label className={lbl}>Name</label><input className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className={lbl}>Email (needed to send invoices)</label><input className={input} type="email" value={f.email || ""} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className={lbl}>Company</label><input className={input} value={f.company || ""} onChange={(e) => setF({ ...f, company: e.target.value })} /></div>
        <div><label className={lbl}>Phone</label><input className={input} value={f.phone || ""} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div className="sm:col-span-2"><label className={lbl}>Address</label><textarea className={input} rows={2} value={f.address || ""} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
        <div className="sm:col-span-2 flex gap-2">
          <button className={btnPrimary} disabled={saving} onClick={submit}>{f.id ? "Update client" : "Add client"}</button>
          {f.id && <button className={btnGhost} onClick={() => setF(empty)}>Cancel</button>}
        </div>
      </div>

      {data.clients.map((c: any) => (
        <div key={c.id} className={`${card} flex items-center justify-between gap-3`}>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 dark:text-white truncate">{c.name}{c.company ? ` · ${c.company}` : ""}</p>
            <p className="text-sm text-slate-500 dark:text-[#888] truncate">{c.email || "No email"}</p>
          </div>
          <div className="flex gap-2">
            <button className={btnGhost} onClick={() => setF(c)}>Edit</button>
            <button className={btnGhost} onClick={async () => {
              if (!confirm(`Delete ${c.name}?`)) return;
              const r = await deleteInvoiceClient(c.id);
              if (r.ok) { toast.success("Client deleted."); await reload(); } else toast.error(r.error);
            }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------- Settings ----------------

function Settings({ data, reload }: { data: Data; reload: () => Promise<void> }) {
  const s: any = data.settings || {};
  const [f, setF] = useState<any>({
    business_name: s.business_name ?? data.defaultBusinessName ?? "", business_email: s.business_email ?? "",
    business_address: s.business_address ?? "", tax_id: s.tax_id ?? "", currency: s.currency ?? "USD",
    invoice_prefix: s.invoice_prefix ?? "INV-", default_due_days: s.default_due_days ?? 14,
    payment_instructions: s.payment_instructions ?? "", default_notes: s.default_notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const field = (k: string, text: string, type = "text") => (
    <div><label className={lbl}>{text}</label><input className={input} type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  );

  return (
    <div className={`${card} grid gap-3 sm:grid-cols-2`}>
      {field("business_name", "Business name")}
      {field("business_email", "Business email (shown on invoices)", "email")}
      <div className="sm:col-span-2"><label className={lbl}>Business address</label><textarea className={input} rows={2} value={f.business_address} onChange={(e) => setF({ ...f, business_address: e.target.value })} /></div>
      {field("tax_id", "Tax ID (optional)")}
      {field("currency", "Currency (3-letter code, e.g. USD)")}
      {field("invoice_prefix", "Invoice number prefix")}
      {field("default_due_days", "Default days until due", "number")}
      <div className="sm:col-span-2"><label className={lbl}>How customers should pay (bank details, payment link, etc.)</label><textarea className={input} rows={3} value={f.payment_instructions} onChange={(e) => setF({ ...f, payment_instructions: e.target.value })} /></div>
      <div className="sm:col-span-2"><label className={lbl}>Default invoice notes</label><textarea className={input} rows={2} value={f.default_notes} onChange={(e) => setF({ ...f, default_notes: e.target.value })} /></div>
      <div className="sm:col-span-2">
        <button className={btnPrimary} disabled={saving} onClick={async () => {
          setSaving(true);
          const r = await saveInvoiceSettings(f);
          setSaving(false);
          if (r.ok) { toast.success("Settings saved."); await reload(); } else toast.error(r.error);
        }}>Save settings</button>
      </div>
    </div>
  );
}

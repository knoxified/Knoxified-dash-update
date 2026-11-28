"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  getDocuflowData, saveDocTemplate, deleteDocTemplate, draftTemplateWithAI,
  saveDocument, deleteDraftDocument, voidDocument, sendDocument,
} from "@/lib/actions/docuflow-actions";
import { AUTO_FIELDS, DOC_KINDS, STARTER_TEMPLATES, extractFields, fieldLabel, renderTemplate } from "@/lib/docuflow";

type Data = Awaited<ReturnType<typeof getDocuflowData>>;
type Tab = "documents" | "new" | "templates";
type DocSeed = { id: string | null; title: string; body: string; kind: string; recipient_name: string; recipient_email: string; template_id: string; client_id: string; lead_id: string };

const card = "bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-4";
const input = "w-full rounded-lg border border-slate-300 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400";
const btn = "rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50";
const btnPrimary = `${btn} bg-blue-600 text-white hover:bg-blue-500`;
const btnGhost = `${btn} border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5`;
const lbl = "block text-xs font-medium text-slate-500 dark:text-[#888] mb-1";
const STATUS_STYLE: Record<string, string> = {
  draft: "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  void: "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-500",
};

export default function DocuFlowBoard() {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<Tab>("documents");
  const [busy, setBusy] = useState<string | null>(null);
  const [provider, setProvider] = useState("");
  const [seed, setSeed] = useState<DocSeed | null>(null);

  const load = useCallback(async () => {
    try { setData(await getDocuflowData()); } catch { toast.error("Could not load DocuFlow."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="animate-pulse bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl h-64 w-full" />;

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
      {!data.catalogReady && <div className={`${card} text-sm`}>DocuFlow isn't available on your account yet.</div>}
      {data.catalogReady && !data.enabled && (
        <div className={`${card} text-sm`}>DocuFlow is off. You can draft documents, but to send them turn it on from the <Link href="/automations" className="underline">Automations</Link> page.</div>
      )}
      {data.connectedProviders.length === 0 && (
        <div className={`${card} text-sm`}>No email connected. Connect Google, Microsoft or Zoho in <Link href="/integrations" className="underline">Integrations</Link> to send documents from your own address.</div>
      )}
      <div className={`${card} text-xs text-slate-500 dark:text-[#888]`}>
        Documents are generated from your templates and are not legal advice. Have a lawyer review contracts before you use them.
      </div>

      <div className="flex flex-wrap gap-2">
        {(["documents", "new", "templates"] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? btnPrimary : btnGhost} onClick={() => { if (t === "new") setSeed(null); setTab(t); }}>
            {t === "new" ? "New document" : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
        {tab === "documents" && <div className="ml-auto">{providerSelect}</div>}
      </div>

      {tab === "documents" && (
        <div className="space-y-3">
          {data.documents.length === 0 && <div className={`${card} text-sm text-slate-500`}>No documents yet. Create one with New document.</div>}
          {data.documents.map((d: any) => {
            const link = `${typeof window !== "undefined" ? window.location.origin : ""}/doc/${d.public_token}`;
            return (
              <div key={d.id} className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white truncate">{d.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${STATUS_STYLE[d.status]}`}>{d.status}</span>
                    {d.viewed_at && d.status === "sent" && <span className="text-xs text-slate-500">viewed</span>}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-[#888] truncate">{d.recipient_name || "No recipient"}{d.recipient_email ? ` · ${d.recipient_email}` : ""}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {d.status === "draft" && (
                    <>
                      <button className={btnGhost} onClick={() => { setSeed({ id: d.id, title: d.title, body: d.body, kind: d.kind, recipient_name: d.recipient_name || "", recipient_email: d.recipient_email || "", template_id: "", client_id: "", lead_id: "" }); setTab("new"); }}>Edit</button>
                      <button className={btnPrimary} disabled={busy === d.id} onClick={() => act(d.id, () => sendDocument(d.id, provider || undefined), "Document sent.")}>{busy === d.id ? "Sending…" : "Send"}</button>
                      <button className={btnGhost} onClick={() => confirm("Delete this draft?") && act(d.id, () => deleteDraftDocument(d.id), "Draft deleted.")}>Delete</button>
                    </>
                  )}
                  {d.status === "sent" && (
                    <>
                      <button className={btnGhost} disabled={busy === d.id} onClick={() => act(d.id, () => sendDocument(d.id, provider || undefined), "Document resent.")}>{busy === d.id ? "Sending…" : "Resend"}</button>
                      <button className={btnGhost} onClick={() => confirm("Void this document?") && act(d.id, () => voidDocument(d.id), "Document voided.")}>Void</button>
                    </>
                  )}
                  {d.status !== "draft" && <button className={btnGhost} onClick={() => { navigator.clipboard?.writeText(link); toast.success("Link copied."); }}>Copy link</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "new" && (
        <NewDocument
          key={seed?.id || "new"} data={data} seed={seed} providerSelect={providerSelect}
          onDone={async (sendId: string | null) => {
            await load(); setTab("documents");
            if (sendId) {
              setBusy(sendId);
              const r = await sendDocument(sendId, provider || undefined);
              setBusy(null);
              if (r.ok) toast.success("Document sent."); else toast.error(r.error + " It's saved as a draft.");
              await load();
            }
          }}
        />
      )}
      {tab === "templates" && <Templates data={data} reload={load} />}
    </div>
  );
}

// ---------------- New / edit document ----------------

function NewDocument({ data, seed, onDone, providerSelect }: { data: Data; seed: DocSeed | null; onDone: (sendId: string | null) => Promise<void>; providerSelect: ReactNode }) {
  const editing = !!seed?.id;
  const [templateId, setTemplateId] = useState("");
  const [recipient, setRecipient] = useState(""); // "client:<id>" | "lead:<id>" | ""
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [doc, setDoc] = useState<DocSeed>(seed || { id: null, title: "", body: "", kind: "other", recipient_name: "", recipient_email: "", template_id: "", client_id: "", lead_id: "" });
  const [saving, setSaving] = useState(false);

  const template = data.templates.find((t: any) => t.id === templateId);
  const person: any = useMemo(() => {
    const [type, id] = recipient.split(":");
    if (type === "client") return data.clients.find((c: any) => c.id === id) || null;
    if (type === "lead") return data.leads.find((l: any) => l.id === id) || null;
    return null;
  }, [recipient, data]);

  const fields = template ? extractFields(template.body) : [];
  const customFields = fields.filter((f) => !(AUTO_FIELDS as readonly string[]).includes(f));
  const values = (): Record<string, string> => ({
    client_name: person?.name || "", client_email: person?.email || "", client_company: person?.company || "",
    client_phone: person?.phone || "", client_address: person?.address || "",
    business_name: data.businessName,
    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    ...custom,
  });

  const generate = () => {
    if (!template) return toast.error("Pick a template first.");
    const v = values();
    const missing = fields.filter((f) => !v[f]?.trim());
    const body = renderTemplate(template.body, v);
    setDoc((p) => ({
      ...p, body, kind: template.kind, template_id: template.id,
      title: p.title || `${template.name}${person?.name ? ` for ${person.name}` : ""}`,
      recipient_name: person?.name || p.recipient_name, recipient_email: person?.email || p.recipient_email,
      client_id: recipient.startsWith("client:") ? recipient.slice(7) : "", lead_id: recipient.startsWith("lead:") ? recipient.slice(5) : "",
    }));
    if (missing.length) toast.info(`Not filled in: ${missing.map(fieldLabel).join(", ")}. You can type them into the text below.`);
  };

  const save = async (send: boolean) => {
    setSaving(true);
    const r = await saveDocument({ ...doc });
    setSaving(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("Draft saved.");
    await onDone(send ? r.id : null);
  };

  return (
    <div className="space-y-4">
      {!editing && (
        <div className={`${card} space-y-3`}>
          <p className="text-sm font-medium text-slate-900 dark:text-white">1. Start from a template</p>
          {data.templates.length === 0 && <p className="text-sm text-slate-500">No templates yet. Add some in the Templates tab, or write the document by hand below.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={lbl}>Template</label>
              <select className={input} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                <option value="">Select a template</option>
                {data.templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Who is it for?</label>
              <select className={input} value={recipient} onChange={(e) => setRecipient(e.target.value)}>
                <option value="">Type details by hand</option>
                {data.clients.length > 0 && <optgroup label="Clients">{data.clients.map((c: any) => <option key={c.id} value={`client:${c.id}`}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}</optgroup>}
                {data.leads.length > 0 && <optgroup label="Leads">{data.leads.map((l: any) => <option key={l.id} value={`lead:${l.id}`}>{l.name || l.email}{l.company ? ` (${l.company})` : ""}</option>)}</optgroup>}
              </select>
            </div>
          </div>
          {customFields.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {customFields.map((f) => (
                <div key={f}><label className={lbl}>{fieldLabel(f)}</label>
                  <input className={input} value={custom[f] || ""} onChange={(e) => setCustom({ ...custom, [f]: e.target.value })} /></div>
              ))}
            </div>
          )}
          <button className={btnPrimary} onClick={generate} disabled={!template}>Generate document</button>
        </div>
      )}

      <div className={`${card} space-y-3`}>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{editing ? "Edit draft" : "2. Review and edit"}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-3"><label className={lbl}>Title</label><input className={input} value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} /></div>
          <div><label className={lbl}>Recipient name</label><input className={input} value={doc.recipient_name} onChange={(e) => setDoc({ ...doc, recipient_name: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className={lbl}>Recipient email (needed to send)</label><input className={input} type="email" value={doc.recipient_email} onChange={(e) => setDoc({ ...doc, recipient_email: e.target.value })} /></div>
        </div>
        <div>
          <label className={lbl}>Document text. Lines starting with # are titles and ## are section headings.</label>
          <textarea className={input + " font-mono"} rows={18} value={doc.body} onChange={(e) => setDoc({ ...doc, body: e.target.value })} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className={btnGhost} disabled={saving} onClick={() => save(false)}>Save draft</button>
        <button className={btnPrimary} disabled={saving || !data.enabled} onClick={() => save(true)}>Save and send</button>
        {providerSelect}
      </div>
    </div>
  );
}

// ---------------- Templates ----------------

function Templates({ data, reload }: { data: Data; reload: () => Promise<void> }) {
  const empty = { id: "", name: "", kind: "contract", body: "" };
  const [f, setF] = useState<any>(empty);
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const detected = extractFields(f.body);

  const addStarters = async () => {
    setSaving(true);
    for (const t of STARTER_TEMPLATES) await saveDocTemplate(t);
    setSaving(false);
    toast.success("Starter templates added.");
    await reload();
  };

  return (
    <div className="space-y-4">
      {data.templates.length === 0 && (
        <div className={`${card} flex items-center justify-between gap-3`}>
          <p className="text-sm text-slate-600 dark:text-slate-300">Start with three ready-made templates: a service agreement, a proposal and a status report.</p>
          <button className={btnPrimary} disabled={saving} onClick={addStarters}>Add starter templates</button>
        </div>
      )}

      <div className={`${card} space-y-3`}>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{f.id ? "Edit template" : "New template"}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2"><label className={lbl}>Name</label><input className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><label className={lbl}>Type</label>
            <select className={input} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>{DOC_KINDS.map((k) => <option key={k} value={k}>{fieldLabel(k)}</option>)}</select></div>
        </div>
        <div className="space-y-2">
          <label className={lbl}>Describe the document and AI will write the template (optional)</label>
          <textarea className={input} rows={2} value={aiText} onChange={(e) => setAiText(e.target.value)} placeholder="e.g. A monthly retainer agreement for a dental marketing service" />
          <button className={btnGhost} disabled={aiBusy || aiText.trim().length < 10} onClick={async () => {
            setAiBusy(true);
            const r = await draftTemplateWithAI(f.kind, aiText);
            setAiBusy(false);
            if (r.ok) { setF({ ...f, body: r.body }); toast.success("Template drafted. Read it through before you use it."); } else toast.error(r.error);
          }}>{aiBusy ? "Drafting…" : "Draft with AI"}</button>
        </div>
        <div>
          <label className={lbl}>Template text. Use {"{{field_name}}"} for anything that changes per client.</label>
          <textarea className={input + " font-mono"} rows={14} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
          {detected.length > 0 && <p className="mt-1 text-xs text-slate-500">Fields found: {detected.join(", ")}</p>}
        </div>
        <div className="flex gap-2">
          <button className={btnPrimary} disabled={saving} onClick={async () => {
            setSaving(true);
            const r = await saveDocTemplate({ ...f, id: f.id || undefined });
            setSaving(false);
            if (r.ok) { toast.success("Template saved."); setF(empty); await reload(); } else toast.error(r.error);
          }}>{f.id ? "Update template" : "Save template"}</button>
          {f.id && <button className={btnGhost} onClick={() => setF(empty)}>Cancel</button>}
        </div>
      </div>

      {data.templates.map((t: any) => (
        <div key={t.id} className={`${card} flex items-center justify-between gap-3`}>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 dark:text-white truncate">{t.name}</p>
            <p className="text-sm text-slate-500 dark:text-[#888]">{fieldLabel(t.kind)} · {extractFields(t.body).length} fields</p>
          </div>
          <div className="flex gap-2">
            <button className={btnGhost} onClick={() => setF({ id: t.id, name: t.name, kind: t.kind, body: t.body })}>Edit</button>
            <button className={btnGhost} onClick={async () => {
              if (!confirm(`Delete ${t.name}?`)) return;
              const r = await deleteDocTemplate(t.id);
              if (r.ok) { toast.success("Template deleted."); await reload(); } else toast.error(r.error);
            }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

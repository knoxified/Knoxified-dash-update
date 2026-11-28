"use server";

import { headers } from "next/headers";
import { GoogleGenAI } from "@google/genai";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { callAuth } from "@/lib/auth-service";
import { requireComplianceAcknowledged } from "@/lib/actions/compliance-actions";
import { MAIL_PROVIDERS, type MailProvider } from "@/lib/email-templates";
import { checkCredits } from "@/lib/automation-billing";
import { DOC_KINDS, type DocKind } from "@/lib/docuflow";

const DOC_KEY = "doc_send";
const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}
const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const kindOf = (v: unknown): DocKind => (DOC_KINDS.includes(v as DocKind) ? (v as DocKind) : "other");

export async function getDocuflowData() {
  const { supabase, user } = await requireUser();
  const [tplR, docR, clientR, leadR, connsR, bizR, profileR, catalogR] = await Promise.all([
    supabase.from("doc_templates").select("id, name, kind, body").order("created_at", { ascending: false }),
    supabase
      .from("generated_documents")
      .select("id, title, kind, body, status, recipient_name, recipient_email, public_token, sent_at, viewed_at, created_at")
      .order("created_at", { ascending: false }).limit(200),
    supabase.from("invoice_clients").select("id, name, email, company, phone, address").order("name"),
    supabase.from("leads").select("id, name, email, company, phone").order("created_at", { ascending: false }).limit(200),
    supabase.from("oauth_connections").select("provider, status").eq("user_id", user.id).in("provider", MAIL_PROVIDERS),
    supabase.from("invoice_settings").select("business_name").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_profiles").select("organization_name, full_name").eq("user_id", user.id).maybeSingle(),
    supabase.from("automation_catalog").select("id").eq("key", DOC_KEY).maybeSingle(),
  ]);

  let enabled = false;
  if (catalogR.data?.id) {
    const { data: ua } = await supabase.from("user_automations").select("is_enabled")
      .eq("user_id", user.id).eq("automation_id", catalogR.data.id).maybeSingle();
    enabled = !!ua?.is_enabled;
  }

  return {
    templates: tplR.data || [],
    documents: docR.data || [],
    clients: clientR.data || [],
    leads: (leadR.data || []).filter((l: any) => l.name || l.email),
    connectedProviders: MAIL_PROVIDERS.filter((p) =>
      (connsR.data || []).some((c: any) => c.provider === p && (!c.status || c.status === "active"))
    ) as MailProvider[],
    businessName: bizR.data?.business_name || profileR.data?.organization_name || profileR.data?.full_name || "",
    catalogReady: !!catalogR.data?.id,
    enabled,
  };
}

// ---------- Templates ----------

export async function saveDocTemplate(input: Record<string, unknown>): Promise<Result<{ id: string }>> {
  const { supabase, user } = await requireUser();
  const name = clip(input.name, 100);
  const body = String(input.body ?? "").trim().slice(0, 30000);
  if (!name) return { ok: false, error: "Give the template a name." };
  if (body.length < 10) return { ok: false, error: "The template text is empty." };
  const payload = { name, kind: kindOf(input.kind), body };
  const id = typeof input.id === "string" && input.id ? input.id : null;
  const q = id
    ? supabase.from("doc_templates").update(payload).eq("id", id).eq("user_id", user.id).select("id").single()
    : supabase.from("doc_templates").insert({ ...payload, user_id: user.id }).select("id").single();
  const { data, error } = await q;
  if (error) return { ok: false, error: "Could not save template." };
  return { ok: true, id: data.id };
}

export async function deleteDocTemplate(id: string): Promise<Result> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("doc_templates").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, error: "Could not delete template." };
  return { ok: true };
}

export async function draftTemplateWithAI(kind: string, description: string): Promise<Result<{ body: string }>> {
  await requireUser();
  const text = clip(description, 1500);
  if (text.length < 10) return { ok: false, error: "Describe what the document is for." };
  if (!process.env.GEMINI_API_KEY) return { ok: false, error: "AI drafting isn't available right now." };
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: `Document type: ${kindOf(kind)}\nWhat it is for: ${text}`,
      config: {
        systemInstruction:
          "Write a reusable document template in plain text. Use {{snake_case}} placeholders for anything that changes per client or job. " +
          "Where they apply, use exactly these standard placeholders: client_name, client_company, client_email, client_address, business_name, date. Invent other placeholders for custom details. " +
          "Format: lines starting with '# ' are the title, lines starting with '## ' are section headings, everything else is plain paragraphs. No markdown other than that, no tables, no bullet symbols. " +
          "Keep it under 600 words. Do not invent legal claims, statutes or guarantees. Return only the template text.",
      },
    });
    const out = (response.text || "").replace(/```[a-z]*\n?|```/gi, "").trim().slice(0, 30000);
    if (out.length < 30) return { ok: false, error: "The draft came back empty. Try describing it differently." };
    return { ok: true, body: out };
  } catch (err) {
    console.error("DocuFlow AI draft error:", err);
    return { ok: false, error: "AI drafting failed. You can still write the template by hand." };
  }
}

// ---------- Documents ----------

export async function saveDocument(input: Record<string, unknown>): Promise<Result<{ id: string }>> {
  const { supabase, user } = await requireUser();
  const title = clip(input.title, 150);
  const body = String(input.body ?? "").trim().slice(0, 50000);
  const email = clip(input.recipient_email, 200).toLowerCase();
  if (!title) return { ok: false, error: "Give the document a title." };
  if (body.length < 5) return { ok: false, error: "The document is empty." };
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: "The recipient email doesn't look right." };

  const fields = {
    title, body, kind: kindOf(input.kind),
    recipient_name: clip(input.recipient_name, 120) || null,
    recipient_email: email || null,
    template_id: typeof input.template_id === "string" && input.template_id ? input.template_id : null,
    client_id: typeof input.client_id === "string" && input.client_id ? input.client_id : null,
    lead_id: typeof input.lead_id === "string" && input.lead_id ? input.lead_id : null,
  };

  const id = typeof input.id === "string" && input.id ? input.id : null;
  if (id) {
    const { data: existing } = await supabase.from("generated_documents").select("status").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (!existing) return { ok: false, error: "Document not found." };
    if (existing.status !== "draft") return { ok: false, error: "Only draft documents can be edited." };
    const { error } = await supabase.from("generated_documents").update(fields).eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: "Could not save document." };
    return { ok: true, id };
  }
  const { data, error } = await supabase.from("generated_documents").insert({ ...fields, user_id: user.id }).select("id").single();
  if (error) return { ok: false, error: "Could not save document." };
  return { ok: true, id: data.id };
}

export async function deleteDraftDocument(id: string): Promise<Result> {
  const { supabase, user } = await requireUser();
  const { error, count } = await supabase.from("generated_documents").delete({ count: "exact" })
    .eq("id", id).eq("user_id", user.id).eq("status", "draft");
  if (error || !count) return { ok: false, error: "Only drafts can be deleted. Void a sent document instead." };
  return { ok: true };
}

export async function voidDocument(id: string): Promise<Result> {
  const { supabase, user } = await requireUser();
  const { error, count } = await supabase.from("generated_documents").update({ status: "void" }, { count: "exact" })
    .eq("id", id).eq("user_id", user.id).in("status", ["draft", "sent"]);
  if (error || !count) return { ok: false, error: "This document can't be voided." };
  return { ok: true };
}

export async function sendDocument(docId: string, provider?: string): Promise<Result<{ link: string }>> {
  const { supabase, user } = await requireUser();

  const compliance = await requireComplianceAcknowledged(user.id);
  if (!compliance.ok) return { ok: false, error: compliance.error };

  const { data: catalog } = await supabase.from("automation_catalog").select("id, credit_cost").eq("key", DOC_KEY).maybeSingle();
  if (!catalog) return { ok: false, error: "DocuFlow isn't set up yet." };
  const { data: ua } = await supabase.from("user_automations").select("is_enabled").eq("user_id", user.id).eq("automation_id", catalog.id).maybeSingle();
  if (!ua?.is_enabled) return { ok: false, error: "Turn on DocuFlow in Automations before sending documents." };

  const { data: doc } = await supabase.from("generated_documents")
    .select("id, title, status, recipient_name, recipient_email, public_token, sent_at")
    .eq("id", docId).eq("user_id", user.id).maybeSingle();
  if (!doc) return { ok: false, error: "Document not found." };
  if (doc.status !== "draft" && doc.status !== "sent") return { ok: false, error: "Only draft or sent documents can be sent." };
  if (!doc.recipient_email || !EMAIL_RE.test(doc.recipient_email)) return { ok: false, error: "Add a recipient email to this document first." };

  const firstSend = !doc.sent_at;
  if (firstSend) {
    const credits = await checkCredits(user.id, catalog.credit_cost ?? 0);
    if (!credits.ok) return credits;
  }

  const { data: conns } = await supabase.from("oauth_connections").select("provider, status").eq("user_id", user.id).in("provider", MAIL_PROVIDERS);
  const connected = MAIL_PROVIDERS.filter((p) => (conns || []).some((c: any) => c.provider === p && (!c.status || c.status === "active")));
  if (connected.length === 0) return { ok: false, error: "Connect your email (Google, Microsoft or Zoho) in Integrations first." };
  const useProvider = (provider && connected.includes(provider as MailProvider) ? provider : connected[0]) as MailProvider;

  const [{ data: biz }, { data: profile }] = await Promise.all([
    supabase.from("invoice_settings").select("business_name").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_profiles").select("organization_name, full_name").eq("user_id", user.id).maybeSingle(),
  ]);
  const sender = biz?.business_name || profile?.organization_name || profile?.full_name || "Your service provider";

  const h = await headers();
  const origin = process.env.APP_URL || `https://${h.get("host")}`;
  const link = `${origin}/doc/${doc.public_token}`;

  if (firstSend) {
    const { data: claimed } = await supabase.from("generated_documents")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", doc.id).eq("user_id", user.id).is("sent_at", null).select("id");
    if (!claimed || claimed.length === 0) return { ok: false, error: "This document was just sent." };
  }

  const firstName = String(doc.recipient_name || "").trim().split(/\s+/)[0] || "there";
  const body =
    `Hi ${firstName},\n\n` +
    `${sender} has shared a document with you: ${doc.title}\n\n` +
    `You can view and print it here:\n${link}\n\n` +
    `If you weren't expecting this, you can ignore this email.`;

  const res = await callAuth("/auth/mail/send", {
    userId: user.id, provider: useProvider, to: doc.recipient_email,
    subject: `${doc.title} from ${sender}`, body,
  });

  if (res.status !== 200 || !res.json?.ok) {
    if (firstSend) {
      await supabase.from("generated_documents").update({ status: "draft", sent_at: null }).eq("id", doc.id).eq("user_id", user.id);
    }
    const code = res.json?.error;
    if (code === "no_connection_found") return { ok: false, error: "Your mailbox isn't connected. Connect it in Integrations." };
    if (code === "token_expired") return { ok: false, error: "Your mailbox connection expired. Reconnect it in Integrations." };
    if (res.status === 403) return { ok: false, error: "Your mailbox connection can't send email. Reconnect it in Integrations and allow sending." };
    return { ok: false, error: "The email couldn't be sent. Try again in a moment." };
  }

  if (firstSend) {
    const { error: runErr } = await supabaseAdmin.from("automation_runs").insert({
      user_id: user.id, automation_id: catalog.id, automation_key: DOC_KEY, run_units: 1, status: "completed",
      input_data: { document_id: doc.id }, output_data: { title: doc.title, provider: useProvider },
      completed_at: new Date().toISOString(), idempotency_key: `doc_send:${doc.id}`,
    });
    if (runErr) console.error("DocuFlow billing insert failed:", runErr);
  }
  return { ok: true, link };
}

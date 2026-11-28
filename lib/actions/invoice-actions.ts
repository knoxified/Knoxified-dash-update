"use server";

import { headers } from "next/headers";
import { GoogleGenAI } from "@google/genai";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { callAuth } from "@/lib/auth-service";
import { requireComplianceAcknowledged } from "@/lib/actions/compliance-actions";
import { MAIL_PROVIDERS, type MailProvider } from "@/lib/email-templates";
import { getBillingWindow } from "@/lib/billing-period";
import { calcTotals, cleanItems, money, type InvoiceItem } from "@/lib/invoices";

const INVOICE_KEY = "invoice_send";
const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

// ---------- Load everything the board needs ----------

export async function getInvoiceData() {
  const { supabase, user } = await requireUser();
  const [settingsR, clientsR, invoicesR, connsR, profileR, catalogR] = await Promise.all([
    supabase.from("invoice_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("invoice_clients").select("*").order("name"),
    supabase
      .from("invoices")
      .select("id, client_id, number, status, source, issue_date, due_date, currency, items, tax_rate, subtotal, tax_amount, total, notes, public_token, sent_at, viewed_at, paid_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("oauth_connections").select("provider, status").eq("user_id", user.id).in("provider", MAIL_PROVIDERS),
    supabase.from("user_profiles").select("organization_name, full_name").eq("user_id", user.id).maybeSingle(),
    supabase.from("automation_catalog").select("id").eq("key", INVOICE_KEY).maybeSingle(),
  ]);

  let enabled = false;
  if (catalogR.data?.id) {
    const { data: ua } = await supabase
      .from("user_automations")
      .select("is_enabled")
      .eq("user_id", user.id)
      .eq("automation_id", catalogR.data.id)
      .maybeSingle();
    enabled = !!ua?.is_enabled;
  }

  return {
    settings: settingsR.data,
    clients: clientsR.data || [],
    invoices: invoicesR.data || [],
    connectedProviders: MAIL_PROVIDERS.filter((p) =>
      (connsR.data || []).some((c: any) => c.provider === p && (!c.status || c.status === "active"))
    ) as MailProvider[],
    defaultBusinessName: profileR.data?.organization_name || profileR.data?.full_name || "",
    catalogReady: !!catalogR.data?.id,
    enabled,
  };
}

// ---------- Settings ----------

export async function saveInvoiceSettings(input: Record<string, unknown>): Promise<Result> {
  const { supabase, user } = await requireUser();
  const currency = clip(input.currency, 3).toUpperCase();
  const dueDays = Math.round(Number(input.default_due_days));
  const payload = {
    user_id: user.id,
    business_name: clip(input.business_name, 120) || null,
    business_email: clip(input.business_email, 200) || null,
    business_address: clip(input.business_address, 400) || null,
    tax_id: clip(input.tax_id, 60) || null,
    currency: /^[A-Z]{3}$/.test(currency) ? currency : "USD",
    invoice_prefix: clip(input.invoice_prefix, 10) || "INV-",
    default_due_days: Number.isFinite(dueDays) ? Math.min(Math.max(dueDays, 0), 180) : 14,
    payment_instructions: clip(input.payment_instructions, 1000) || null,
    default_notes: clip(input.default_notes, 1000) || null,
  };
  const { error } = await supabase.from("invoice_settings").upsert(payload, { onConflict: "user_id" });
  if (error) return { ok: false, error: "Could not save settings." };
  return { ok: true };
}

// ---------- Clients ----------

export async function saveInvoiceClient(input: Record<string, unknown>): Promise<Result<{ id: string }>> {
  const { supabase, user } = await requireUser();
  const name = clip(input.name, 120);
  const email = clip(input.email, 200).toLowerCase();
  if (!name) return { ok: false, error: "Client name is required." };
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: "That email address doesn't look right." };
  const payload = {
    name,
    email: email || null,
    phone: clip(input.phone, 40) || null,
    company: clip(input.company, 120) || null,
    address: clip(input.address, 400) || null,
    notes: clip(input.notes, 500) || null,
  };
  const id = typeof input.id === "string" ? input.id : null;
  const q = id
    ? supabase.from("invoice_clients").update(payload).eq("id", id).eq("user_id", user.id).select("id").single()
    : supabase.from("invoice_clients").insert({ ...payload, user_id: user.id }).select("id").single();
  const { data, error } = await q;
  if (error) {
    if ((error as any).code === "23505") return { ok: false, error: "You already have a client with that email." };
    return { ok: false, error: "Could not save client." };
  }
  return { ok: true, id: data.id };
}

export async function deleteInvoiceClient(id: string): Promise<Result> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("invoice_clients").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    if ((error as any).code === "23503") return { ok: false, error: "This client has invoices, so it can't be deleted." };
    return { ok: false, error: "Could not delete client." };
  }
  return { ok: true };
}

// ---------- Invoices ----------

export async function saveInvoice(input: Record<string, unknown>): Promise<Result<{ id: string }>> {
  const { supabase, user } = await requireUser();

  const clientId = String(input.client_id || "");
  const { data: client } = await supabase.from("invoice_clients").select("id").eq("id", clientId).eq("user_id", user.id).maybeSingle();
  if (!client) return { ok: false, error: "Pick a client first." };

  const items = cleanItems(input.items);
  if (items.length === 0) return { ok: false, error: "Add at least one line item with a description, quantity and price." };

  const issue = String(input.issue_date || "");
  const due = String(input.due_date || "");
  if (!DATE_RE.test(issue) || !DATE_RE.test(due)) return { ok: false, error: "Check the issue and due dates." };
  if (due < issue) return { ok: false, error: "The due date can't be before the issue date." };

  const currency = clip(input.currency, 3).toUpperCase();
  const totals = calcTotals(items, Number(input.tax_rate) || 0);
  const fields = {
    client_id: clientId,
    issue_date: issue,
    due_date: due,
    currency: /^[A-Z]{3}$/.test(currency) ? currency : "USD",
    items,
    ...totals,
    notes: clip(input.notes, 1000) || null,
    source: input.source === "ai" ? "ai" : "manual",
  };

  const id = typeof input.id === "string" ? input.id : null;
  if (id) {
    const { data: existing } = await supabase.from("invoices").select("status").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (!existing) return { ok: false, error: "Invoice not found." };
    if (existing.status !== "draft") return { ok: false, error: "Only draft invoices can be edited." };
    const { error } = await supabase.from("invoices").update(fields).eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: "Could not save invoice." };
    return { ok: true, id };
  }

  const { data: number, error: numErr } = await supabase.rpc("next_invoice_number", { p_user_id: user.id });
  if (numErr || !number) return { ok: false, error: "Could not create an invoice number." };
  const { data, error } = await supabase.from("invoices").insert({ ...fields, user_id: user.id, number }).select("id").single();
  if (error) return { ok: false, error: "Could not save invoice." };
  return { ok: true, id: data.id };
}

export async function deleteDraftInvoice(id: string): Promise<Result> {
  const { supabase, user } = await requireUser();
  const { error, count } = await supabase.from("invoices").delete({ count: "exact" }).eq("id", id).eq("user_id", user.id).eq("status", "draft");
  if (error || !count) return { ok: false, error: "Only drafts can be deleted. Void a sent invoice instead." };
  return { ok: true };
}

export async function markInvoicePaid(id: string): Promise<Result> {
  const { supabase, user } = await requireUser();
  const { error, count } = await supabase
    .from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", id).eq("user_id", user.id).eq("status", "sent");
  if (error || !count) return { ok: false, error: "Only sent invoices can be marked paid." };
  return { ok: true };
}

export async function voidInvoice(id: string): Promise<Result> {
  const { supabase, user } = await requireUser();
  const { error, count } = await supabase
    .from("invoices").update({ status: "void" }, { count: "exact" })
    .eq("id", id).eq("user_id", user.id).in("status", ["draft", "sent"]);
  if (error || !count) return { ok: false, error: "This invoice can't be voided." };
  return { ok: true };
}

// ---------- AI draft ----------

export async function draftInvoiceWithAI(description: string): Promise<Result<{ items: InvoiceItem[]; notes: string }>> {
  await requireUser();
  const text = String(description || "").trim().slice(0, 1500);
  if (text.length < 5) return { ok: false, error: "Describe the work you want to invoice." };
  if (!process.env.GEMINI_API_KEY) return { ok: false, error: "AI drafting isn't available right now." };
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: text,
      config: {
        responseMimeType: "application/json",
        systemInstruction:
          'Turn the user\'s description of work into invoice line items. Return only JSON: {"items":[{"description":string,"quantity":number,"unit_price":number}],"notes":string}. ' +
          "Use only quantities and prices the user states. Hours become the quantity with the hourly rate as unit_price. If a price is not stated, use 0. Never invent prices. Keep descriptions short and professional. notes is an optional short payment or thank-you note, or an empty string.",
      },
    });
    const parsed = JSON.parse((response.text || "").replace(/```json|```/g, "").trim());
    const items = cleanItems(parsed?.items);
    if (items.length === 0) return { ok: false, error: "I couldn't find line items in that. Try including what the work was and the price." };
    return { ok: true, items, notes: clip(parsed?.notes, 500) };
  } catch (err) {
    console.error("Invoice AI draft error:", err);
    return { ok: false, error: "AI drafting failed. You can still add the line items by hand." };
  }
}

// ---------- Send ----------

async function checkCredits(userId: string, cost: number): Promise<Result> {
  const [{ data: userRow }, { data: eff }] = await Promise.all([
    supabaseAdmin.from("users").select("billing_period_start, billing_period_end").eq("id", userId).maybeSingle(),
    supabaseAdmin.rpc("get_effective_limits", { p_user_id: userId }),
  ]);
  const row: any = Array.isArray(eff) ? eff[0] : eff;
  const limit = row?.limit_credits ?? 0;
  if (!limit) return { ok: true };
  const since = getBillingWindow({
    periodStart: (userRow as any)?.billing_period_start,
    periodEnd: (userRow as any)?.billing_period_end,
  }).usageStart.toISOString();
  const { data: usage } = await supabaseAdmin
    .from("usage").select("used_quantity").eq("user_id", userId).eq("feature_key", "credits").gte("created_at", since);
  const used = (usage || []).reduce((s: number, r: any) => s + (r.used_quantity || 0), 0);
  if (used + cost > limit) return { ok: false, error: `You've used all ${limit} automation credits for this billing period. Upgrade your plan to keep sending.` };
  return { ok: true };
}

export async function sendInvoice(invoiceId: string, provider?: string): Promise<Result<{ link: string }>> {
  const { supabase, user } = await requireUser();

  const compliance = await requireComplianceAcknowledged(user.id);
  if (!compliance.ok) return { ok: false, error: compliance.error };

  const { data: catalog } = await supabase.from("automation_catalog").select("id, credit_cost").eq("key", INVOICE_KEY).maybeSingle();
  if (!catalog) return { ok: false, error: "InvoiceAI isn't set up yet." };
  const { data: ua } = await supabase.from("user_automations").select("is_enabled").eq("user_id", user.id).eq("automation_id", catalog.id).maybeSingle();
  if (!ua?.is_enabled) return { ok: false, error: "Turn on InvoiceAI in Automations before sending invoices." };

  const { data: inv } = await supabase
    .from("invoices")
    .select("id, number, status, due_date, currency, total, public_token, sent_at, invoice_clients(name, email)")
    .eq("id", invoiceId).eq("user_id", user.id).maybeSingle();
  if (!inv) return { ok: false, error: "Invoice not found." };
  if (inv.status !== "draft" && inv.status !== "sent") return { ok: false, error: "Only draft or sent invoices can be sent." };
  const client: any = Array.isArray((inv as any).invoice_clients) ? (inv as any).invoice_clients[0] : (inv as any).invoice_clients;
  if (!client?.email || !EMAIL_RE.test(client.email)) return { ok: false, error: "This client has no email address. Add one in Clients first." };
  if (!(Number(inv.total) > 0)) return { ok: false, error: "The invoice total must be more than zero." };

  const firstSend = !inv.sent_at;
  if (firstSend) {
    const credits = await checkCredits(user.id, catalog.credit_cost ?? 0);
    if (!credits.ok) return credits;
  }

  const { data: conns } = await supabase.from("oauth_connections").select("provider, status").eq("user_id", user.id).in("provider", MAIL_PROVIDERS);
  const connected = MAIL_PROVIDERS.filter((p) => (conns || []).some((c: any) => c.provider === p && (!c.status || c.status === "active")));
  if (connected.length === 0) return { ok: false, error: "Connect your email (Google, Microsoft or Zoho) in Integrations first." };
  const useProvider = (provider && connected.includes(provider as MailProvider) ? provider : connected[0]) as MailProvider;

  const [{ data: settings }, { data: profile }] = await Promise.all([
    supabase.from("invoice_settings").select("business_name").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_profiles").select("organization_name, full_name").eq("user_id", user.id).maybeSingle(),
  ]);
  const sender = settings?.business_name || profile?.organization_name || profile?.full_name || "Your service provider";

  const h = await headers();
  const origin = process.env.APP_URL || `https://${h.get("host")}`;
  const link = `${origin}/invoice/${inv.public_token}`;

  // Claim the first send so a double click can't email the customer twice.
  if (firstSend) {
    const { data: claimed } = await supabase
      .from("invoices").update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", inv.id).eq("user_id", user.id).is("sent_at", null).select("id");
    if (!claimed || claimed.length === 0) return { ok: false, error: "This invoice was just sent." };
  }

  const firstName = String(client.name || "").trim().split(/\s+/)[0] || "there";
  const due = new Date(inv.due_date + "T00:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const body =
    `Hi ${firstName},\n\n` +
    `${sender} has sent you invoice ${inv.number} for ${money(Number(inv.total), inv.currency)}, due ${due}.\n\n` +
    `You can view and print it here:\n${link}\n\n` +
    `If you weren't expecting this invoice, you can ignore this email.`;

  const res = await callAuth("/auth/mail/send", {
    userId: user.id, provider: useProvider, to: client.email,
    subject: `Invoice ${inv.number} from ${sender}`, body,
  });

  if (res.status !== 200 || !res.json?.ok) {
    if (firstSend) {
      await supabase.from("invoices").update({ status: "draft", sent_at: null }).eq("id", inv.id).eq("user_id", user.id);
    }
    const code = res.json?.error;
    if (code === "no_connection_found") return { ok: false, error: "Your mailbox isn't connected. Connect it in Integrations." };
    if (code === "token_expired") return { ok: false, error: "Your mailbox connection expired. Reconnect it in Integrations." };
    if (res.status === 403) return { ok: false, error: "Your mailbox connection can't send email. Reconnect it in Integrations and allow sending." };
    return { ok: false, error: "The email couldn't be sent. Try again in a moment." };
  }

  // Bill once per invoice. The idempotency key makes resends free and retries safe.
  if (firstSend) {
    const { error: runErr } = await supabaseAdmin.from("automation_runs").insert({
      user_id: user.id,
      automation_id: catalog.id,
      automation_key: INVOICE_KEY,
      run_units: 1,
      status: "completed",
      input_data: { invoice_id: inv.id },
      output_data: { number: inv.number, provider: useProvider },
      completed_at: new Date().toISOString(),
      idempotency_key: `invoice_send:${inv.id}`,
    });
    if (runErr) console.error("Invoice billing insert failed:", runErr);
  }

  return { ok: true, link };
}

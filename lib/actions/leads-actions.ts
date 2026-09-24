"use server";

import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/actions/compliance-actions";

export type LeadSource = "inbound_call" | "leadreach" | "manual";

export type Lead = {
  id: string;
  source: LeadSource;
  name: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  status: string;
  consent_source: string | null;
  call_count: number;
  last_contact_at: string | null;
  created_at: string;
};

const LEAD_COLUMNS =
  "id, source, name, phone, email, company, status, consent_source, call_count, last_contact_at, created_at";

// Keeps digits and a leading "+" only. Deliberately does NOT guess a country
// code for numbers without one -- a wrong guess would silently mismatch the
// E.164 numbers inbound calls arrive with, but a missing guess only means a
// possible duplicate row, which is the safer failure.
function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const s = String(raw).trim();
  if (!s) return null;
  const cleaned = (s.startsWith("+") ? "+" : "") + s.replace(/\D/g, "");
  return cleaned.replace(/\D/g, "").length >= 6 ? cleaned : null;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

export async function getLeads(): Promise<{ leads: Lead[]; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { leads: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return { leads: [], error: error.message };
  return { leads: (data || []) as Lead[], error: null };
}

export async function addLead(input: {
  name: string;
  phone: string;
  company?: string;
  consentSource: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const name = input.name?.trim();
  const phone = normalizePhone(input.phone);
  const consentSource = input.consentSource?.trim();
  if (!name || !phone || !consentSource) {
    return { ok: false, error: "Name, a valid phone number, and consent source are required." };
  }

  const { error } = await supabase.from("leads").insert({
    user_id: user.id,
    source: "manual",
    name,
    phone,
    company: input.company?.trim() || null,
    consent_source: consentSource,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, error: "A lead with that phone number already exists." };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// Pushes LeadReach search results into the Leads table. LeadReach leads have
// NO call consent on file, so consent_source stays NULL -- the Leads page
// shows them as such and outbound contact must stay blocked until the user
// documents a consent source. The full original object is kept in `raw` so
// nothing the automation returned is lost even if field names differ from
// what is mapped here.
export async function pushLeadReachLeads(
  leads: unknown[]
): Promise<{ ok: boolean; inserted: number; skipped: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, inserted: 0, skipped: 0, error: "Not authenticated" };
  if (!Array.isArray(leads) || leads.length === 0) {
    return { ok: false, inserted: 0, skipped: 0, error: "No leads to push." };
  }

  const mapped = leads.slice(0, 200).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const l = item as Record<string, unknown>;
    const first = pickString(l, ["firstName", "first_name"]);
    const last = pickString(l, ["lastName", "last_name"]);
    const name =
      pickString(l, ["fullName", "full_name", "name"]) || [first, last].filter(Boolean).join(" ") || null;
    const phone = normalizePhone(
      pickString(l, ["phone", "phoneNumber", "phone_number", "mobilePhone", "mobile", "directPhone"])
    );
    const email = pickString(l, ["email", "emailAddress", "workEmail", "work_email"])?.toLowerCase() || null;
    const company = pickString(l, ["companyName", "company", "organization", "organizationName", "company_name"]);
    if (!name && !phone && !email) return [];
    return [{ user_id: user.id, source: "leadreach" as const, name, phone, email, company, raw: l }];
  });

  if (mapped.length === 0) {
    return { ok: false, inserted: 0, skipped: leads.length, error: "None of these results had a name, phone, or email." };
  }

  // Skip anyone already in this account's leads (same phone or same email),
  // and duplicates within this batch.
  const { data: existing } = await supabase
    .from("leads")
    .select("phone, email")
    .eq("user_id", user.id);
  const seenPhones = new Set((existing || []).map((r) => r.phone).filter(Boolean));
  const seenEmails = new Set((existing || []).map((r) => r.email?.toLowerCase()).filter(Boolean));

  const fresh = mapped.filter((l) => {
    if ((l.phone && seenPhones.has(l.phone)) || (l.email && seenEmails.has(l.email))) return false;
    if (l.phone) seenPhones.add(l.phone);
    if (l.email) seenEmails.add(l.email);
    return true;
  });

  const skipped = leads.length - fresh.length;
  if (fresh.length === 0) return { ok: true, inserted: 0, skipped };

  const { error } = await supabase.from("leads").insert(fresh);
  if (error) {
    // A concurrent insert can still trip the unique phone index; fall back to
    // row-by-row so one duplicate doesn't discard the rest of the batch.
    if (error.code === "23505") {
      let inserted = 0;
      for (const row of fresh) {
        const { error: rowErr } = await supabase.from("leads").insert(row);
        if (!rowErr) inserted++;
      }
      return { ok: true, inserted, skipped: leads.length - inserted };
    }
    return { ok: false, inserted: 0, skipped, error: error.message };
  }

  return { ok: true, inserted: fresh.length, skipped };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_IMPORT_ROWS = 1000;

// CSV import. The whole file shares ONE documented consent source (chosen by
// the user in the import dialog), matching the rule that a lead can't be saved
// without one. Existing leads (same phone or email) are skipped, never
// overwritten. Rows need at least a valid phone or email.
export async function importLeads(
  rows: { name: string; phone: string; email: string; company: string }[],
  consentSource: string
): Promise<{ ok: boolean; inserted: number; duplicates: number; invalid: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, inserted: 0, duplicates: 0, invalid: 0, error: "Not authenticated" };

  const consent = consentSource?.trim();
  if (!consent) return { ok: false, inserted: 0, duplicates: 0, invalid: 0, error: "Choose a consent source for this list." };
  if (!Array.isArray(rows) || rows.length === 0) return { ok: false, inserted: 0, duplicates: 0, invalid: 0, error: "No rows to import." };
  if (rows.length > MAX_IMPORT_ROWS) {
    return { ok: false, inserted: 0, duplicates: 0, invalid: 0, error: `Import up to ${MAX_IMPORT_ROWS} leads at a time.` };
  }

  const { data: existing } = await supabase.from("leads").select("phone, email").eq("user_id", user.id);
  const seenPhones = new Set((existing || []).map((r) => r.phone).filter(Boolean));
  const seenEmails = new Set((existing || []).map((r) => r.email?.toLowerCase()).filter(Boolean));

  let invalid = 0;
  let duplicates = 0;
  const fresh: Record<string, unknown>[] = [];

  for (const r of rows) {
    const phone = normalizePhone(r.phone);
    const email = r.email?.trim().toLowerCase() || null;
    const validEmail = email && EMAIL_RE.test(email) ? email : null;
    if (!phone && !validEmail) {
      invalid++;
      continue;
    }
    if ((phone && seenPhones.has(phone)) || (validEmail && seenEmails.has(validEmail))) {
      duplicates++;
      continue;
    }
    if (phone) seenPhones.add(phone);
    if (validEmail) seenEmails.add(validEmail);
    fresh.push({
      user_id: user.id,
      source: "manual",
      name: r.name?.trim() || null,
      phone,
      email: validEmail,
      company: r.company?.trim() || null,
      consent_source: consent,
    });
  }

  let inserted = 0;
  for (let i = 0; i < fresh.length; i += 200) {
    const chunk = fresh.slice(i, i + 200);
    const { error } = await supabase.from("leads").insert(chunk);
    if (!error) {
      inserted += chunk.length;
      continue;
    }
    if (error.code !== "23505") return { ok: false, inserted, duplicates, invalid, error: error.message };
    // A concurrent duplicate tripped the phone index: retry row by row.
    for (const row of chunk) {
      const { error: rowErr } = await supabase.from("leads").insert(row);
      if (!rowErr) inserted++;
      else duplicates++;
    }
  }

  try {
    await logAuditEvent("Leads Imported", `${inserted} leads imported from CSV. Consent source: ${consent}.`);
  } catch {
    // Audit logging must never fail an import that already succeeded.
  }
  return { ok: true, inserted, duplicates, invalid };
}

export type TimelineItem =
  | { kind: "call"; at: string; callId: string; durationSecs: number; snippet: string }
  | { kind: "email"; at: string; subject: string; status: string; step: number };

// Everything that has happened with one lead: their calls (matched by phone
// number) and every email sent or scheduled to them, newest first.
export async function getLeadTimeline(leadId: string): Promise<{ items: TimelineItem[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { items: [], error: "Not authenticated" };

  const { data: lead } = await supabase.from("leads").select("phone, email").eq("id", leadId).eq("user_id", user.id).maybeSingle();
  if (!lead) return { items: [], error: "Lead not found" };

  const items: TimelineItem[] = [];

  if (lead.phone) {
    const { data: calls } = await supabase
      .from("call_transcripts")
      .select("call_id, created_at, duration_secs, messages")
      .eq("user_id", user.id)
      .eq("caller_number", lead.phone)
      .order("created_at", { ascending: false })
      .limit(20);
    for (const c of calls || []) {
      const msgs = Array.isArray(c.messages) ? (c.messages as { role?: string; content?: string }[]) : [];
      const firstCaller = msgs.find((m) => m.role === "user" && m.content?.trim());
      items.push({
        kind: "call",
        at: c.created_at,
        callId: c.call_id,
        durationSecs: c.duration_secs || 0,
        snippet: firstCaller?.content?.trim().slice(0, 140) || "",
      });
    }
  }

  const { data: emails } = await supabase
    .from("emails")
    .select("subject, status, step, sent_at, created_at")
    .eq("user_id", user.id)
    .eq("lead_id", leadId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(30);
  for (const e of emails || []) {
    items.push({ kind: "email", at: e.sent_at || e.created_at, subject: e.subject, status: e.status, step: e.step });
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return { items };
}

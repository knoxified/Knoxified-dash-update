"use server";

import { createClient } from "@/lib/supabase/server";

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

"use server";

import { createClient } from "@/lib/supabase/server";
import { callAuth } from "@/lib/auth-service";
import { buildRescheduleMessage, cleanReason, firstNameOf, formatAppointmentTime, safeTimeZone } from "@/lib/appointment-message";

// Reschedule a booked lead's appointment by up to 24 hours either way: the Google
// Calendar event is moved and ONE email goes to that lead from the owner's own
// Gmail. The booked time comes from the reminders table (written when the
// appointment is booked), matched to the lead by email or phone.

const DAY_MS = 24 * 60 * 60 * 1000;

export interface LeadAppointment {
  appointmentId: string;
  start: string;
  end: string | null;
  type: string | null;
  provider: string;
  timeZone: string;
}

export interface LeadAppointmentInfo {
  appointment: LeadAppointment | null;
  firstName: string;
  reasonForBooking: string | null;
  businessName: string | null;
  hasEmail: boolean;
}

async function loadContext(leadId: string, viewerTz?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." as const };

  const { data: lead } = await supabase
    .from("leads")
    .select("id, name, email, phone, reason")
    .eq("id", leadId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!lead) return { error: "Lead not found." as const };

  let q = supabase
    .from("reminders")
    .select("id, appointment_id, appointment_start, appointment_end, appointment_type, timezone, calendar_provider, confirmation_status")
    .eq("user_id", user.id)
    .neq("confirmation_status", "cancelled")
    .order("appointment_start", { ascending: false })
    .limit(10);
  const email = (lead.email || "").trim();
  const phone = (lead.phone || "").trim();
  if (email) q = q.ilike("client_email", email.replace(/[%_\\]/g, (m: string) => "\\" + m));
  else if (phone) q = q.eq("client_phone", phone);
  const { data: rows } = email || phone ? await q : { data: [] as any[] };

  // The next upcoming booking if there is one, otherwise the most recent.
  const now = Date.now();
  const list = (rows || []) as any[];
  const upcoming = list.filter((r) => Date.parse(r.appointment_start) >= now).sort((a, b) => Date.parse(a.appointment_start) - Date.parse(b.appointment_start))[0];
  let row: any = upcoming || list[0] || null;

  // No saved booking record? Look the booking up on the owner's Google Calendar by
  // the lead's email instead, so this works however the booking was made.
  if (!row && email) {
    const found = await callAuth("/auth/google/calendar/find-events", { userId: user.id, email });
    const events: any[] = found.status === 200 && Array.isArray(found.json?.events) ? found.json.events : [];
    const next = events.filter((e) => Date.parse(e.start) >= now).sort((a, b) => Date.parse(a.start) - Date.parse(b.start))[0];
    const ev = next || events.sort((a, b) => Date.parse(b.start) - Date.parse(a.start))[0];
    if (ev) {
      row = {
        id: null,
        appointment_id: ev.id,
        appointment_start: ev.start,
        appointment_end: ev.end,
        appointment_type: null,
        timezone: ev.timeZone || null,
        calendar_provider: "google",
      };
    }
  }

  const [{ data: cfg }, { data: prof }] = await Promise.all([
    supabase.from("agent_configs").select("organization_name, timezone").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_profiles").select("organization_name").eq("user_id", user.id).maybeSingle(),
  ]);
  const businessName = prof?.organization_name || cfg?.organization_name || null;
  const timeZone = safeTimeZone(row?.timezone || cfg?.timezone || viewerTz);

  return { supabase, user, lead, row, businessName, timeZone };
}

export async function getLeadAppointment(leadId: string, viewerTz?: string): Promise<LeadAppointmentInfo | { error: string }> {
  const ctx = await loadContext(leadId, viewerTz);
  if ("error" in ctx) return { error: ctx.error as string };
  const { lead, row, businessName, timeZone } = ctx;
  return {
    appointment: row
      ? {
          appointmentId: row.appointment_id,
          start: row.appointment_start,
          end: row.appointment_end || null,
          type: row.appointment_type || null,
          provider: row.calendar_provider || "google",
          timeZone,
        }
      : null,
    firstName: firstNameOf(lead.name),
    reasonForBooking: lead.reason || row?.appointment_type || null,
    businessName,
    hasEmail: !!(lead.email || "").trim(),
  };
}

const CALENDAR_ERRORS: Record<string, string> = {
  event_not_found: "That appointment isn't on your Google Calendar any more, so nothing was changed and no email was sent.",
  event_not_timed: "That calendar event is an all-day event, so it can't be moved here. Nothing was changed.",
  no_connection_found: "Google isn't connected. Connect it under Integrations first.",
  token_expired: "Your Google connection expired. Reconnect it under Integrations, then try again.",
  not_configured: "Rescheduling isn't switched on for this server yet.",
  unauthorized: "Rescheduling isn't switched on for this server yet.",
};

export async function rescheduleAppointment(input: {
  leadId: string;
  newStart: string;
  reason?: string;
  viewerTz?: string;
}): Promise<{ ok: true; emailSent: boolean; newStart: string; warning?: string } | { ok: false; error: string }> {
  const ctx = await loadContext(input.leadId, input.viewerTz);
  if ("error" in ctx) return { ok: false, error: ctx.error as string };
  const { supabase, user, lead, row, businessName, timeZone } = ctx;

  if (!row) return { ok: false, error: "No booked appointment found for this lead." };
  if ((row.calendar_provider || "google") !== "google") {
    return { ok: false, error: "Rescheduling is only available for Google Calendar bookings right now." };
  }
  const to = (lead.email || "").trim();
  if (!to) return { ok: false, error: "This lead has no email address, so we can't tell them about the change." };

  const oldStartMs = Date.parse(row.appointment_start);
  const newStartMs = Date.parse(input.newStart);
  if (!Number.isFinite(newStartMs)) return { ok: false, error: "Pick a valid new time." };
  if (Math.abs(newStartMs - oldStartMs) > DAY_MS + 60_000) return { ok: false, error: "The new time must be within 24 hours of the booked time." };
  if (Math.abs(newStartMs - oldStartMs) < 60_000) return { ok: false, error: "That is the same time as the current booking." };
  if (newStartMs <= Date.now()) return { ok: false, error: "The new time must be in the future." };

  const newStartIso = new Date(newStartMs).toISOString();

  // 1) Move the calendar event first. If this fails nothing else happens.
  const moved = await callAuth("/auth/google/calendar/move-event", {
    userId: user.id,
    eventId: row.appointment_id,
    newStart: newStartIso,
    timeZone,
  });
  if (moved.status !== 200) {
    return { ok: false, error: CALENDAR_ERRORS[moved.json?.error] || "Couldn't move the calendar event. Nothing was changed." };
  }
  const newEndIso: string | null = moved.json?.end || null;

  // 2) Keep our own record in step with the calendar (and let reminders fire again for the new time).
  const upd = !row.id ? { error: null } : await supabase
    .from("reminders")
    .update({
      appointment_start: newStartIso,
      appointment_end: newEndIso,
      reminder_24h_sent_at: null,
      reminder_1h_sent_at: null,
      confirmation_status: "pending",
    })
    .eq("id", row.id)
    .eq("user_id", user.id);
  if (upd.error) console.error("[reschedule] reminders update failed:", upd.error.message);

  // 3) One email to the lead, from the owner's Gmail.
  const { subject, body } = buildRescheduleMessage({
    firstName: firstNameOf(lead.name),
    reasonForBooking: lead.reason || row.appointment_type,
    when: formatAppointmentTime(newStartIso, timeZone),
    ownerReason: input.reason,
    businessName,
  });
  const sent = await callAuth("/auth/google/mail/send", { userId: user.id, to, subject, body });
  const emailSent = sent.status === 200;

  await supabase.from("emails").insert({
    user_id: user.id,
    lead_id: lead.id,
    to_email: to,
    to_name: lead.name || null,
    subject,
    body,
    status: emailSent ? "sent" : "failed",
    source: "manual",
    provider_message_id: emailSent ? sent.json?.id || null : null,
    sent_at: emailSent ? new Date().toISOString() : null,
    error: emailSent ? null : String(sent.json?.error || sent.status),
  });
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "appointment_rescheduled",
    entity_type: "lead",
    entity_id: lead.id,
    metadata: { from: row.appointment_start, to: newStartIso, reason: cleanReason(input.reason), email_sent: emailSent },
  });

  if (!emailSent) {
    return {
      ok: true,
      emailSent: false,
      newStart: newStartIso,
      warning: "The appointment was moved on your calendar, but the email to the lead could not be sent. Please let them know yourself.",
    };
  }
  return { ok: true, emailSent: true, newStart: newStartIso };
}

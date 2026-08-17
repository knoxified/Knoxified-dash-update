"use server";

import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ---------- Suppression List ----------

export async function getSuppressionList() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("suppression_list")
    .select("*")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (error) throw new Error(`Failed to load suppression list: ${error.message}`);
  return data;
}

export async function checkSuppressionList(phoneNumber: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("suppression_list")
    .select("id")
    .eq("user_id", user.id)
    .eq("phone_number", phoneNumber)
    .maybeSingle();

  if (error) throw new Error(`Suppression check failed: ${error.message}`);
  return data !== null;
}

export async function addToSuppressionList(
  phoneNumber: string,
  reason: string = "manual_upload",
  addedBy: string = "user"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("suppression_list")
    .insert({ user_id: user.id, phone_number: phoneNumber, reason, added_by: addedBy })
    .select()
    .single();

  if (error) throw new Error(`Failed to add suppression entry: ${error.message}`);

  await logAuditEvent("Manual Suppression Added", `Added ${phoneNumber} to the suppression list.`);
  revalidatePath("/compliance");
  return data;
}

export async function removeFromSuppressionList(entryId: string, phoneNumber: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("suppression_list")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error) throw new Error(`Failed to remove suppression entry: ${error.message}`);

  await logAuditEvent("Suppression Removed", `Removed ${phoneNumber} from the suppression list.`);
  revalidatePath("/compliance");
}

// ---------- Audit Logs (append-only — no update/delete function exists on purpose) ----------

export async function getAuditLogs(limit: number = 50) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load audit logs: ${error.message}`);
  return data;
}

export async function logAuditEvent(action: string, metadata: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("audit_logs")
    .insert({ user_id: user.id, action, metadata: { details: metadata } });

  if (error) throw new Error(`Failed to write audit log: ${error.message}`);
}

// ---------- Disclosure Settings ----------

export async function getDisclosureSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("agent_configs")
    .select("require_ai_disclosure, require_recording_disclosure, calling_window_start, calling_window_end, calling_window_timezone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load disclosure settings: ${error.message}`);

  // No agent_configs row yet (e.g. brand-new user who hasn't saved settings) — fall back
  // to the same defaults the database column defaults use.
  return data || {
    require_ai_disclosure: true,
    require_recording_disclosure: true,
    calling_window_start: "08:00:00",
    calling_window_end: "21:00:00",
    calling_window_timezone: "recipient_local",
  };
}

export async function toggleRecordingDisclosure(enabled: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("agent_configs")
    .update({ require_recording_disclosure: enabled })
    .eq("user_id", user.id);

  if (error) throw new Error(`Failed to update recording disclosure: ${error.message}`);

  await logAuditEvent(
    "Recording Disclosure Toggled",
    `Changed 'Call Recording Disclosure' to ${enabled ? "Enabled" : "Disabled"}.`
  );
  revalidatePath("/compliance");
}

// ---------- Calling Window ----------

export async function isWithinCallingWindow(checkTime: Date = new Date()): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("agent_configs")
    .select("calling_window_start, calling_window_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load calling window: ${error.message}`);

  // No agent_configs row yet — fall back to the same defaults the database column defaults use.
  const windowStart = data?.calling_window_start || "08:00:00";
  const windowEnd = data?.calling_window_end || "21:00:00";

  const currentTime = checkTime.toTimeString().slice(0, 8);
  return currentTime >= windowStart && currentTime <= windowEnd;
}

// ---------- Compliance Acknowledgment ----------

export async function submitComplianceAcknowledgment(agreedVersion: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_profiles")
    .update({
      compliance_acknowledged_at: new Date().toISOString(),
      compliance_agreed_version: agreedVersion,
    })
    .eq("user_id", user.id);

  if (error) throw new Error(`Failed to record acknowledgment: ${error.message}`);

  await logAuditEvent("Compliance Acknowledgment Signed", `User accepted policy version ${agreedVersion}.`);
  revalidatePath("/settings");
}

// ---------- Account Suspension ----------

export async function setOutboundSuspension(suspended: boolean, reason?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Admin action, leaving supabaseAdmin if needed, or if regular user can't do this
  // In real life, only admins can suspend, but I'll use the user.id for the target
  const { error } = await supabaseAdmin
    .from("users")
    .update({ outbound_calling_suspended: suspended, suspension_reason: reason ?? null })
    .eq("id", user.id);

  if (error) throw new Error(`Failed to update suspension status: ${error.message}`);

  await logAuditEvent(
    suspended ? "Outbound Calling Suspended" : "Outbound Calling Restored",
    reason ?? "No reason provided."
  );
  revalidatePath("/admin");
}

// ---------- Lead Consent Source ----------

export async function addLeadWithConsentSource(
  consentSource: string,
  automationId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!consentSource) {
    throw new Error("A consent source is required before a lead can be saved.");
  }

  const { data, error } = await supabase
    .from("user_automations")
    .update({ consent_source: consentSource })
    .eq("user_id", user.id)
    .eq("automation_id", automationId)
    .select()
    .single();

  if (error) throw new Error(`Failed to save consent source: ${error.message}`);
  revalidatePath("/leads");
  return data;
}


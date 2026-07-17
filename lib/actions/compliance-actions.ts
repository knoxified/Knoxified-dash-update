"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ---------- Suppression List ----------

export async function getSuppressionList(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("suppression_list")
    .select("*")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });

  if (error) throw new Error(`Failed to load suppression list: ${error.message}`);
  return data;
}

export async function checkSuppressionList(userId: string, phoneNumber: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("suppression_list")
    .select("id")
    .eq("user_id", userId)
    .eq("phone_number", phoneNumber)
    .maybeSingle();

  if (error) throw new Error(`Suppression check failed: ${error.message}`);
  return data !== null;
}

export async function addToSuppressionList(
  userId: string,
  phoneNumber: string,
  reason: string = "manual_upload",
  addedBy: string = "user"
) {
  const { data, error } = await supabaseAdmin
    .from("suppression_list")
    .insert({ user_id: userId, phone_number: phoneNumber, reason, added_by: addedBy })
    .select()
    .single();

  if (error) throw new Error(`Failed to add suppression entry: ${error.message}`);

  await logAuditEvent(userId, "Manual Suppression Added", `Added ${phoneNumber} to the suppression list.`);
  revalidatePath("/compliance");
  return data;
}

export async function removeFromSuppressionList(userId: string, entryId: string, phoneNumber: string) {
  const { error } = await supabaseAdmin
    .from("suppression_list")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to remove suppression entry: ${error.message}`);

  await logAuditEvent(userId, "Suppression Removed", `Removed ${phoneNumber} from the suppression list.`);
  revalidatePath("/compliance");
}

// ---------- Audit Logs (append-only — no update/delete function exists on purpose) ----------

export async function getAuditLogs(userId: string, limit: number = 50) {
  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load audit logs: ${error.message}`);
  return data;
}

export async function logAuditEvent(userId: string, action: string, metadata: string) {
  const { error } = await supabaseAdmin
    .from("audit_logs")
    .insert({ user_id: userId, action, metadata: { details: metadata } });

  if (error) throw new Error(`Failed to write audit log: ${error.message}`);
}

// ---------- Disclosure Settings ----------

export async function getDisclosureSettings(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("agent_configs")
    .select("require_ai_disclosure, require_recording_disclosure, calling_window_start, calling_window_end, calling_window_timezone")
    .eq("user_id", userId)
    .single();

  if (error) throw new Error(`Failed to load disclosure settings: ${error.message}`);
  return data;
}

export async function toggleRecordingDisclosure(userId: string, enabled: boolean) {
  const { error } = await supabaseAdmin
    .from("agent_configs")
    .update({ require_recording_disclosure: enabled })
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to update recording disclosure: ${error.message}`);

  await logAuditEvent(
    userId,
    "Recording Disclosure Toggled",
    `Changed 'Call Recording Disclosure' to ${enabled ? "Enabled" : "Disabled"}.`
  );
  revalidatePath("/compliance");
}

// ---------- Calling Window ----------

export async function isWithinCallingWindow(userId: string, checkTime: Date = new Date()): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("agent_configs")
    .select("calling_window_start, calling_window_end")
    .eq("user_id", userId)
    .single();

  if (error) throw new Error(`Failed to load calling window: ${error.message}`);

  const currentTime = checkTime.toTimeString().slice(0, 8);
  return currentTime >= data.calling_window_start && currentTime <= data.calling_window_end;
}

// ---------- Compliance Acknowledgment ----------

export async function submitComplianceAcknowledgment(userId: string, agreedVersion: string) {
  const { error } = await supabaseAdmin
    .from("user_profiles")
    .update({
      compliance_acknowledged_at: new Date().toISOString(),
      compliance_agreed_version: agreedVersion,
    })
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to record acknowledgment: ${error.message}`);

  await logAuditEvent(userId, "Compliance Acknowledgment Signed", `User accepted policy version ${agreedVersion}.`);
  revalidatePath("/settings");
}

// ---------- Account Suspension ----------

export async function setOutboundSuspension(userId: string, suspended: boolean, reason?: string) {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ outbound_calling_suspended: suspended, suspension_reason: reason ?? null })
    .eq("id", userId);

  if (error) throw new Error(`Failed to update suspension status: ${error.message}`);

  await logAuditEvent(
    userId,
    suspended ? "Outbound Calling Suspended" : "Outbound Calling Restored",
    reason ?? "No reason provided."
  );
  revalidatePath("/admin");
}

// ---------- Lead Consent Source ----------

export async function addLeadWithConsentSource(
  userId: string,
  consentSource: string,
  automationId: string
) {
  if (!consentSource) {
    throw new Error("A consent source is required before a lead can be saved.");
  }

  const { data, error } = await supabaseAdmin
    .from("user_automations")
    .update({ consent_source: consentSource })
    .eq("user_id", userId)
    .eq("automation_id", automationId)
    .select()
    .single();

  if (error) throw new Error(`Failed to save consent source: ${error.message}`);
  revalidatePath("/leads");
  return data;
}

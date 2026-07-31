"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "./compliance-actions";

export async function getAutomationSchedules() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  
  const { data, error } = await supabase
    .from("automation_schedules")
    .select("*")
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: true });

  if (error) throw new Error(`Failed to load automation schedules: ${error.message}`);
  return data;
}

export async function getCallSchedules() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("call_schedules")
    .select("*")
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: true });

  if (error) throw new Error(`Failed to load call schedules: ${error.message}`);
  return data;
}

export async function createAutomationSchedule(
  automationId: string,
  scheduledAt: string,
  recurrence?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("automation_schedules")
    .insert({
      user_id: user.id,
      automation_id: automationId,
      scheduled_at: scheduledAt,
      recurrence: recurrence || null,
      requires_approval: false, // Human creating it IS the approval
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create automation schedule: ${error.message}`);
  
  await logAuditEvent("Automation Schedule Created", `Created schedule for automation ${automationId} at ${scheduledAt}.`);
  revalidatePath("/automations");
  
  return data;
}

export async function createCallSchedule(
  phoneNumber: string,
  scheduledAt: string,
  recurrence?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("call_schedules")
    .insert({
      user_id: user.id,
      phone_number: phoneNumber,
      scheduled_at: scheduledAt,
      recurrence: recurrence || null,
      requires_approval: false, // Human creating it IS the approval
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create call schedule: ${error.message}`);
  
  await logAuditEvent("Call Schedule Created", `Created call schedule for ${phoneNumber} at ${scheduledAt}.`);
  revalidatePath("/campaigns");
  
  return data;
}

export async function cancelAutomationSchedule(scheduleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("automation_schedules")
    .update({ status: 'canceled' })
    .eq("id", scheduleId)
    .eq("user_id", user.id);

  if (error) throw new Error(`Failed to cancel automation schedule: ${error.message}`);
  
  await logAuditEvent("Automation Schedule Canceled", `Canceled automation schedule ${scheduleId}.`);
  revalidatePath("/automations");
}

export async function cancelCallSchedule(scheduleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("call_schedules")
    .update({ status: 'canceled' })
    .eq("id", scheduleId)
    .eq("user_id", user.id);

  if (error) throw new Error(`Failed to cancel call schedule: ${error.message}`);
  
  await logAuditEvent("Call Schedule Canceled", `Canceled call schedule ${scheduleId}.`);
  revalidatePath("/campaigns");
}

export async function approveAutomationSchedule(scheduleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("automation_schedules")
    .update({ 
      approved_at: new Date().toISOString(),
      approved_by: user.id
    })
    .eq("id", scheduleId)
    .eq("user_id", user.id)
    .eq("requires_approval", true)
    .is("approved_at", null);

  if (error) throw new Error(`Failed to approve automation schedule: ${error.message}`);
  
  await logAuditEvent("Automation Schedule Approved", `Approved automation schedule ${scheduleId}.`);
  revalidatePath("/automations");
}

export async function approveCallSchedule(scheduleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("call_schedules")
    .update({ 
      approved_at: new Date().toISOString(),
      approved_by: user.id
    })
    .eq("id", scheduleId)
    .eq("user_id", user.id)
    .eq("requires_approval", true)
    .is("approved_at", null);

  if (error) throw new Error(`Failed to approve call schedule: ${error.message}`);
  
  await logAuditEvent("Call Schedule Approved", `Approved call schedule ${scheduleId}.`);
  revalidatePath("/campaigns");
}


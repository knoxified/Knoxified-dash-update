"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "./compliance-actions";

export async function getAutomationSchedules(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("automation_schedules")
    .select("*")
    .eq("user_id", userId)
    .order("scheduled_at", { ascending: true });

  if (error) throw new Error(`Failed to load automation schedules: ${error.message}`);
  return data;
}

export async function getCallSchedules(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("call_schedules")
    .select("*")
    .eq("user_id", userId)
    .order("scheduled_at", { ascending: true });

  if (error) throw new Error(`Failed to load call schedules: ${error.message}`);
  return data;
}

export async function createAutomationSchedule(
  userId: string,
  automationId: string,
  scheduledAt: string,
  recurrence?: string
) {
  const { data, error } = await supabaseAdmin
    .from("automation_schedules")
    .insert({
      user_id: userId,
      automation_id: automationId,
      scheduled_at: scheduledAt,
      recurrence: recurrence || null,
      requires_approval: false, // Human creating it IS the approval
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create automation schedule: ${error.message}`);
  
  await logAuditEvent(userId, "Automation Schedule Created", `Created schedule for automation ${automationId} at ${scheduledAt}.`);
  revalidatePath("/automations");
  
  return data;
}

export async function createCallSchedule(
  userId: string,
  phoneNumber: string,
  scheduledAt: string,
  recurrence?: string
) {
  const { data, error } = await supabaseAdmin
    .from("call_schedules")
    .insert({
      user_id: userId,
      phone_number: phoneNumber,
      scheduled_at: scheduledAt,
      recurrence: recurrence || null,
      requires_approval: false, // Human creating it IS the approval
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create call schedule: ${error.message}`);
  
  await logAuditEvent(userId, "Call Schedule Created", `Created call schedule for ${phoneNumber} at ${scheduledAt}.`);
  revalidatePath("/campaigns");
  
  return data;
}

export async function cancelAutomationSchedule(userId: string, scheduleId: string) {
  const { error } = await supabaseAdmin
    .from("automation_schedules")
    .update({ status: 'canceled' })
    .eq("id", scheduleId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to cancel automation schedule: ${error.message}`);
  
  await logAuditEvent(userId, "Automation Schedule Canceled", `Canceled automation schedule ${scheduleId}.`);
  revalidatePath("/automations");
}

export async function cancelCallSchedule(userId: string, scheduleId: string) {
  const { error } = await supabaseAdmin
    .from("call_schedules")
    .update({ status: 'canceled' })
    .eq("id", scheduleId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to cancel call schedule: ${error.message}`);
  
  await logAuditEvent(userId, "Call Schedule Canceled", `Canceled call schedule ${scheduleId}.`);
  revalidatePath("/campaigns");
}

export async function approveAutomationSchedule(userId: string, scheduleId: string) {
  const { error } = await supabaseAdmin
    .from("automation_schedules")
    .update({ 
      approved_at: new Date().toISOString(),
      approved_by: userId
    })
    .eq("id", scheduleId)
    .eq("user_id", userId)
    .eq("requires_approval", true)
    .is("approved_at", null);

  if (error) throw new Error(`Failed to approve automation schedule: ${error.message}`);
  
  await logAuditEvent(userId, "Automation Schedule Approved", `Approved automation schedule ${scheduleId}.`);
  revalidatePath("/automations");
}

export async function approveCallSchedule(userId: string, scheduleId: string) {
  const { error } = await supabaseAdmin
    .from("call_schedules")
    .update({ 
      approved_at: new Date().toISOString(),
      approved_by: userId
    })
    .eq("id", scheduleId)
    .eq("user_id", userId)
    .eq("requires_approval", true)
    .is("approved_at", null);

  if (error) throw new Error(`Failed to approve call schedule: ${error.message}`);
  
  await logAuditEvent(userId, "Call Schedule Approved", `Approved call schedule ${scheduleId}.`);
  revalidatePath("/campaigns");
}

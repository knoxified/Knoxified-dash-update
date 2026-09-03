"use server";

import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Very loose E.164-ish check -- good enough to catch obvious typos without
// rejecting legitimate international numbers.
function isPlausiblePhoneNumber(v: string): boolean {
  return /^\+?[1-9]\d{7,14}$/.test(v.replace(/[\s().-]/g, ""));
}

function normalizePhoneNumber(v: string): string {
  const digits = v.replace(/[\s().-]/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export async function listMyForwardingNumbers() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Uses supabaseAdmin (service role) rather than the RLS-scoped client:
  // phone_number_mappings' RLS policy was written for the existing
  // read-only /integrations lookup and hasn't been verified to allow
  // inserts/deletes from a logged-in user yet. Every query below is
  // explicitly scoped to user.id regardless.
  const { data, error } = await supabaseAdmin
    .from("phone_number_mappings")
    .select("id, phone_number, is_active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { numbers: data || [] };
}

export async function addForwardingNumber(rawNumber: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!isPlausiblePhoneNumber(rawNumber)) {
    return { error: "That doesn't look like a valid phone number. Include your country code, e.g. +1 555 123 4567." };
  }
  const phone_number = normalizePhoneNumber(rawNumber);

  const { error } = await supabaseAdmin.from("phone_number_mappings").insert({
    user_id: user.id,
    phone_number,
    is_active: true,
  });

  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      return { error: "That number is already registered (to you or another account)." };
    }
    return { error: error.message };
  }

  revalidatePath("/agent-config");
  return { success: true };
}

export async function removeForwardingNumber(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabaseAdmin
    .from("phone_number_mappings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // belt-and-braces even though we use the admin client

  if (error) return { error: error.message };

  revalidatePath("/agent-config");
  return { success: true };
}

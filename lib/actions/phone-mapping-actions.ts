"use server";

import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isPaidUser } from "@/lib/plan-access";

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
    .select("id, phone_number, is_active, created_at, source, verified_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { numbers: data || [] };
}

// Retired: customers now get a dedicated Knoxified number (see number-provisioning-actions).
// Kept so any stale client call fails with a clear message instead of a 404.
export async function addForwardingNumber(_rawNumber: string): Promise<{ success?: true; error?: string }> {
  return { error: "Adding your own number is retired. Get a Knoxified number in Agent Config instead." };
}

export async function removeForwardingNumber(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!(await isPaidUser(user.id))) return { error: "Managing numbers is available on paid plans." };

  const { error } = await supabaseAdmin
    .from("phone_number_mappings")
    .delete()
    .eq("id", id)
    .eq("source", "customer_forwarded") // purchased numbers are released by us, not deleted here
    .eq("user_id", user.id); // belt-and-braces even though we use the admin client

  if (error) return { error: error.message };

  revalidatePath("/agent-config");
  return { success: true };
}

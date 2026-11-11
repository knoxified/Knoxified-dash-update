"use server";

import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isPaidUser } from "@/lib/plan-access";
import { getProvider, type AvailableNumber } from "@/lib/telephony";
import { executePurchase, alertOwner } from "@/lib/number-purchase";

// Global safety valve: a bug or abuse can never buy more than this per day.
const DAILY_PURCHASE_CAP = 25;
const PREPARING_MESSAGE = "Your number is being prepared. We'll have it ready shortly. Check back soon.";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getNumberProvisioningState() {
  const user = await requireUser();
  if (!user) return { error: "Not authenticated" as const };

  const [paid, countries, provisioned, lastPurchase] = await Promise.all([
    isPaidUser(user.id),
    supabaseAdmin.from("countries").select("country_code, name, dial_code, number_mode").eq("is_enabled", true).order("name"),
    supabaseAdmin.from("phone_number_mappings").select("id, phone_number, country_code, created_at")
      .eq("user_id", user.id).eq("source", "provisioned").is("released_at", null).maybeSingle(),
    supabaseAdmin.from("number_purchases").select("status, country_code, phone_number, created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return {
    isPaid: paid,
    countries: countries.data || [],
    provisioned: provisioned.data || null,
    preparing: lastPurchase.data?.status === "paused_low_balance" && !provisioned.data,
  };
}

async function loadDedicatedCountry(countryCode: string) {
  const { data } = await supabaseAdmin
    .from("countries")
    .select("country_code, provider, number_mode, is_enabled")
    .eq("country_code", countryCode)
    .maybeSingle();
  if (!data || !data.is_enabled || data.number_mode !== "dedicated" || !getProvider(data.provider)) return null;
  return data;
}

export async function searchAvailableNumbers(countryCode: string, areaCode?: string): Promise<{ numbers?: AvailableNumber[]; error?: string }> {
  const user = await requireUser();
  if (!user) return { error: "Not authenticated" };
  if (!(await isPaidUser(user.id))) return { error: "Getting a number is available on paid plans." };
  const country = await loadDedicatedCountry(countryCode);
  if (!country) return { error: "Numbers aren't available for that country yet." };

  try {
    const numbers = await getProvider(country.provider)!.search(countryCode, areaCode?.trim() || undefined);
    if (numbers.length === 0) return { error: "No numbers found for that search. Try another area code." };
    return { numbers };
  } catch (err) {
    console.error("[numbers] search failed:", (err as Error).message);
    return { error: "Couldn't search numbers right now. Please try again shortly." };
  }
}

export async function claimNumber(countryCode: string, phoneNumber: string): Promise<{ success?: true; number?: string; preparing?: true; message?: string; error?: string }> {
  const user = await requireUser();
  if (!user) return { error: "Not authenticated" };
  if (!(await isPaidUser(user.id))) return { error: "Getting a number is available on paid plans." };
  if (!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) return { error: "Invalid number." };

  const country = await loadDedicatedCountry(countryCode);
  if (!country) return { error: "Numbers aren't available for that country yet." };

  // One number per account.
  const { data: existing } = await supabaseAdmin.from("phone_number_mappings").select("id")
    .eq("user_id", user.id).eq("source", "provisioned").is("released_at", null).maybeSingle();
  if (existing) return { error: "You already have a Knoxified number." };

  // Double-click / parallel-request guard: one pending purchase per user.
  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data: pending } = await supabaseAdmin.from("number_purchases").select("id")
    .eq("user_id", user.id).eq("status", "pending").gte("created_at", twoMinAgo).limit(1);
  if (pending && pending.length > 0) return { error: "Your number is already being set up." };

  // Global daily cap.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin.from("number_purchases").select("id", { count: "exact", head: true })
    .in("status", ["pending", "succeeded"]).gte("created_at", dayAgo);
  if ((count ?? 0) >= DAILY_PURCHASE_CAP) {
    await alertOwner("number_purchase_daily_cap_hit", user.id, { country: countryCode });
    return { preparing: true, message: PREPARING_MESSAGE };
  }

  const { data: purchase, error: logErr } = await supabaseAdmin.from("number_purchases").insert({
    user_id: user.id,
    country_code: countryCode,
    provider: country.provider,
    phone_number: phoneNumber,
    status: "pending",
    idempotency_key: crypto.randomUUID(),
  }).select("id").single();
  if (logErr || !purchase) return { error: "Couldn't start your number setup. Please try again." };

  const result = await executePurchase({ userId: user.id, country, phoneNumber, purchaseId: purchase.id });
  if ("success" in result) {
    revalidatePath("/agent-config");
    return { success: true, number: result.number };
  }
  if ("preparing" in result) return { preparing: true, message: PREPARING_MESSAGE };
  return { error: result.error };
}

// Called when a customer returns while their purchase is paused (balance was low).
// Retries the number they originally picked; if it's gone they simply pick again.
export async function retryPausedPurchase(): Promise<{ success?: true; stillPreparing?: true; error?: string }> {
  const user = await requireUser();
  if (!user) return { error: "Not authenticated" };
  const { data: paused } = await supabaseAdmin.from("number_purchases").select("id, country_code, phone_number")
    .eq("user_id", user.id).eq("status", "paused_low_balance").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!paused?.phone_number) return { error: "Nothing to retry." };

  await supabaseAdmin.from("number_purchases").update({ status: "failed", error: "superseded by retry" }).eq("id", paused.id);
  const result = await claimNumber(paused.country_code, paused.phone_number);
  if (result.success) return { success: true };
  if (result.preparing) return { stillPreparing: true };
  return { error: result.error };
}

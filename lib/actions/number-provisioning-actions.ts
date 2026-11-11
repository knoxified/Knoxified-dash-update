"use server";

import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isPaidUser } from "@/lib/plan-access";
import { searchNumbers, buyNumber, TelephonyError, type AvailableNumber } from "@/lib/telephony/signalwire";

// Global safety valve: a bug or abuse can never buy more than this per day.
const DAILY_PURCHASE_CAP = 25;
const VOICE_INBOUND_URL = process.env.VOICE_INBOUND_URL || "https://voice.knoxified.org/voice/inbound";
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
  if (!data || !data.is_enabled || data.number_mode !== "dedicated" || data.provider !== "signalwire") return null;
  return data;
}

export async function searchAvailableNumbers(countryCode: string, areaCode?: string): Promise<{ numbers?: AvailableNumber[]; error?: string }> {
  const user = await requireUser();
  if (!user) return { error: "Not authenticated" };
  if (!(await isPaidUser(user.id))) return { error: "Getting a number is available on paid plans." };
  if (!(await loadDedicatedCountry(countryCode))) return { error: "Numbers aren't available for that country yet." };

  try {
    const numbers = await searchNumbers(countryCode, areaCode?.trim() || undefined);
    if (numbers.length === 0) return { error: "No numbers found for that search. Try another area code." };
    return { numbers };
  } catch (err) {
    console.error("[numbers] search failed:", (err as Error).message);
    return { error: "Couldn't search numbers right now. Please try again shortly." };
  }
}

async function alertOwner(action: string, userId: string, metadata: Record<string, unknown>) {
  await supabaseAdmin.from("audit_logs").insert({ user_id: userId, action, entity_type: "phone_number", metadata });
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

  try {
    const bought = await buyNumber(phoneNumber, VOICE_INBOUND_URL, `Knoxified ${user.id.slice(0, 8)}`);

    const { error: mapErr } = await supabaseAdmin.from("phone_number_mappings").insert({
      user_id: user.id,
      phone_number: bought.phone_number,
      is_active: true,
      source: "provisioned",
      verified_at: new Date().toISOString(),
      sms_provider: "signalwire",
      provider_number_id: bought.sid,
      country_code: countryCode,
    });
    if (mapErr) {
      // Bought but not saved: never lose track of money spent.
      await alertOwner("number_purchase_orphaned", user.id, { number: bought.phone_number, sid: bought.sid, error: mapErr.message });
      await supabaseAdmin.from("number_purchases").update({ status: "failed", error: `orphaned: ${mapErr.message}` }).eq("id", purchase.id);
      return { error: "We hit a problem finishing your setup. Our team has been notified." };
    }

    await supabaseAdmin.from("number_purchases").update({ status: "succeeded", phone_number: bought.phone_number }).eq("id", purchase.id);
    revalidatePath("/agent-config");
    return { success: true, number: bought.phone_number };
  } catch (err) {
    const e = err as TelephonyError;
    console.error("[numbers] purchase failed:", e.message);
    if (e.lowBalance) {
      await supabaseAdmin.from("number_purchases").update({ status: "paused_low_balance", error: e.message }).eq("id", purchase.id);
      await alertOwner("number_purchase_low_balance", user.id, { country: countryCode, number: phoneNumber, error: e.message });
      return { preparing: true, message: PREPARING_MESSAGE };
    }
    await supabaseAdmin.from("number_purchases").update({ status: "failed", error: e.message }).eq("id", purchase.id);
    return { error: "That number couldn't be reserved. Please pick another." };
  }
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

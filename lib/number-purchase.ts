import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getProvider, TelephonyError } from "@/lib/telephony";

export type PurchaseCountry = { country_code: string; provider: string };
export type PurchaseResult = { success: true; number: string } | { preparing: true } | { error: string };

// Audit row always; plus a POST to OWNER_ALERT_WEBHOOK_URL (e.g. an n8n webhook that
// emails or messages you) when that variable is set.
export async function alertOwner(action: string, userId: string, metadata: Record<string, unknown>) {
  await supabaseAdmin.from("audit_logs").insert({ user_id: userId, action, entity_type: "phone_number", metadata });
  const hook = process.env.OWNER_ALERT_WEBHOOK_URL;
  if (!hook) return;
  try {
    await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: action, user_id: userId, ...metadata, at: new Date().toISOString() }),
    });
  } catch {
    /* alerting must never break a purchase */
  }
}

// Buys one number for one user against an existing number_purchases row.
// The row ends up succeeded, failed, or paused_low_balance (provider account not ready / no funds).
export async function executePurchase(opts: {
  userId: string;
  country: PurchaseCountry;
  phoneNumber: string;
  purchaseId: string;
}): Promise<PurchaseResult> {
  const { userId, country, phoneNumber, purchaseId } = opts;
  const provider = getProvider(country.provider);
  if (!provider) return { error: "Numbers aren't available for that country yet." };

  try {
    await provider.checkFunds?.();
    const bought = await provider.buy(phoneNumber, `Knoxified ${userId.slice(0, 8)}`);

    const { error: mapErr } = await supabaseAdmin.from("phone_number_mappings").insert({
      user_id: userId,
      phone_number: bought.phone_number,
      is_active: true,
      source: "provisioned",
      verified_at: new Date().toISOString(),
      sms_provider: country.provider,
      provider_number_id: bought.sid,
      country_code: country.country_code,
    });
    if (mapErr) {
      // Bought but not saved: never lose track of money spent.
      await alertOwner("number_purchase_orphaned", userId, { number: bought.phone_number, sid: bought.sid, error: mapErr.message });
      await supabaseAdmin.from("number_purchases").update({ status: "failed", error: `orphaned: ${mapErr.message}` }).eq("id", purchaseId);
      return { error: "We hit a problem finishing your setup. Our team has been notified." };
    }

    await supabaseAdmin.from("number_purchases").update({ status: "succeeded", phone_number: bought.phone_number }).eq("id", purchaseId);
    return { success: true, number: bought.phone_number };
  } catch (err) {
    const e = err as TelephonyError;
    console.error("[numbers] purchase failed:", e.message);
    if (e.lowBalance) {
      await supabaseAdmin.from("number_purchases").update({ status: "paused_low_balance", error: e.message }).eq("id", purchaseId);
      await alertOwner("number_purchase_low_balance", userId, { country: country.country_code, number: phoneNumber, error: e.message });
      return { preparing: true };
    }
    await supabaseAdmin.from("number_purchases").update({ status: "failed", error: e.message }).eq("id", purchaseId);
    return { error: "That number couldn't be reserved. Please pick another." };
  }
}

// Retry for a paused purchase (cron path). If the originally chosen number was taken
// meanwhile, falls back to another number in the same area code, then any in the country.
export async function retryPurchase(row: { id: string; user_id: string; country_code: string; provider: string; phone_number: string }): Promise<PurchaseResult> {
  const country = { country_code: row.country_code, provider: row.provider };
  const first = await executePurchase({ userId: row.user_id, country, phoneNumber: row.phone_number, purchaseId: row.id });
  if (!("error" in first)) return first;

  const provider = getProvider(row.provider);
  if (!provider) return first;
  const area = /^\+1(\d{3})/.exec(row.phone_number)?.[1];
  for (const a of area ? [area, undefined] : [undefined]) {
    const list = await provider.search(row.country_code, a).catch(() => []);
    const next = list.find((n) => n.phone_number !== row.phone_number);
    if (!next) continue;
    await supabaseAdmin.from("number_purchases").update({ status: "pending", phone_number: next.phone_number, error: null }).eq("id", row.id);
    const second = await executePurchase({ userId: row.user_id, country, phoneNumber: next.phone_number, purchaseId: row.id });
    if (!("error" in second)) return second;
  }
  return first;
}

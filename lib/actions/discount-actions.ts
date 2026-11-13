"use server";

import { createClient } from "@/lib/supabase/server";
import { ORGANIC_DISCOUNT_ENABLED } from "@/lib/constants/discount";

const OFFER_WINDOW_HOURS = 48;

export interface AffiliateRatePlan {
  id: string; // the hidden affiliate-rate plan row
  baseId: string; // the public plan it discounts
  baseName: string;
  baseInterval: string | null;
  price: number | null;
  currency: string | null;
  purchasable: boolean; // has a Flutterwave payment plan and a price
}

// Every affiliate-rate variant. Used by the billing page to show discounted
// prices while the offer is open, and to recognise a variant as "current".
export async function getAffiliateRatePlans(): Promise<AffiliateRatePlan[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("id, price, currency, flutterwave_plan_id, affiliate_rate_of, base:plans!affiliate_rate_of(name, billing_interval)")
    .not("affiliate_rate_of", "is", null);
  return (data ?? []).map((p: any) => {
    const base = Array.isArray(p.base) ? p.base[0] : p.base;
    return {
      id: p.id,
      baseId: p.affiliate_rate_of,
      baseName: base?.name ?? "",
      baseInterval: base?.billing_interval ?? null,
      price: p.price === null || p.price === undefined ? null : Number(p.price),
      currency: p.currency ?? null,
      purchasable: Boolean(p.flutterwave_plan_id) && p.price !== null && p.price !== undefined,
    };
  });
}

// The banner's "Lock in my rate" button: the monthly Pro variant.
export async function getAffiliateProPlan() {
  const plans = await getAffiliateRatePlans();
  return (
    plans.find((p) => p.purchasable && /^pro/i.test(p.baseName) && p.baseInterval === "month") ?? null
  );
}

// Starts the 48-hour Founding Rate window -- called once, right after a
// user's first successful voice preview (the agreed trigger: after they've
// actually heard real value, not on first page load). A no-op if this
// user's window was already set, ever -- expires_at is written exactly
// once per account, permanently, so it can never be regenerated or
// extended by revisiting the trigger.
export async function triggerDiscountOffer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("users")
    .select("discount_offer_expires_at, referred_by_partner_id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.discount_offer_expires_at) {
    return { alreadySet: true };
  }

  // Only partner-referred accounts get the window unless the master switch is on.
  if (!ORGANIC_DISCOUNT_ENABLED && !existing?.referred_by_partner_id) {
    return { notEligible: true };
  }

  const expiresAt = new Date(Date.now() + OFFER_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("users")
    .update({ discount_offer_expires_at: expiresAt })
    .eq("id", user.id)
    .is("discount_offer_expires_at", null); // extra guard against a race setting it twice

  if (error) return { error: error.message };
  return { expiresAt };
}

export interface DiscountOfferStatus {
  active: boolean; // currently running, unclaimed, unexpired
  expiresAt: string | null;
  claimed: boolean;
  forfeited: boolean;
}

export async function getDiscountOfferStatus(): Promise<DiscountOfferStatus> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { active: false, expiresAt: null, claimed: false, forfeited: false };

  const { data } = await supabase
    .from("users")
    .select("discount_offer_expires_at, discount_offer_claimed_at, discount_offer_forfeited")
    .eq("id", user.id)
    .maybeSingle();

  if (!data?.discount_offer_expires_at) {
    return { active: false, expiresAt: null, claimed: false, forfeited: false };
  }

  const expiresAt = data.discount_offer_expires_at;
  const claimed = Boolean(data.discount_offer_claimed_at);
  const expired = new Date(expiresAt).getTime() < Date.now();

  // Lazy write: mark forfeited the first time anyone notices it expired
  // unclaimed, rather than needing a cron job. Best-effort -- the active
  // computation below never depends on this write succeeding.
  if (expired && !claimed && !data.discount_offer_forfeited) {
    await supabase.from("users").update({ discount_offer_forfeited: true }).eq("id", user.id);
  }

  return {
    active: !expired && !claimed,
    expiresAt,
    claimed,
    forfeited: expired && !claimed,
  };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { ORGANIC_DISCOUNT_ENABLED } from "@/lib/constants/discount";
import { discountedPrice, isOfferEligiblePlan } from "@/lib/discount-pricing";

const OFFER_WINDOW_HOURS = 168; // 7 days

export interface OfferPlan {
  planId: string;
  name: string;
  interval: string | null;
  price: number; // normal price
  offerPrice: number; // first-payment price while the offer is open
  currency: string | null;
}

// Every plan the first-payment offer applies to, with its discounted first payment.
// The billing page and banner use this for display; /api/checkout recomputes the
// amount server-side and never trusts these numbers.
export async function getOfferPlans(): Promise<OfferPlan[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("id, name, price, currency, billing_interval, flutterwave_plan_id")
    .eq("is_active", true)
    .not("flutterwave_plan_id", "is", null)
    .gt("price", 0);
  return (data ?? [])
    .filter((p: any) => isOfferEligiblePlan(p))
    .map((p: any) => ({
      planId: p.id,
      name: p.name,
      interval: p.billing_interval ?? null,
      price: Number(p.price),
      offerPrice: discountedPrice(p),
      currency: p.currency ?? null,
    }));
}

// Starts the 7-day first-payment offer window -- called once, right after a
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
  referrerName?: string | null; // the partner who referred this account, if any
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

  const active = !expired && !claimed;
  let referrerName: string | null = null;
  if (active) {
    const { data: name } = await supabase.rpc("get_my_referrer_name");
    referrerName = typeof name === "string" && name.trim() ? name.trim() : null;
  }

  return {
    active,
    expiresAt,
    claimed,
    forfeited: expired && !claimed,
    referrerName,
  };
}

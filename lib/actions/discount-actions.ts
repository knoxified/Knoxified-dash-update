"use server";

import { createClient } from "@/lib/supabase/server";
import { FOUNDING_RATE_PLAN_NAME } from "@/lib/constants/discount";

const OFFER_WINDOW_HOURS = 48;

export async function getFoundingRatePlan() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("id, price, currency")
    .eq("name", FOUNDING_RATE_PLAN_NAME)
    .maybeSingle();
  return data;
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
    .select("discount_offer_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.discount_offer_expires_at) {
    return { alreadySet: true };
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

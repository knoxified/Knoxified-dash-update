import { supabaseAdmin } from "@/lib/supabase/server";
import { discountedPrice, isOfferEligiblePlan } from "@/lib/discount-pricing";

/**
 * POST /api/webhooks/flutterwave
 *
 * Flutterwave calls this after a payment completes. We:
 *  1. Verify the request actually came from Flutterwave (verif-hash header,
 *     v3-style: a plain string compare against the secret hash set on the
 *     Flutterwave dashboard — NOT the newer v4 HMAC-signature scheme).
 *  2. Re-verify the transaction server-side (never trust the webhook body
 *     alone for the status/amount).
 *  3. Activate the plan on the user's row in Supabase.
 *
 * This handler is naturally idempotent: re-applying the same plan_id on a
 * duplicate webhook delivery has no side effect, so no separate dedupe
 * table is needed for this use case.
 */

// Commission is calculated on the net amount: what the customer paid minus Flutterwave's fees
// (both in the transaction currency, so no currency conversion is involved).
function netAmount(v: any): number {
  const gross = Number(v.amount);
  const fees = Number(v.app_fee ?? 0) + Number(v.merchant_fee ?? 0);
  return Math.max(0, Math.round((gross - fees) * 100) / 100);
}

// Writes one row to the partner commission ledger for a referred customer's payment.
// record_partner_commission ignores customers who weren't referred and is idempotent
// per transaction id, so retried webhooks never double count.
async function recordCommission(userId: string, v: any, transactionId: string | number) {
  const { error } = await supabaseAdmin.rpc("record_partner_commission", {
    p_user_id: userId,
    p_tx_id: String(transactionId),
    p_paid_at: v.created_at ? new Date(v.created_at).toISOString() : new Date().toISOString(),
    p_gross: Number(v.amount),
    p_net: netAmount(v),
    p_currency: v.currency,
  });
  if (error) console.error("Failed to record partner commission:", error);
}

export async function POST(request: Request) {
  const secretHash = process.env.FLW_SECRET_HASH;
  const signature = request.headers.get("verif-hash");

  if (!secretHash || !signature || signature !== secretHash) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const flwSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!flwSecretKey) {
    console.error("FLUTTERWAVE_SECRET_KEY is not set");
    // Still return 200 so Flutterwave doesn't hammer retries for a config issue
    // that a webhook retry can't fix; the real fix is setting the secret.
    return new Response("OK", { status: 200 });
  }

  // Flutterwave's actual webhook payload shape varies — sometimes the
  // documented {event, data: {id}} structure, sometimes flat ({id, txRef,
  // status, ...} at the top level, observed in test mode). Support both;
  // we only need the transaction id here since everything else gets
  // re-verified server-side via the /verify call below regardless.
  const transactionId = payload?.data?.id ?? payload?.id;
  if (!transactionId) {
    return new Response("OK", { status: 200 });
  }

  // Always re-verify server-side — never trust the webhook body's status directly.
  let verifyData: any;
  try {
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: { Authorization: `Bearer ${flwSecretKey}` },
      }
    );
    const verifyJson = await verifyRes.json();
    verifyData = verifyJson?.data;
  } catch (error) {
    console.error("Flutterwave verify call failed:", error);
    return new Response("OK", { status: 200 }); // Flutterwave will retry
  }

  if (!verifyData || verifyData.status !== "successful") {
    return new Response("OK", { status: 200 });
  }

  const userId = verifyData.meta?.user_id;
  const planId = verifyData.meta?.plan_id;

  if (!userId || !planId) {
    // Renewal charges carry no checkout metadata. They don't change the plan, but they can
    // still earn the referring partner a commission, so find the customer by email.
    const email = String(verifyData.customer?.email ?? "").trim().toLowerCase();
    if (email) {
      const { data: renewingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (renewingUser?.id) {
        await recordCommission(renewingUser.id, verifyData, transactionId);
        return new Response("OK", { status: 200 });
      }
    }
    console.error("Webhook verified but missing meta.user_id/meta.plan_id", verifyData);
    return new Response("OK", { status: 200 });
  }

  // Confirm the amount actually matches the plan being activated, so a
  // tampered or mismatched checkout can't grant a higher plan than paid for.
  // The first payment may be the discounted offer amount (checkout sets
  // meta.offer_applied); the amount is recomputed here, never trusted.
  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("price, currency, name, billing_interval")
    .eq("id", planId)
    .single();

  const paid = Number(verifyData.amount);
  const listPrice = plan ? Number(plan.price) : NaN;
  const paidFull = paid >= listPrice;
  const paidOffer =
    !!plan &&
    String(verifyData.meta?.offer_applied) === "true" &&
    isOfferEligiblePlan(plan) &&
    paid >= discountedPrice(plan) - 0.01;

  if (!plan || verifyData.currency !== plan.currency || (!paidFull && !paidOffer)) {
    console.error("Webhook amount/currency mismatch for plan", { verifyData, plan });
    return new Response("OK", { status: 200 });
  }
  const usedOffer = !paidFull && paidOffer;

  const updatePayload: Record<string, unknown> = {
    plan_id: planId,
    // A successful paid upgrade is exactly the nudge the duplicate-account
    // lock (see /areas or docs on credits_locked) exists to produce --
    // clear it here rather than requiring a separate manual step.
    credits_locked: false,
    credits_locked_reason: null,
  };

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update(updatePayload)
    .eq("id", userId);

  if (updateError) {
    console.error("Failed to update user plan from webhook:", updateError);
  }

  // The offer is single-use: record the claim once (a retried webhook won't overwrite it).
  if (usedOffer) {
    const { data: claimed } = await supabaseAdmin
      .from("users")
      .update({ discount_offer_claimed_at: new Date().toISOString() })
      .eq("id", userId)
      .is("discount_offer_claimed_at", null)
      .select("id");
    if (claimed && claimed.length > 0) {
      await supabaseAdmin.from("audit_logs").insert({
        user_id: userId,
        action: "first_payment_offer_claimed",
        entity_type: "plan",
        entity_id: planId,
        metadata: {
          plan: plan.name,
          list_price: listPrice,
          paid,
          currency: plan.currency,
          transaction_id: transactionId,
        },
      });
    }
  }

  // Partner attribution: the first successful payment turns a referred lead into "paid".
  const { error: leadError } = await supabaseAdmin
    .from("partner_leads")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("user_id", userId)
    .neq("status", "paid");
  if (leadError) {
    console.error("Failed to mark partner lead as paid:", leadError);
  }

  // Commission ledger entry for this payment (no-op for customers who weren't referred).
  await recordCommission(userId, verifyData, transactionId);

  return new Response("OK", { status: 200 });
}

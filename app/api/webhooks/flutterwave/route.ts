import { supabaseAdmin } from "@/lib/supabase/server";

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
    console.error("Webhook verified but missing meta.user_id/meta.plan_id", verifyData);
    return new Response("OK", { status: 200 });
  }

  // Confirm the amount actually matches the plan being activated, so a
  // tampered or mismatched checkout can't grant a higher plan than paid for.
  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("price, currency")
    .eq("id", planId)
    .single();

  if (
    !plan ||
    Number(verifyData.amount) < Number(plan.price) ||
    verifyData.currency !== plan.currency
  ) {
    console.error("Webhook amount/currency mismatch for plan", { verifyData, plan });
    return new Response("OK", { status: 200 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({
      plan_id: planId,
      // A successful paid upgrade is exactly the nudge the duplicate-account
      // lock (see /areas or docs on credits_locked) exists to produce --
      // clear it here rather than requiring a separate manual step.
      credits_locked: false,
      credits_locked_reason: null,
    })
    .eq("id", userId);

  if (updateError) {
    console.error("Failed to update user plan from webhook:", updateError);
  }

  return new Response("OK", { status: 200 });
}

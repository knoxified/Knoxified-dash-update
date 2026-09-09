import { createClient } from "@/lib/supabase/server";
import { FOUNDING_RATE_PLAN_NAME } from "@/lib/constants/discount";

/**
 * POST /api/checkout
 * Body: { planId: string }
 *
 * Starts a Flutterwave payment session for the logged-in user against
 * the chosen plan's Flutterwave payment plan, and returns the hosted
 * checkout URL for the client to redirect to.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let planId: string | undefined;
  try {
    const body = await request.json();
    planId = body.planId;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!planId) {
    return Response.json({ error: "planId is required" }, { status: 400 });
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id, name, price, currency, flutterwave_plan_id")
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    return Response.json({ error: "Plan not found" }, { status: 404 });
  }

  if (!plan.flutterwave_plan_id || !plan.price) {
    return Response.json(
      { error: "This plan is not available for self-serve checkout" },
      { status: 400 }
    );
  }

  // The Founding Rate offer is time-boxed per-user, permanently, once
  // triggered -- never trust a client-side countdown for this. If the
  // window's expired (or was never triggered, or already claimed), this
  // plan simply isn't purchasable for this user, full stop.
  if (plan.name === FOUNDING_RATE_PLAN_NAME) {
    const { data: userRow } = await supabase
      .from("users")
      .select("discount_offer_expires_at, discount_offer_claimed_at")
      .eq("id", user.id)
      .maybeSingle();

    const expiresAt = userRow?.discount_offer_expires_at;
    const alreadyClaimed = Boolean(userRow?.discount_offer_claimed_at);
    const windowOpen = expiresAt && new Date(expiresAt).getTime() > Date.now();

    if (!windowOpen || alreadyClaimed) {
      return Response.json(
        { error: "This offer has expired and can't be reactivated." },
        { status: 410 }
      );
    }
  }

  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    console.error("FLUTTERWAVE_SECRET_KEY is not set");
    return Response.json({ error: "Payment provider not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const txRef = `knox-${user.id}-${Date.now()}`;

  try {
    const flwResponse = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: plan.price,
        currency: plan.currency || "USD",
        payment_plan: plan.flutterwave_plan_id,
        redirect_url: `${origin}/billing?checkout=complete`,
        customer: {
          email: user.email,
        },
        customizations: {
          title: "Knoxified",
          description: `${plan.name === FOUNDING_RATE_PLAN_NAME ? "Pro" : plan.name} subscription`,
        },
        meta: {
          user_id: user.id,
          plan_id: plan.id,
        },
      }),
    });

    const flwData = await flwResponse.json();

    if (flwData.status !== "success" || !flwData.data?.link) {
      console.error("Flutterwave payment init failed:", flwData);
      return Response.json({ error: "Failed to start checkout" }, { status: 502 });
    }

    return Response.json({ url: flwData.data.link });
  } catch (error) {
    console.error("Flutterwave checkout error:", error);
    return Response.json({ error: "Failed to reach payment provider" }, { status: 502 });
  }
}

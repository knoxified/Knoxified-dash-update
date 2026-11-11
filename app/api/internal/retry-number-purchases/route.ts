import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isPaidUser } from "@/lib/plan-access";
import { retryPurchase, alertOwner } from "@/lib/number-purchase";

export const dynamic = "force-dynamic";

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Called every 10 minutes by the voice agent's cron (service binding) while any purchase is
// paused. The token is derived from the service-role key both Workers already hold,
// so no new secret is needed and the key itself never travels.
export async function POST(req: Request) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const given = req.headers.get("x-cron-token") || "";
  if (!key || given !== (await sha256Hex(`${key}:number-retry`))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rows } = await supabaseAdmin
    .from("number_purchases")
    .select("id, user_id, country_code, provider, phone_number")
    .eq("status", "paused_low_balance")
    .order("created_at", { ascending: true })
    .limit(5);

  let done = 0;
  for (const row of rows || []) {
    if (!row.phone_number) continue;

    // Claim the row so two overlapping runs never buy twice.
    const { data: claimed } = await supabaseAdmin
      .from("number_purchases")
      .update({ status: "pending" })
      .eq("id", row.id)
      .eq("status", "paused_low_balance")
      .select("id");
    if (!claimed?.length) continue;

    const { data: existing } = await supabaseAdmin
      .from("phone_number_mappings")
      .select("id")
      .eq("user_id", row.user_id)
      .eq("source", "provisioned")
      .is("released_at", null)
      .maybeSingle();
    const paid = await isPaidUser(row.user_id);
    if (existing || !paid) {
      await supabaseAdmin.from("number_purchases").update({ status: "failed", error: existing ? "already has a number" : "no longer on a paid plan" }).eq("id", row.id);
      continue;
    }

    const result = await retryPurchase(row as any);
    if ("success" in result) {
      done++;
      await alertOwner("number_purchase_completed_after_retry", row.user_id, { number: result.number });
    }
    if ("preparing" in result) break; // provider still not ready: stop, try again next cron
  }

  return NextResponse.json({ ok: true, completed: done });
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isPaidUser } from "@/lib/plan-access";
import { getProvider } from "@/lib/telephony";
import { alertOwner } from "@/lib/number-purchase";

export const dynamic = "force-dynamic";

// Customers who stop paying keep their number this long before it's given back to the provider.
const GRACE_DAYS = 14;
const MAX_PER_RUN = 20;

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Called once a day by the voice agent's cron (service binding). A returning payer
// clears the countdown, so a lapse of a few days never costs them their number.
export async function POST(req: Request) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const given = req.headers.get("x-cron-token") || "";
  if (!key || given !== (await sha256Hex(`${key}:number-release`))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rows } = await supabaseAdmin
    .from("phone_number_mappings")
    .select("id, user_id, phone_number, provider_number_id, sms_provider, lapsed_at")
    .eq("source", "provisioned")
    .is("released_at", null)
    .limit(500);

  let released = 0;
  let marked = 0;
  for (const row of rows || []) {
    const paid = await isPaidUser(row.user_id);

    if (paid) {
      if (row.lapsed_at) await supabaseAdmin.from("phone_number_mappings").update({ lapsed_at: null }).eq("id", row.id);
      continue;
    }
    if (!row.lapsed_at) {
      await supabaseAdmin.from("phone_number_mappings").update({ lapsed_at: new Date().toISOString() }).eq("id", row.id);
      marked++;
      continue;
    }
    if (Date.now() - new Date(row.lapsed_at).getTime() < GRACE_DAYS * 86400000) continue;
    if (released >= MAX_PER_RUN) break;

    const provider = getProvider(row.sms_provider);
    if (!provider) continue;
    try {
      await provider.release(row.phone_number, row.provider_number_id);
      await supabaseAdmin
        .from("phone_number_mappings")
        .update({ released_at: new Date().toISOString(), is_active: false })
        .eq("id", row.id);
      await alertOwner("number_released_after_lapse", row.user_id, { number: row.phone_number });
      released++;
    } catch (err) {
      await alertOwner("number_release_failed", row.user_id, { number: row.phone_number, error: (err as Error).message });
    }
  }

  return NextResponse.json({ ok: true, released, marked });
}

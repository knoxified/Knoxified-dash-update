import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getBillingWindow } from "@/lib/billing-period";

// Returns ok:false with a user-facing message when this send would go over the
// plan's credit limit for the current billing period. A limit of 0 is treated
// as "no limit", the same way get_effective_limits reports it.
export async function checkCredits(userId: string, cost: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const [{ data: userRow }, { data: eff }] = await Promise.all([
    supabaseAdmin.from("users").select("billing_period_start, billing_period_end").eq("id", userId).maybeSingle(),
    supabaseAdmin.rpc("get_effective_limits", { p_user_id: userId }),
  ]);
  const row: any = Array.isArray(eff) ? eff[0] : eff;
  const limit = row?.limit_credits ?? 0;
  if (!limit) return { ok: true };
  const since = getBillingWindow({
    periodStart: (userRow as any)?.billing_period_start,
    periodEnd: (userRow as any)?.billing_period_end,
  }).usageStart.toISOString();
  const { data: usage } = await supabaseAdmin
    .from("usage").select("used_quantity").eq("user_id", userId).eq("feature_key", "credits").gte("created_at", since);
  const used = (usage || []).reduce((s: number, r: any) => s + (r.used_quantity || 0), 0);
  if (used + cost > limit) {
    return { ok: false, error: `You've used all ${limit} automation credits for this billing period. Upgrade your plan to keep sending.` };
  }
  return { ok: true };
}

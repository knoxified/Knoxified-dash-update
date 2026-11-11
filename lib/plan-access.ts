import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

// Same rule the voice agent uses (isTrialPlan): a plan with no price is a trial.
export async function isPaidUser(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("plans ( price )")
    .eq("id", userId)
    .maybeSingle();
  const plan: any = Array.isArray((data as any)?.plans) ? (data as any).plans[0] : (data as any)?.plans;
  return Number(plan?.price) > 0;
}

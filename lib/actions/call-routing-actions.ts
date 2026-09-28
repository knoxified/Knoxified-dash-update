"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/actions/compliance-actions";

// Owner-defined call routing rules, stored on agent_configs.custom_intents.
// voice-agent-beta re-validates on load (src/edge/services/routing.js); keep
// the limits here in sync with that file.

export type RoutingRule = {
  label: string;
  keywords: string[];
  action: "transfer" | "reply";
  reply?: string;
};

const E164 = /^\+[1-9]\d{7,14}$/;
// Accounts with an enabled system get fewer rules (the system already handles
// its own job; rules are only for exceptions). Starter has no system, so it
// gets more. Keep in sync with voice-agent-beta's routing.js.
const MAX_RULES_STARTER = 10;
const MAX_RULES_WITH_SYSTEM = 3;

async function getMaxRules(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { count } = await supabase
    .from("user_systems")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_enabled", true);
  return (count ?? 0) > 0 ? MAX_RULES_WITH_SYSTEM : MAX_RULES_STARTER;
}
const MAX_KEYWORDS = 10;

export async function getCallRouting() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };

  const { data, error } = await supabase
    .from("agent_configs")
    .select("custom_intents, business_phone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { error: error.message };
  const maxRules = await getMaxRules(supabase, user.id);
  return {
    maxRules,
    rules: (Array.isArray(data?.custom_intents) ? data!.custom_intents : []) as RoutingRule[],
    businessPhone: (data?.business_phone as string | null) ?? "",
  };
}

export async function saveCallRouting(input: { rules: RoutingRule[]; businessPhone: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const businessPhone = (input.businessPhone || "").trim();
  if (businessPhone && !E164.test(businessPhone)) {
    return { error: "Transfer number must be in international format, e.g. +12125551234." };
  }

  const maxRules = await getMaxRules(supabase, user.id);
  if (!Array.isArray(input.rules) || input.rules.length > maxRules) {
    return { error: `Your plan allows at most ${maxRules} routing rules.` };
  }

  const clean: RoutingRule[] = [];
  for (const [i, r] of input.rules.entries()) {
    const n = i + 1;
    const keywords = (r.keywords || [])
      .map((k) => (k || "").trim().toLowerCase())
      .filter(Boolean);
    if (keywords.length === 0) return { error: `Rule ${n}: add at least one keyword.` };
    if (keywords.length > MAX_KEYWORDS) return { error: `Rule ${n}: at most ${MAX_KEYWORDS} keywords.` };
    if (keywords.some((k) => k.length < 2 || k.length > 40)) {
      return { error: `Rule ${n}: each keyword must be 2-40 characters.` };
    }
    if (r.action !== "transfer" && r.action !== "reply") return { error: `Rule ${n}: pick an action.` };

    const label = (r.label || "").trim().slice(0, 60);
    if (r.action === "reply") {
      const reply = (r.reply || "").trim();
      if (!reply) return { error: `Rule ${n}: write what the agent should say.` };
      if (reply.length > 300) return { error: `Rule ${n}: reply is limited to 300 characters.` };
      clean.push({ label, keywords, action: "reply", reply });
    } else {
      if (!businessPhone) return { error: `Rule ${n}: set a transfer number before adding a transfer rule.` };
      clean.push({ label, keywords, action: "transfer" });
    }
  }

  const { error } = await supabase
    .from("agent_configs")
    .upsert(
      { user_id: user.id, custom_intents: clean, business_phone: businessPhone || null, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) return { error: error.message };

  // Transfer destination changes are worth a paper trail.
  await logAuditEvent(
    "Call Routing Updated",
    `${clean.length} rule(s); transfer number ${businessPhone || "not set"}.`
  ).catch(() => {});

  revalidatePath("/agent-config");
  return { success: true as const };
}

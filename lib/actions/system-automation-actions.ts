"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SystemAutomation {
  id: string; // automation_catalog.id (uuid)
  key: string;
  name: string;
  description: string;
  icon: string | null;
  slotRequired: number;
  isEnabled: boolean;
}

export async function getSystemAutomations(systemId: string): Promise<{ automations: SystemAutomation[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { automations: [], error: "Not authenticated" };

  const { data: links, error: linksError } = await supabase
    .from("system_automations")
    .select("automation_catalog ( id, key, name, description, icon, slot_required )")
    .eq("system_id", systemId);

  if (linksError) return { automations: [], error: linksError.message };

  const catalogEntries = (links || [])
    .map((l: any) => l.automation_catalog)
    .filter(Boolean);

  if (catalogEntries.length === 0) return { automations: [] };

  const catalogIds = catalogEntries.map((c: any) => c.id);
  const { data: userAutomations } = await supabase
    .from("user_automations")
    .select("automation_id, is_enabled")
    .eq("user_id", user.id)
    .in("automation_id", catalogIds);

  const enabledSet = new Set((userAutomations || []).filter((u) => u.is_enabled).map((u) => u.automation_id));

  const automations: SystemAutomation[] = catalogEntries.map((c: any) => ({
    id: c.id,
    key: c.key,
    name: c.name,
    description: c.description,
    icon: c.icon,
    slotRequired: c.slot_required ?? 1,
    isEnabled: enabledSet.has(c.id),
  }));

  return { automations };
}

export async function toggleUserAutomation(automationCatalogId: string, automationKey: string, enable: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: userRow } = await supabase
    .from("users")
    .select("credits_locked, plan_id")
    .eq("id", user.id)
    .maybeSingle();

  if (enable && userRow?.credits_locked) {
    return { error: "locked" };
  }

  if (enable) {
    // Real slot enforcement: plans.limit_active_automations caps how many
    // automation slots a plan allows at once (automation_catalog.
    // slot_required per automation, usually 1) -- this was never actually
    // checked before, just a column sitting unused.
    const [{ data: plan }, { data: currentlyEnabled }, { data: thisAutomation }] = await Promise.all([
      supabase.from("plans").select("limit_active_automations").eq("id", userRow?.plan_id).maybeSingle(),
      supabase
        .from("user_automations")
        .select("automation_catalog ( slot_required )")
        .eq("user_id", user.id)
        .eq("is_enabled", true),
      supabase.from("automation_catalog").select("slot_required").eq("id", automationCatalogId).maybeSingle(),
    ]);

    const limit = plan?.limit_active_automations;
    if (limit != null) {
      const usedSlots = (currentlyEnabled || []).reduce((sum: number, row: any) => sum + (row.automation_catalog?.slot_required ?? 1), 0);
      const thisSlotCost = thisAutomation?.slot_required ?? 1;
      if (usedSlots + thisSlotCost > limit) {
        return { error: "slot_limit", limit, used: usedSlots };
      }
    }
  }

  const { data: existing } = await supabase
    .from("user_automations")
    .select("id")
    .eq("user_id", user.id)
    .eq("automation_id", automationCatalogId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user_automations")
      .update({ is_enabled: enable })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("user_automations")
      .insert({ user_id: user.id, automation_id: automationCatalogId, is_enabled: enable });
    if (error) return { error: error.message };
  }

  // Recompute derived "system active" status -- user_systems.is_enabled is
  // what getEnabledSystemPrompts (voice-agent-beta) actually reads to decide
  // which industry prompt to include on calls, so it has to reflect reality,
  // not just this one toggle. One automation (e.g. ProofPulse) can belong to
  // several systems, so recompute every system that uses it.
  const { data: affectedSystems } = await supabase
    .from("system_automations")
    .select("system_id")
    .eq("automation_key", automationKey);

  for (const { system_id } of affectedSystems || []) {
    const { data: systemAutomationKeys } = await supabase
      .from("system_automations")
      .select("automation_catalog ( id )")
      .eq("system_id", system_id);

    const requiredIds = (systemAutomationKeys || []).map((r: any) => r.automation_catalog?.id).filter(Boolean);
    if (requiredIds.length === 0) continue;

    const { data: enabledForSystem } = await supabase
      .from("user_automations")
      .select("automation_id")
      .eq("user_id", user.id)
      .eq("is_enabled", true)
      .in("automation_id", requiredIds);

    const allEnabled = (enabledForSystem?.length || 0) === requiredIds.length;

    await supabase
      .from("user_systems")
      .upsert(
        { user_id: user.id, system_id, is_enabled: allEnabled, activated_at: allEnabled ? new Date().toISOString() : null },
        { onConflict: "user_id,system_id" }
      );
  }

  revalidatePath("/systems");
  return { success: true };
}

export async function getAgentReadiness(): Promise<{ hasPhoneNumber: boolean; hasMemory: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { hasPhoneNumber: false, hasMemory: false };

  const [{ data: numbers }, { data: config }] = await Promise.all([
    supabase.from("phone_number_mappings").select("id").eq("user_id", user.id).eq("is_active", true).limit(1),
    supabase.from("agent_configs").select("memory_context").eq("user_id", user.id).maybeSingle(),
  ]);

  return {
    hasPhoneNumber: Boolean(numbers && numbers.length > 0),
    hasMemory: Boolean(config?.memory_context && config.memory_context.trim().length > 0),
  };
}

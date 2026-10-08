"use server";

import { createClient } from "@/lib/supabase/server";

export async function getAgentIdentity() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { agentNickname: "Alex", agentAvatar: "bot", organizationName: "" };

  const { data } = await supabase
    .from("agent_configs")
    .select("agent_nickname, agent_avatar, organization_name")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    agentNickname: data?.agent_nickname || "Alex",
    agentAvatar: data?.agent_avatar || "bot",
    organizationName: data?.organization_name || "",
  };
}

// Last system the user picked for webcall previews on the dashboard overview.
// "" = no system (the account's own configuration). Stored on agent_configs
// so it persists across sessions. Selecting here NEVER activates a system --
// activation lives in user_systems and is a separate flow.
export async function getWebcallPreviewSystem(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "";

  const { data, error } = await supabase
    .from("agent_configs")
    .select("webcall_preview_system")
    .eq("user_id", user.id)
    .maybeSingle();

  // Column missing (migration not run yet) or no row: behave as "no system".
  if (error) return "";
  return data?.webcall_preview_system || "";
}

export async function setWebcallPreviewSystem(systemId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const value = systemId.trim();
  if (value) {
    // Only accept ids that really exist in the catalog.
    const { data: exists } = await supabase
      .from("systems_catalog")
      .select("id")
      .eq("id", value)
      .maybeSingle();
    if (!exists) return { ok: false };
  }

  const { error } = await supabase
    .from("agent_configs")
    .update({ webcall_preview_system: value || null })
    .eq("user_id", user.id);
  return { ok: !error };
}

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

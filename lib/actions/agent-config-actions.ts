"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAgentConfig() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: agentConfig, error: agentError } = await supabase
    .from("agent_configs")
    .select("id, organization_name, business_hours, temperature")
    .eq("user_id", user.id)
    .single();

  const { data: voiceSettings, error: voiceError } = await supabase
    .from("user_voice_settings")
    .select("id, agent_persona, agent_greeting")
    .eq("user_id", user.id)
    .single();

  return {
    agentConfig: agentConfig || null,
    voiceSettings: voiceSettings || null,
    error: agentError?.message || voiceError?.message || null,
  };
}

export async function updateAgentConfig(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const agent_persona = formData.get("agent_persona") as string;
  const agent_greeting = formData.get("agent_greeting") as string;
  const organization_name = formData.get("organization_name") as string;
  const business_hours = formData.get("business_hours") as string;
  const temperatureStr = formData.get("temperature") as string;
  
  let temperature = 0.7; // default
  if (temperatureStr) {
    temperature = parseFloat(temperatureStr);
    if (isNaN(temperature) || temperature < 0 || temperature > 1) {
      return { error: "Temperature must be between 0 and 1" };
    }
  }

  // Try to update agent_configs first
  const { data: existingAgentConfig } = await supabase
    .from("agent_configs")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingAgentConfig) {
    const { error } = await supabase
      .from("agent_configs")
      .update({
        organization_name,
        business_hours,
        temperature,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingAgentConfig.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("agent_configs")
      .insert({
        user_id: user.id,
        organization_name,
        business_hours,
        temperature,
      });
    if (error) return { error: error.message };
  }

  // Try to update user_voice_settings
  const { data: existingVoiceSettings } = await supabase
    .from("user_voice_settings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingVoiceSettings) {
    const { error } = await supabase
      .from("user_voice_settings")
      .update({
        agent_persona,
        agent_greeting,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingVoiceSettings.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("user_voice_settings")
      .insert({
        user_id: user.id,
        agent_persona,
        agent_greeting,
      });
    if (error) return { error: error.message };
  }

  revalidatePath("/agent-config");
  return { success: true };
}

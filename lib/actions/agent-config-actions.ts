"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAgentConfig() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Try to select with new columns. If it fails (columns don't exist yet), fallback.
  let agentConfig = null;
  let agentError = null;
  
  const res = await supabase
    .from("agent_configs")
    .select("id, organization_name, business_hours, temperature, voice_minute_limit_alert, alert_email")
    .eq("user_id", user.id)
    .single();
    
  if (res.error && res.error.message.includes("does not exist")) {
    const fallbackRes = await supabase
      .from("agent_configs")
      .select("id, organization_name, business_hours, temperature")
      .eq("user_id", user.id)
      .single();
    agentConfig = fallbackRes.data;
    agentError = fallbackRes.error;
  } else {
    agentConfig = res.data;
    agentError = res.error;
  }

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
  
  const voice_minute_limit_alert = formData.get("voice_minute_limit_alert") === "on" || formData.get("voice_minute_limit_alert") === "true";
  const alert_email = formData.get("alert_email") as string;
  
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

  let updatePayload: any = {
    organization_name,
    business_hours,
    temperature,
    updated_at: new Date().toISOString(),
  };

  if (existingAgentConfig) {
    const res = await supabase
      .from("agent_configs")
      .update({ ...updatePayload, voice_minute_limit_alert, alert_email })
      .eq("id", existingAgentConfig.id);
      
    if (res.error && res.error.message.includes("does not exist")) {
      const fallbackRes = await supabase
        .from("agent_configs")
        .update(updatePayload)
        .eq("id", existingAgentConfig.id);
      if (fallbackRes.error) return { error: fallbackRes.error.message };
    } else if (res.error) {
      return { error: res.error.message };
    }
  } else {
    updatePayload.user_id = user.id;
    const res = await supabase
      .from("agent_configs")
      .insert({ ...updatePayload, voice_minute_limit_alert, alert_email });
      
    if (res.error && res.error.message.includes("does not exist")) {
      const fallbackRes = await supabase
        .from("agent_configs")
        .insert(updatePayload);
      if (fallbackRes.error) return { error: fallbackRes.error.message };
    } else if (res.error) {
      return { error: res.error.message };
    }
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

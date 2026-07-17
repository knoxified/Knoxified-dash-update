"use server";

import { supabaseAdmin } from "../supabase/server";

const CURRENT_USER_ID = "ad409f1e-7150-4ed1-a4d1-ab5d523ab265";

export async function getRealSystems() {
  const userId = CURRENT_USER_ID;

  // Fetch automations for user
  const { data: userAutomations } = await supabaseAdmin
    .from('user_automations')
    .select(`
      id,
      is_enabled,
      settings,
      created_at,
      automation_id,
      automation_catalog (
        name,
        description,
        key
      )
    `)
    .eq('user_id', userId);

  return userAutomations || [];
}

export async function getDashboardStats(dateRange: string = "7d") {
  const userId = CURRENT_USER_ID;

  // Real voice usage
  const { data: voiceUsage } = await supabaseAdmin
    .from('voice_usage')
    .select('minutes_used')
    .eq('user_id', userId);
  
  const totalVoice = voiceUsage?.reduce((acc: number, row: any) => acc + (row.minutes_used || 0), 0) || 0;

  // Real automation runs
  const { data: autoRuns } = await supabaseAdmin
    .from('automation_runs')
    .select('run_units')
    .eq('user_id', userId);
  
  const totalAutoRuns = autoRuns?.reduce((acc: number, row: any) => acc + (row.run_units || 0), 0) || 0;

  // Real active systems count
  const { data: activeSys } = await supabaseAdmin
    .from('user_automations')
    .select('id')
    .eq('user_id', userId)
    .eq('is_enabled', true);

  return {
    voiceMinutes: totalVoice,
    automationRuns: totalAutoRuns,
    activeSystemsCount: activeSys?.length || 0
  };
}

export async function getRecentActivityLogs() {
  const userId = CURRENT_USER_ID;

  const { data: logs } = await supabaseAdmin
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return logs || [];
}

export async function getRealPlans() {
  const { data: plans, error } = await supabaseAdmin.from('plans').select('*').eq('is_active', true);
  if (error) {
    console.error("Error fetching plans:", error);
    return [];
  }
  return plans || [];
}

export async function getRealWorkspace() {
  const userId = CURRENT_USER_ID;
  const { data: user, error: userError } = await supabaseAdmin.from('users').select('*, plans(*)').eq('id', userId).single();
  
  if (userError || !user) {
    console.error("Error fetching user:", userError);
    return null;
  }

  // Fetch real usage
  const { data: voiceUsage } = await supabaseAdmin.from('voice_usage').select('minutes_used').eq('user_id', userId);
  const totalVoice = voiceUsage?.reduce((acc: number, row: any) => acc + (row.minutes_used || 0), 0) || 0;

  const { data: userAutomations } = await supabaseAdmin.from('user_automations').select('id').eq('user_id', userId).eq('is_enabled', true);
  const activeAutomations = userAutomations?.length || 0;

  const { data: usageData } = await supabaseAdmin.from('usage').select('feature_key, used_quantity').eq('user_id', userId);
  const totalEmails = usageData?.filter((r: any) => r.feature_key === 'emails').reduce((acc: number, row: any) => acc + (row.used_quantity || 0), 0) || 0;
  const totalCredits = usageData?.filter((r: any) => r.feature_key === 'credits').reduce((acc: number, row: any) => acc + (row.used_quantity || 0), 0) || 0;

  return {
    workspace: {
      id: userId,
      name: user.email,
      planId: user.plan_id,
      usage: {
        activeAutomations,
        voiceMinutes: totalVoice,
        emailSent: totalEmails,
        credits: totalCredits
      }
    },
    plan: user.plans
  };
}

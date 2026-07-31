"use server";

import { createClient } from "../supabase/server";

export async function getRealSystems() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch automations for user
  const { data: userAutomations } = await supabase
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
    .eq('user_id', user.id);

  return userAutomations || [];
}

export async function getDashboardStats(dateRange: string = "7d") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Real voice usage
  const { data: voiceUsage } = await supabase
    .from('voice_usage')
    .select('minutes_used')
    .eq('user_id', user.id);
  
  const totalVoice = voiceUsage?.reduce((acc: number, row: any) => acc + (row.minutes_used || 0), 0) || 0;

  // Real automation runs
  const { data: autoRuns } = await supabase
    .from('automation_runs')
    .select('run_units')
    .eq('user_id', user.id);
  
  const totalAutoRuns = autoRuns?.reduce((acc: number, row: any) => acc + (row.run_units || 0), 0) || 0;

  // Real active systems count
  const { data: activeSys } = await supabase
    .from('user_automations')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_enabled', true);

  return {
    voiceMinutes: totalVoice,
    automationRuns: totalAutoRuns,
    activeSystemsCount: activeSys?.length || 0
  };
}

export async function getRecentActivityLogs() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return logs || [];
}

export async function getRealPlans() {
  const supabase = await createClient();
  const { data: plans, error } = await supabase.from('plans').select('*').eq('is_active', true);
  if (error) {
    console.error("Error fetching plans:", error);
    return [];
  }
  return plans || [];
}

export async function getRealWorkspace() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;
  
  const { data: user, error: userError } = await supabase.from('users').select('*, plans(*)').eq('id', authUser.id).single();
  
  if (userError || !user) {
    console.error("Error fetching user:", userError);
    return null;
  }

  // Fetch real usage
  const { data: voiceUsage } = await supabase.from('voice_usage').select('minutes_used').eq('user_id', authUser.id);
  const totalVoice = voiceUsage?.reduce((acc: number, row: any) => acc + (row.minutes_used || 0), 0) || 0;

  const { data: userAutomations } = await supabase.from('user_automations').select('id').eq('user_id', authUser.id).eq('is_enabled', true);
  const activeAutomations = userAutomations?.length || 0;

  const { data: usageData } = await supabase.from('usage').select('feature_key, used_quantity').eq('user_id', authUser.id);
  const totalEmails = usageData?.filter((r: any) => r.feature_key === 'emails').reduce((acc: number, row: any) => acc + (row.used_quantity || 0), 0) || 0;
  const totalCredits = usageData?.filter((r: any) => r.feature_key === 'credits').reduce((acc: number, row: any) => acc + (row.used_quantity || 0), 0) || 0;

  return {
    workspace: {
      id: authUser.id,
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

"use server";

import { createClient } from "../supabase/server";

export async function getRealSystems() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: catalog }, { data: activations }] = await Promise.all([
    supabase
      .from('systems_catalog')
      .select('id, name, tier, description, icon_name, complexity')
      .order('tier', { ascending: true }),
    supabase
      .from('user_systems')
      .select('system_id, is_enabled, activated_at')
      .eq('user_id', user.id),
  ]);

  const activationBySystemId = new Map((activations || []).map((a) => [a.system_id, a]));

  return (catalog || []).map((s) => {
    const activation = activationBySystemId.get(s.id);
    return {
      id: s.id,
      name: s.name,
      tier: s.tier,
      description: s.description,
      iconName: s.icon_name,
      complexity: s.complexity,
      isEnabled: Boolean(activation?.is_enabled),
      activatedAt: activation?.activated_at || null,
    };
  });
}

export async function toggleSystemActivation(systemId: string, enable: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: userRow } = await supabase
    .from('users')
    .select('credits_locked')
    .eq('id', user.id)
    .maybeSingle();

  if (enable && userRow?.credits_locked) {
    return { error: "locked" };
  }

  const { error } = await supabase
    .from('user_systems')
    .upsert(
      {
        user_id: user.id,
        system_id: systemId,
        is_enabled: enable,
        activated_at: enable ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id,system_id' }
    );

  if (error) return { error: error.message };
  return { success: true };
}

export async function getDashboardStats(dateRange: string = "7d") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Real voice usage
  const { data: voiceUsage } = await supabase
    .from('voice_usage')
    .select('minutes_used, seconds_used')
    .eq('user_id', user.id);
  
  // Stored as exact seconds; show whole minutes only (rows from before the switch fall back to minutes * 60).
  const totalVoice = Math.floor((voiceUsage?.reduce((acc: number, row: any) => acc + (row.seconds_used > 0 ? row.seconds_used : (row.minutes_used || 0) * 60), 0) || 0) / 60);

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

  // ---- Performance metrics (leads, appointments, saved calls, revenue) ----
  // Counted for the selected period, with the previous period of the same length
  // as the baseline for the trend. dateRange "all" = all-time, no trends.
  const perf = await getPerformanceStats(supabase, user.id, dateRange);

  return {
    voiceMinutes: totalVoice,
    automationRuns: totalAutoRuns,
    activeSystemsCount: activeSys?.length || 0,
    ...perf
  };
}

function rangeToMs(range: string): number | null {
  if (range === "all") return null;
  const m = /^(\d+)(h|d)$/.exec(range);
  if (!m) return 7 * 86_400_000;
  return Number(m[1]) * (m[2] === "h" ? 3_600_000 : 86_400_000);
}

// Percent change vs the previous period. null when there is no baseline (previous = 0).
function pctChange(cur: number, prev: number): number | null {
  if (!(prev > 0)) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

async function getPerformanceStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  dateRange: string
) {
  const now = Date.now();
  const span = rangeToMs(dateRange);
  const curStart = span ? now - span : 0;
  const prevStart = span ? now - 2 * span : 0;
  const lookback = span ? new Date(prevStart).toISOString() : null;
  const inCur = (iso: string | null | undefined) => {
    const t = iso ? Date.parse(iso) : NaN;
    return !Number.isNaN(t) && t >= curStart && t <= now;
  };
  const inPrev = (iso: string | null | undefined) => {
    if (!span) return false;
    const t = iso ? Date.parse(iso) : NaN;
    return !Number.isNaN(t) && t >= prevStart && t < curStart;
  };

  // Leads: qualified (qualified or won) and appointment booked, by last update.
  let leadsQ = supabase
    .from("leads")
    .select("status, appointment_booked, updated_at, source, source_call_id, created_at")
    .eq("user_id", userId)
    .range(0, 9999);
  if (lookback) leadsQ = leadsQ.gte("updated_at", lookback);
  const { data: leads } = await leadsQ;

  // Calls: saved = ended booked or escalated, or captured a lead.
  let callsQ = supabase
    .from("call_transcripts")
    .select("call_id, outcome, created_at")
    .eq("user_id", userId)
    .range(0, 9999);
  if (lookback) callsQ = callsQ.gte("created_at", lookback);
  const { data: calls } = await callsQ;

  // Appointments for revenue: date passed, not cancelled.
  let remQ = supabase
    .from("reminders")
    .select("appointment_type, appointment_start, confirmation_status")
    .eq("user_id", userId)
    .lte("appointment_start", new Date(now).toISOString())
    .range(0, 9999);
  if (lookback) remQ = remQ.gte("appointment_start", lookback);
  const { data: reminders } = await remQ;

  // Upcoming appointments booked in the period and not cancelled = revenue protected.
  const { data: upcoming } = await supabase
    .from("reminders")
    .select("appointment_type, appointment_start, confirmation_status, created_at")
    .eq("user_id", userId)
    .gt("appointment_start", new Date(now).toISOString())
    .range(0, 9999);

  // Failed follow-ups = emails that failed to send + SMS that failed.
  let failEmailQ = supabase.from("emails").select("created_at").eq("user_id", userId).eq("status", "failed").range(0, 9999);
  let failSmsQ = supabase.from("sms_messages").select("created_at").eq("user_id", userId).eq("direction", "outbound").eq("status", "failed").range(0, 9999);
  if (lookback) { failEmailQ = failEmailQ.gte("created_at", lookback); failSmsQ = failSmsQ.gte("created_at", lookback); }
  const [{ data: failedEmails }, { data: failedSms }] = await Promise.all([failEmailQ, failSmsQ]);

  // Price list (agent_configs.services). Tolerates the column not existing yet.
  const cfg = await supabase.from("agent_configs").select("*").eq("user_id", userId).maybeSingle();
  const services: { name: string; price: number }[] = (Array.isArray((cfg.data as any)?.services) ? (cfg.data as any).services : [])
    .map((x: any) => ({ name: String(x?.name || "").trim().toLowerCase(), price: Number(x?.price) || 0 }))
    .filter((x: any) => x.name);
  const priceFor = (type: string | null): number | null => {
    const t = (type || "").trim().toLowerCase();
    if (!t) return null;
    const hit = services.find((x) => x.name === t) || services.find((x) => t.includes(x.name) || x.name.includes(t));
    return hit ? hit.price : null;
  };

  let qualCur = 0, qualPrev = 0, apptCur = 0, apptPrev = 0;
  for (const l of leads || []) {
    const qualified = l.status === "qualified" || l.status === "won";
    if (inCur(l.updated_at)) { if (qualified) qualCur++; if (l.appointment_booked) apptCur++; }
    else if (inPrev(l.updated_at)) { if (qualified) qualPrev++; if (l.appointment_booked) apptPrev++; }
  }

  const savedCur = new Set<string>();
  const savedPrev = new Set<string>();
  for (const c of calls || []) {
    if (c.outcome === "booked" || c.outcome === "escalated") {
      if (inCur(c.created_at)) savedCur.add(c.call_id); else if (inPrev(c.created_at)) savedPrev.add(c.call_id);
    }
  }
  for (const l of leads || []) {
    if (l.source !== "inbound_call" || !l.source_call_id) continue;
    if (inCur(l.created_at)) savedCur.add(l.source_call_id); else if (inPrev(l.created_at)) savedPrev.add(l.source_call_id);
  }

  let revCur = 0, revPrev = 0, unpriced = 0;
  for (const r of reminders || []) {
    if (r.confirmation_status === "cancelled") continue;
    const price = priceFor(r.appointment_type);
    if (inCur(r.appointment_start)) { if (price === null) unpriced++; else revCur += price; }
    else if (inPrev(r.appointment_start)) { if (price !== null) revPrev += price; }
  }

  let protCur = 0;
  for (const r of upcoming || []) {
    if (r.confirmation_status === "cancelled" || !inCur(r.created_at)) continue;
    const price = priceFor(r.appointment_type);
    if (price !== null) protCur += price;
  }

  let failCur = 0, failPrev = 0;
  for (const f of [...(failedEmails || []), ...(failedSms || [])]) {
    if (inCur(f.created_at)) failCur++; else if (inPrev(f.created_at)) failPrev++;
  }

  return {
    revenueProtected: Math.round(protCur * 100) / 100,
    failedFollowups: failCur,
    qualifiedLeads: qualCur,
    appointmentsBooked: apptCur,
    callsSaved: savedCur.size,
    revenueInfluenced: Math.round(revCur * 100) / 100,
    unpricedAppointments: unpriced,
    trends: {
      qualifiedLeads: pctChange(qualCur, qualPrev),
      appointmentsBooked: pctChange(apptCur, apptPrev),
      callsSaved: pctChange(savedCur.size, savedPrev.size),
      revenueInfluenced: pctChange(revCur, revPrev),
      failedFollowups: pctChange(failCur, failPrev),
      // Protected value is a forward-looking snapshot, so it has no previous-period baseline.
      revenueProtected: null as number | null,
    },
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
  const { data: plans, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true);
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
  const { data: voiceUsage } = await supabase.from('voice_usage').select('minutes_used, seconds_used').eq('user_id', authUser.id);
  // Stored as exact seconds; show whole minutes only (rows from before the switch fall back to minutes * 60).
  const totalVoice = Math.floor((voiceUsage?.reduce((acc: number, row: any) => acc + (row.seconds_used > 0 ? row.seconds_used : (row.minutes_used || 0) * 60), 0) || 0) / 60);

  const { data: userAutomations } = await supabase.from('user_automations').select('id').eq('user_id', authUser.id).eq('is_enabled', true);
  const activeAutomations = userAutomations?.length || 0;

  const { data: usageData } = await supabase.from('usage').select('feature_key, used_quantity').eq('user_id', authUser.id);
  const totalEmails = usageData?.filter((r: any) => r.feature_key === 'emails').reduce((acc: number, row: any) => acc + (row.used_quantity || 0), 0) || 0;
  const totalCredits = usageData?.filter((r: any) => r.feature_key === 'credits').reduce((acc: number, row: any) => acc + (row.used_quantity || 0), 0) || 0;

  // Partner bonus minutes/credits are added on top of the plan limits.
  const { data: effRows } = await supabase.rpc('get_effective_limits', { p_user_id: authUser.id });
  const eff = Array.isArray(effRows) ? effRows[0] : effRows;
  const basePlan: any = user.plans;
  const plan = basePlan && eff
    ? {
        ...basePlan,
        limit_voice_minutes: eff.limit_voice_minutes,
        limit_credits: eff.limit_credits,
        bonus_voice_minutes: eff.bonus_voice_minutes,
        bonus_credits: eff.bonus_credits,
      }
    : basePlan;

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
    plan
  };
}

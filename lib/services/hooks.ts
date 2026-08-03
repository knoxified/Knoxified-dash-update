"use client";
import { createClient } from "@/lib/supabase/client";

import { useEffect, useState } from "react";
import { DataService, System, Automation, DashboardMetrics, Plan, SystemLog } from "./data";

// These hooks obscure the data source (mock vs. real backend)
export function useSystems() {
  const [data, setData] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.getSystems().then((systems) => {
      setData(systems);
      setLoading(false);
    });
  }, []);

  return { data, loading, setData }; // exported setData for optimistic updates mock
}

export function useAutomations() {
  const [data, setData] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.getAutomations().then((automations) => {
      setData(automations);
      setLoading(false);
    });
  }, []);

  return { data, loading, setData };
}


export function useDashboardMetrics(dateRange: string = "7d") {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevDateRange, setPrevDateRange] = useState(dateRange);

  if (dateRange !== prevDateRange) {
    setPrevDateRange(dateRange);
    setLoading(true);
  }

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();
    let currentUserId: string | null = null;

    const fetchRealtimeMetrics = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const defaultMetrics = await DataService.getDashboardMetrics(dateRange);

        if (!user) {
          if (isMounted) {
            setData(defaultMetrics);
            setLoading(false);
          }
          return;
        }

        currentUserId = user.id;

        // Use public.users to get plan_id and join with public.plans
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('plan_id, plans(limit_voice_minutes, limit_credits)')
          .eq('id', user.id)
          .single();

        let limitVoice = 1000;
        let limitCredits = 5000;

        if (userData?.plans) {
          // Type cast because Supabase might return it as array or object depending on relation
          const plans = Array.isArray(userData.plans) ? userData.plans[0] : userData.plans;
          if (plans) {
            limitVoice = plans.limit_voice_minutes || limitVoice;
            limitCredits = plans.limit_credits || limitCredits;
          }
        }

        // Calculate current usage by summing minutes_used from public.voice_usage
        const { data: voiceUsage } = await supabase
          .from('voice_usage')
          .select('minutes_used')
          .eq('user_id', user.id);
        const totalVoice = voiceUsage?.reduce((acc: number, row: any) => acc + (row.minutes_used || 0), 0) || 0;

        // Calculate current usage by summing run_units from public.automation_runs
        const { data: autoRuns } = await supabase
          .from('automation_runs')
          .select('run_units')
          .eq('user_id', user.id);
        const totalAutoRuns = autoRuns?.reduce((acc: number, row: any) => acc + (row.run_units || 0), 0) || 0;

        // active systems
        const { data: activeSys } = await supabase
          .from('user_automations')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_enabled', true);
        const totalActiveSys = activeSys?.length || 0;

        if (isMounted) {
          setData({
            ...defaultMetrics,
            totalActiveSystems: totalActiveSys,
            totalActiveAutomations: totalAutoRuns,
            voiceUsage: { ...defaultMetrics.voiceUsage, used: totalVoice, total: limitVoice },
            // credits or other limits could be applied to other metrics here if needed
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching realtime metrics:", err);
      }
    };

    fetchRealtimeMetrics();

    // Ensure the UI updates instantly when a new row is added to voice_usage
    const channel = supabase.channel('voice_usage_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voice_usage'
        },
        (payload) => {
          if (payload.new && payload.new.user_id === currentUserId) {
            fetchRealtimeMetrics();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [dateRange]);

  return { data, loading };
}

export function useWorkspace() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.getWorkspace().then((ws) => {
      setData(ws);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}

export function usePlans() {
  const [data, setData] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.getPlans().then((plans) => {
      setData(plans);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}

export function useSystemLogs() {
  const [data, setData] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.getSystemLogs().then((logs) => {
      setData(logs);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}

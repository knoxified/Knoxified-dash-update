import { getRealSystems, getDashboardStats, getRealWorkspace, getRealPlans, getRecentActivityLogs } from '../actions/dashboard-actions';
import { System } from "@/data/systems";
import { Automation } from "@/data/automations";

export { type System, type Automation };

export interface Plan {
  id: string;
  name: string;
  price: string | number | null;
  currency?: string;
  flutterwave_plan_id?: number | string | null;
  flutterwave_plan_token?: string | null;
  paddle_price_id?: string;
  paddle_product_id?: string;
  features?: any;
  trial_duration_days?: number;
  limit_voice_minutes?: number | null;
  limit_email_sent?: number | null;
  limit_active_automations?: number | null;
  limit_credits?: number | null;
  is_active?: boolean;
  billing_interval?: string;
  annual_discount_percent?: number;
  price_type?: string;
  credit_overage_allowed?: boolean;
  credit_warning_80_percent?: boolean;
  credit_warning_95_percent?: boolean;
  
  // Legacy UI fields for display matching
  voiceMinutes?: string;
  automationSlots?: string;
  keyRestrictions?: string;
}

export interface SystemLog {
  id: string;
  type: 'automation' | 'system' | 'billing' | 'lead';
  message: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalActiveSystems: number;
  totalActiveAutomations: number;
  overallPerformance: number;
  voiceUsage: { used: number; total: number; unit: string };
  emailUsage: { used: number; total: number; unit: string };
  chatUsage: { used: number; total: number; unit: string };
  planStatus: string;
  volumeActivity: Array<{ name: string; calls: number; emails: number; chats: number }>;
  revenueInfluenced: number;
  revenueProtected: number;
  appointmentsBooked: number;
  qualifiedLeads: number;
  winsFeed: Array<{ id: string; system: string; message: string; timestamp: string; timeAgo: string }>;
  revenueGenerated: number;
  revenueRecovered: number;
  pipelineValue: number;
  conversionRate: number;
  missedOpportunityReduction: number;
  failedFollowups: number;
}

export interface Workspace {
  id: string;
  name: string;
  planId: string;
  usage: {
    activeAutomations: number;
    voiceMinutes: number;
    emailSent: number;
    credits: number;
  }
}

export class DataService {
  static async getSystems(): Promise<System[]> {
    try {
            const realSys = await getRealSystems();
      if (realSys && realSys.length > 0) {
        return realSys.map((s: any) => ({
          id: s.id,
          name: s.automation_catalog?.name || 'System',
          status: s.is_enabled ? 'Active' : 'Offline',
          revenueImpact: 0,
          currentActivity: s.automation_catalog?.description || 'Active automation',
          tier: 'Pro',
          description: s.automation_catalog?.description || 'Automated System'
        }));
      }
    } catch (e) {
      console.error("Could not fetch real systems, falling back to static:", e);
    }
    const { SYSTEMS } = await import('@/data/systems');
    return SYSTEMS;
  }

  static async getAutomations(): Promise<Automation[]> {
    const { AUTOMATIONS } = await import('@/data/automations');
    return AUTOMATIONS;
  }

  static async getDashboardMetrics(dateRange: string = "7d"): Promise<DashboardMetrics> {
    const defaultData: DashboardMetrics = {
      totalActiveSystems: 0,
      totalActiveAutomations: 0,
      overallPerformance: 0,
      voiceUsage: { used: 0, total: 1000, unit: "mins" },
      emailUsage: { used: 0, total: 5000, unit: "emails" },
      chatUsage: { used: 0, total: 500, unit: "chats" },
      planStatus: "N/A",
      volumeActivity: [],
      revenueInfluenced: 0,
      revenueProtected: 0,
      appointmentsBooked: 0,
      qualifiedLeads: 0,
      winsFeed: [],
      revenueGenerated: 0,
      revenueRecovered: 0,
      pipelineValue: 0,
      conversionRate: 0,
      missedOpportunityReduction: 0,
      failedFollowups: 0,
    };

    try {
            const realStats = await getDashboardStats(dateRange);
      if (realStats) {
        defaultData.voiceUsage.used = realStats.voiceMinutes;
        defaultData.totalActiveSystems = realStats.activeSystemsCount;
        defaultData.totalActiveAutomations = realStats.automationRuns;
      }
    } catch (error) {
      console.error("Could not fetch real dashboard stats:", error);
    }

    return defaultData;
  }

  static async getWorkspace(): Promise<{ workspace: Workspace | null, plan: Plan | undefined }> {
    try {
            const realWs = await getRealWorkspace();
      if (realWs) {
        return {
           workspace: {
             id: realWs.workspace.id,
             name: realWs.workspace.name,
             planId: realWs.workspace.planId,
             usage: realWs.workspace.usage
           },
           plan: {
             id: realWs.plan.id,
             name: realWs.plan.name,
             price: realWs.plan.paddle_price_id ? "Paid" : (realWs.plan.name.includes("Trial") ? "Free" : "Custom"),
             price_type: realWs.plan.price_type || "recurring",
             limit_credits: realWs.plan.limit_credits,
             limit_voice_minutes: realWs.plan.limit_voice_minutes,
             limit_email_sent: realWs.plan.limit_email_sent,
             limit_active_automations: realWs.plan.limit_active_automations,
             credit_overage_allowed: realWs.plan.credit_overage_allowed,
             credit_warning_80_percent: realWs.plan.credit_warning_80_percent,
             credit_warning_95_percent: realWs.plan.credit_warning_95_percent,
             keyRestrictions: realWs.plan.features ? Object.keys(realWs.plan.features).join(', ') : "Standard Features",
             billing_interval: realWs.plan.billing_interval
           }
        };
      }
    } catch (e) {
      console.error("Could not fetch real workspace:", e);
    }

    return { workspace: null, plan: undefined };
  }

  static async getPlans(): Promise<Plan[]> {
    try {
            const realPlans = await getRealPlans();
      if (realPlans && realPlans.length > 0) {
        return realPlans.map((p: any) => ({
             id: p.id,
             name: p.name,
             price: p.price,
             currency: p.currency,
             flutterwave_plan_id: p.flutterwave_plan_id,
             flutterwave_plan_token: p.flutterwave_plan_token,
             price_type: p.price_type || "recurring",
             limit_credits: p.limit_credits,
             limit_voice_minutes: p.limit_voice_minutes,
             limit_email_sent: p.limit_email_sent,
             limit_active_automations: p.limit_active_automations,
             credit_overage_allowed: p.credit_overage_allowed,
             credit_warning_80_percent: p.credit_warning_80_percent,
             credit_warning_95_percent: p.credit_warning_95_percent,
             keyRestrictions: p.features ? Object.keys(p.features).join(', ') : "Standard Features",
             billing_interval: p.billing_interval
        }));
      }
    } catch (e) {
      console.error("Could not fetch real plans:", e);
    }
    return [];
  }

  static async getSystemLogs(): Promise<SystemLog[]> {
    try {
            const realLogs = await getRecentActivityLogs();
      if (realLogs && realLogs.length > 0) {
        return realLogs.map((log: any) => ({
          id: log.id,
          type: log.entity_type || 'system',
          message: log.action || 'System event recorded',
          timestamp: new Date(log.created_at).toLocaleTimeString()
        }));
      }
    } catch (e) {
      console.error("Could not fetch real logs:", e);
    }
    return [];
  }
}


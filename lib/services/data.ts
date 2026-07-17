import { System, SYSTEMS } from "@/data/systems";
import { Automation, AUTOMATIONS } from "@/data/automations";

export { type System, type Automation };

export interface Plan {
  id: string;
  name: string;
  price: string;
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
  overallPerformance: number; // percentage
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

export const PLANS: Plan[] = [
  {
    id: "88bfb75f-7d4d-4c64-9cb9-500f313c3bbb",
    name: "Trial Package",
    price_type: "recurring",
    price: "Free",
    limit_credits: 0,
    limit_voice_minutes: 5,
    limit_email_sent: null,
    limit_active_automations: 1,
    credit_overage_allowed: false,
    credit_warning_80_percent: true,
    credit_warning_95_percent: true
  },
  {
    id: "1bbc81b4-5d1c-406a-acb9-a74087b40568",
    name: "Starter (Monthly)",
    price_type: "recurring",
    price: "$247/mo",
    limit_credits: 0,
    limit_voice_minutes: 250,
    limit_email_sent: null,
    limit_active_automations: 1,
    credit_overage_allowed: false,
    credit_warning_80_percent: true,
    credit_warning_95_percent: true
  },
  {
    id: "4c40ad73-67e5-4a6e-b52b-dc544bf22d77",
    name: "Starter (Annual)",
    price_type: "recurring",
    price: "~$2,370/yr",
    limit_credits: 0,
    limit_voice_minutes: 250,
    limit_email_sent: null,
    limit_active_automations: 1,
    credit_overage_allowed: false,
    credit_warning_80_percent: true,
    credit_warning_95_percent: true
  },
  {
    id: "f8c4312f-f537-450c-8fa4-1d72c6d4e8e3",
    name: "Pro (Monthly)",
    price_type: "recurring",
    price: "$697/mo",
    limit_credits: 0,
    limit_voice_minutes: 1000,
    limit_email_sent: null,
    limit_active_automations: 3,
    credit_overage_allowed: false,
    credit_warning_80_percent: true,
    credit_warning_95_percent: true
  },
  {
    id: "c4e32a66-d837-4397-9eaf-80a39e1b5969",
    name: "Pro (Annual)",
    price_type: "recurring",
    price: "~$6,690/yr",
    limit_credits: 0,
    limit_voice_minutes: 1000,
    limit_email_sent: null,
    limit_active_automations: 3,
    credit_overage_allowed: false,
    credit_warning_80_percent: true,
    credit_warning_95_percent: true
  },
  {
    id: "2c7dbabb-c188-444e-8647-499cb1e4852b",
    name: "Enterprise (Monthly)",
    price_type: "recurring",
    price: "$2,497/mo",
    limit_credits: 0,
    limit_voice_minutes: 5500,
    limit_email_sent: null,
    limit_active_automations: 8,
    credit_overage_allowed: false,
    credit_warning_80_percent: true,
    credit_warning_95_percent: true
  },
  {
    id: "09870305-7f7b-4a48-9ce9-b1e9847da38f",
    name: "Enterprise (Annual)",
    price_type: "recurring",
    price: "~$23,970/yr",
    limit_credits: 0,
    limit_voice_minutes: 5500,
    limit_email_sent: null,
    limit_active_automations: 8,
    credit_overage_allowed: false,
    credit_warning_80_percent: true,
    credit_warning_95_percent: true
  },
  {
    id: "d35ea83d-6268-4a06-a082-20ef72eada99",
    name: "Custom",
    price_type: "recurring",
    price: "Custom",
    limit_credits: 0,
    limit_voice_minutes: null,
    limit_email_sent: null,
    limit_active_automations: null,
    credit_overage_allowed: false,
    credit_warning_80_percent: true,
    credit_warning_95_percent: true
  }
];

export const MOCK_METRICS: DashboardMetrics = {
  totalActiveSystems: 3,
  totalActiveAutomations: 3,
  overallPerformance: 98.4,
  voiceUsage: { used: 320, total: 1000, unit: "mins" },
  emailUsage: { used: 1240, total: 5000, unit: "emails" },
  chatUsage: { used: 84, total: 500, unit: "chats" },
  planStatus: "Pro (Monthly)",
  volumeActivity: [
    { name: "Mon", calls: 40, emails: 240, chats: 24 },
    { name: "Tue", calls: 30, emails: 139, chats: 22 },
    { name: "Wed", calls: 50, emails: 380, chats: 29 },
    { name: "Thu", calls: 45, emails: 390, chats: 20 },
    { name: "Fri", calls: 60, emails: 480, chats: 21 },
    { name: "Sat", calls: 55, emails: 380, chats: 25 },
    { name: "Sun", calls: 70, emails: 430, chats: 21 },
  ],
  revenueInfluenced: 128450,
  revenueProtected: 34200,
  appointmentsBooked: 142,
  qualifiedLeads: 485,
  winsFeed: [
    { id: "win-1", system: "Real Estate System", message: "booked a viewing for 42 Market St", timestamp: "10:42 AM", timeAgo: "12m ago" },
    { id: "win-2", system: "Dental System", message: "recovered a missed call and booked cleaning", timestamp: "10:15 AM", timeAgo: "39m ago" },
    { id: "win-3", system: "Recruitment System", message: "qualified candidate score 9/10", timestamp: "09:30 AM", timeAgo: "1h ago" },
    { id: "win-4", system: "ReminderBot", message: "prevented a no-show, saving $450", timestamp: "08:45 AM", timeAgo: "2h ago" },
    { id: "win-5", system: "LeadReach", message: "enriched 47 leads with verified data", timestamp: "08:10 AM", timeAgo: "2.5h ago" },
    { id: "win-6", system: "MailCraft", message: "generated 18 new sequences", timestamp: "07:05 AM", timeAgo: "3.5h ago" },
  ],
  revenueGenerated: 94250,
  revenueRecovered: 18500,
  pipelineValue: 345000,
  conversionRate: 18.4,
  missedOpportunityReduction: 42.5,
  failedFollowups: 2,
};

export const MOCK_SYSTEM_LOGS: SystemLog[] = [
  { id: "log-1", type: "automation", message: "WaitlistBot sequenced 14 new onboarding emails", timestamp: "2 mins ago" },
  { id: "log-2", type: "system", message: "Outbound Voice Agent Engine completed 45-minute call batch", timestamp: "15 mins ago" },
  { id: "log-3", type: "lead", message: "Sales Agent qualified 3 new high-intent inbound leads", timestamp: "1 hour ago" },
  { id: "log-4", type: "automation", message: "AdPilot reallocated $1,200 campaign budget based on ROAS", timestamp: "3 hours ago" },
  { id: "log-5", type: "system", message: "Internal Knowledge OS synced 12 new handbook PDFs", timestamp: "5 hours ago" },
];

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

export const CURRENT_WORKSPACE: Workspace = {
  id: 'ws-mock-42',
  name: "Knoxified OS",
  planId: "f8c4312f-f537-450c-8fa4-1d72c6d4e8e3", // Maps to Pro (Monthly)
  usage: {
    activeAutomations: 3,
    voiceMinutes: 320,
    emailSent: 1240,
    credits: 0
  }
};

export class DataService {
  static async getSystems(): Promise<System[]> {
    try {
      const { getRealSystems } = await import('../actions/dashboard-actions');
      const realSys = await getRealSystems();
      if (realSys && realSys.length > 0) {
        return realSys.map((s: any) => ({
          id: s.id,
          name: s.automation_catalog?.name || 'System',
          status: s.is_enabled ? 'Active' : 'Paused',
          revenueImpact: 0,
          currentActivity: s.automation_catalog?.description || 'Active automation'
        }));
      }
    } catch (e) {
      console.warn("Could not fetch real systems:", e);
    }
    return Promise.resolve([...SYSTEMS]);
  }

  static async getAutomations(): Promise<Automation[]> {
    return Promise.resolve([...AUTOMATIONS]);
  }

  static async getDashboardMetrics(dateRange: string = "7d"): Promise<DashboardMetrics> {
    const defaultData = { ...MOCK_METRICS };
    let factor = 1;

    switch (dateRange) {
      case "24h": factor = 0.15; break;
      case "30d": factor = 4.2; break;
      case "90d": factor = 12.5; break;
      case "7d":
      default: factor = 1; break;
    }

    try {
      const { getDashboardStats } = await import('../actions/dashboard-actions');
      const realStats = await getDashboardStats(dateRange);
      if (realStats && (realStats.voiceMinutes > 0 || realStats.activeSystemsCount > 0)) {
        defaultData.voiceUsage.used = realStats.voiceMinutes;
        defaultData.totalActiveSystems = realStats.activeSystemsCount;
        defaultData.totalActiveAutomations = realStats.automationRuns;
      }
    } catch (error) {
      console.warn("Could not fetch real dashboard stats:", error);
    }

    return Promise.resolve({
      ...defaultData,
      voiceUsage: { ...defaultData.voiceUsage, used: Math.round(defaultData.voiceUsage.used * factor) },
      emailUsage: { ...defaultData.emailUsage, used: Math.round(defaultData.emailUsage.used * factor) },
      chatUsage: { ...defaultData.chatUsage, used: Math.round(defaultData.chatUsage.used * factor) },
      volumeActivity: defaultData.volumeActivity.map(item => ({
        ...item,
        calls: Math.round(item.calls * factor),
        emails: Math.round(item.emails * factor),
        chats: Math.round(item.chats * factor)
      })),
      revenueInfluenced: Math.round(defaultData.revenueInfluenced * factor),
      revenueProtected: Math.round(defaultData.revenueProtected * factor),
      appointmentsBooked: Math.round(defaultData.appointmentsBooked * factor),
      qualifiedLeads: Math.round(defaultData.qualifiedLeads * factor),
      revenueGenerated: Math.round(defaultData.revenueGenerated * factor),
      revenueRecovered: Math.round(defaultData.revenueRecovered * factor),
      pipelineValue: Math.round(defaultData.pipelineValue * factor),
      failedFollowups: Math.round(defaultData.failedFollowups * factor),
    });
  }

  static async getWorkspace(): Promise<{ workspace: Workspace, plan: Plan | undefined }> {
    try {
      const { getRealWorkspace } = await import('../actions/dashboard-actions');
      const realWs = await getRealWorkspace();
      if (realWs) {
        return {
           workspace: {
             id: realWs.workspace.id,
             name: "My Workspace",
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
      console.warn("Could not fetch real workspace:", e);
    }

    const plan = PLANS.find(p => p.id === CURRENT_WORKSPACE.planId);
    return Promise.resolve({ workspace: CURRENT_WORKSPACE, plan });
  }

  static async getPlans(): Promise<Plan[]> {
    try {
      const { getRealPlans } = await import('../actions/dashboard-actions');
      const realPlans = await getRealPlans();
      if (realPlans && realPlans.length > 0) {
        return realPlans.map((p: any) => ({
             id: p.id,
             name: p.name,
             price: p.paddle_price_id ? "Paid" : (p.name.includes("Trial") ? "Free" : "Custom"),
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
      console.warn("Could not fetch real plans:", e);
    }
    return Promise.resolve([...PLANS]);
  }

  static async getSystemLogs(): Promise<SystemLog[]> {
    try {
      const { getRecentActivityLogs } = await import('../actions/dashboard-actions');
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
      console.warn("Could not fetch real logs:", e);
    }
    return Promise.resolve([...MOCK_SYSTEM_LOGS]);
  }
}

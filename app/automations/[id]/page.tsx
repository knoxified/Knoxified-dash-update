"use client";

import { useAutomations } from "@/lib/services/hooks";
import { useParams, useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import LeadReachBoard from "./LeadReachBoard";
import MailCraftBoard from "./MailCraftBoard";
import ScheduleManager from "@/components/ScheduleManager";

export default function AutomationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: automations, loading } = useAutomations();
  const id = params.id as string;
  
  if (loading) {
     return <div className="animate-pulse bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl h-64 w-full"></div>;
  }

  const automation = automations.find(a => a.id === id);

  if (!automation) {
    return <div className="text-slate-900 dark:text-white p-8">Automation not found</div>;
  }

  const nameParts = automation.name.split(" ");
  const possibleEmoji = nameParts[nameParts.length - 1];
  const hasEmojiMatch = /\p{Emoji}/u.test(possibleEmoji);
  const title = hasEmojiMatch ? nameParts.slice(0, -1).join(" ") : automation.name;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <nav className="flex items-center text-sm font-medium mb-4 space-x-2">
          <button 
            onClick={() => router.push('/automations')}
            className="text-slate-500 dark:text-[#888] hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            <Activity size={14} className="mr-1" />
            Automations
          </button>
          <span className="text-slate-300 dark:text-[#444]">/</span>
          <span className="text-slate-900 dark:text-white">{title}</span>
        </nav>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
              {title} Board
            </h1>
            <p className="text-slate-500 dark:text-[#888] text-sm">
              Configure parameters and run {title} manually or via API.
            </p>
          </div>
        </div>
      </div>

      {id === "leadreach" ? (
        <LeadReachBoard />
      ) : id === "mailcraft" ? (
        <MailCraftBoard />
      ) : (
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <Activity size={40} className="text-slate-300 dark:text-slate-700 mb-4" />
          <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{title} Dashboard</h2>
          <p className="text-sm text-slate-500 max-w-md">
            This automation board is currently being provisioned. Custom configuration interfaces will appear here once the system initializes.
          </p>
        </div>
      )}
      <ScheduleManager type="automation" targetId={id} />
    </div>
  );
}

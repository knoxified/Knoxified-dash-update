import { Automation } from "@/data/automations";
import AutomationRunner from "@/components/AutomationRunner";
import { CheckCircle2 } from "lucide-react";

export default function AppointMateBoard({ automation }: { automation: Automation }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-8 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 relative overflow-hidden">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 relative z-10">Role Overview</h3>
          <p className="text-slate-600 dark:text-[#888] text-sm leading-relaxed mb-4 relative z-10">
            A virtual scheduler that protects your time while making booking effortless for clients.
          </p>
          <p className="text-slate-600 dark:text-[#888] text-sm leading-relaxed relative z-10">
            By delegating this specific task to an automation, you remove human error, eliminate delays, and ensure consistent execution at scale.
          </p>
        </div>
        <div className="p-8 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 relative overflow-hidden flex flex-col justify-center">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 relative z-10">📊 Why Businesses Love It</h3>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">Zero double-bookings</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">Optimized calendar density</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">Frictionless scheduling</span>
            </div>
          </div>
        </div>
      </div>
      
      <AutomationRunner automation={automation} />
    </div>
  );
}

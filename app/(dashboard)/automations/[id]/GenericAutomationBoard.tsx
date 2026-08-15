import { Automation } from "@/data/automations";
import AutomationRunner from "@/components/AutomationRunner";
import { CheckCircle2, Info } from "lucide-react";

export default function GenericAutomationBoard({ automation }: { automation: Automation }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="p-8 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 relative overflow-hidden">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 relative z-10 flex items-center gap-2">
            <Info className="w-5 h-5 text-sky-500" />
            Role Overview
          </h3>
          <p className="text-slate-600 dark:text-[#888] text-sm leading-relaxed mb-4 relative z-10">
            {automation.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            {automation.category && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                Category: {automation.category}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <AutomationRunner automation={automation} />
    </div>
  );
}

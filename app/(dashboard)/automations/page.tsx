"use client";
import { Select } from "@/components/ui/Select";

import { useAutomations } from "@/lib/services/hooks";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AutomationsPage() {
  const { data: automations, loading, setData } = useAutomations();
  const router = useRouter();

  const toggleAutomation = (id: string) => {
    setData(prev => 
      prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)
    );
  };

  if (loading) {
     return <div className="animate-pulse bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl h-64 w-full"></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
            Automations
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm">
            Micro-services that run silently in the background of your business.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#888]" size={16} />
          <input 
            type="text" 
            placeholder="Search automations..." 
            className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-sky-600 dark:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all placeholder:text-slate-400 dark:text-[#666]"
          />
        </div>
        <div className="w-48">
          <Select
            value="All Categories"
            onChange={() => {}}
            options={[
              { value: "All Categories", label: "All Categories" },
              { value: "Sales", label: "Sales" },
              { value: "Marketing", label: "Marketing" },
              { value: "Operations", label: "Operations" },
              { value: "Finance", label: "Finance" },
              { value: "Support", label: "Support" },
              { value: "Admin", label: "Admin" }
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {automations.map((aut) => {
          const nameParts = aut.name.split(" ");
          const possibleEmoji = nameParts[nameParts.length - 1];
          const hasEmojiMatch = /\p{Emoji}/u.test(possibleEmoji);
          const icon = hasEmojiMatch ? possibleEmoji : "⚡";
          const title = hasEmojiMatch ? nameParts.slice(0, -1).join(" ") : aut.name;

          return (
            <div 
              key={aut.id} 
              onClick={() => router.push(`/automations/${aut.id}`)}
              className={`cursor-pointer bg-white dark:bg-[#0F172A] border rounded-xl p-6 flex flex-col hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 ${aut.enabled ? 'border-sky-300 dark:border-[#00E5FF]/20 shadow-sm shadow-[#00E5FF]/5' : 'border-slate-200 dark:border-white/5'}`}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 flex items-center justify-center text-lg">
                  {icon}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAutomation(aut.id);
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${aut.enabled ? 'bg-[#00E5FF]' : 'bg-white/10'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${aut.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                </button>
              </div>
              
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">{title}</h3>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${aut.enabled ? 'bg-emerald-100 dark:bg-[#10B981]/10 text-emerald-600 dark:text-[#10B981] border-[#10B981]/20' : 'bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-[#888] border-transparent'}`}>
                    {aut.enabled ? 'Running' : 'Paused'}
                  </span>
                </div>
              </div>
              
              <p className="text-[14px] text-slate-500 dark:text-[#888] leading-relaxed flex-1">
                {aut.description}
              </p>
              
              {aut.enabled && aut.metrics && (
                <div className="mt-5 border-t border-slate-200 dark:border-white/5 pt-4">
                   <div className="grid grid-cols-2 gap-4 mb-4">
                     <div>
                       <div className="text-[11px] text-slate-500 dark:text-[#888] font-medium mb-1">{aut.metrics.label1}</div>
                       <div className="text-sm text-slate-900 dark:text-white font-semibold">{aut.metrics.value1}</div>
                     </div>
                     <div>
                       <div className="text-[11px] text-slate-500 dark:text-[#888] font-medium mb-1">{aut.metrics.label2}</div>
                       <div className="text-sm text-emerald-600 dark:text-[#10B981] font-semibold">{aut.metrics.value2}</div>
                     </div>
                   </div>
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-[#888] font-medium">
                       <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                       Monitoring event streams
                     </div>
                     <button className="text-[12px] font-medium text-sky-600 dark:text-[#00E5FF] hover:text-sky-600 dark:text-[#00E5FF]/80 transition-colors bg-sky-100 dark:bg-[#00E5FF]/10 px-2.5 py-1 rounded">
                       Logs
                     </button>
                   </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}

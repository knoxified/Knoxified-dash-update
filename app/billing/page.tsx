"use client";

import { useState } from "react";
import { CreditCard, Check, Zap, AlertTriangle } from "lucide-react";
import { usePlans, useWorkspace } from "@/lib/services/hooks";

export default function BillingPage() {
  const { data: plans, loading } = usePlans();
  const { data: wsData, loading: wsLoading } = useWorkspace();
  const [isAnnual, setIsAnnual] = useState(false);

  if (loading || wsLoading || !wsData) {
    return <div className="animate-pulse bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl h-64 w-full"></div>;
  }

  const { workspace, plan: currentPlan } = wsData;

  // Filter plans based on toggle and format the name for display
  const displayPlans = plans.filter(p => {
    if (p.name.includes('Trial') || p.name === 'Custom' || p.price === 'Free') return true;
    return isAnnual ? (p.billing_interval === 'year' || p.name.includes('(Annual)')) : (p.billing_interval === 'month' || p.name.includes('(Monthly)'));
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
            Billing & Plans
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm">
            Manage your subscription and usage limits.
          </p>
        </div>
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-lg p-1 inline-flex">
          <button onClick={() => setIsAnnual(false)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${!isAnnual ? 'bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 shadow-sm' : 'text-slate-500 dark:text-[#888] hover:text-slate-900 dark:text-white'}`}>Monthly</button>
          <button onClick={() => setIsAnnual(true)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${isAnnual ? 'bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 shadow-sm' : 'text-slate-500 dark:text-[#888] hover:text-slate-900 dark:text-white'}`}>Annually <span className="text-emerald-600 dark:text-[#10B981] ml-1 text-[11px] font-bold border border-[#10B981]/20 bg-emerald-100 dark:bg-[#10B981]/10 px-1 rounded">-20%</span></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {displayPlans.map(plan => {
          const isCurrent = plan.id === workspace.planId;
          return (
            <div key={plan.id} className={`bg-white dark:bg-[#0F172A] rounded-2xl p-6 flex flex-col relative border hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ${isCurrent ? 'border-sky-600 dark:border-[#00E5FF] shadow-lg shadow-[#00E5FF]/5' : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:border-white/10'}`}>
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00E5FF] text-slate-900 dark:text-white px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                  Current Plan
                </div>
              )}
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">{plan.name.replace(' (Monthly)', '').replace(' (Annual)', '')}</h3>
              <div className="text-[32px] font-bold text-slate-900 dark:text-white tracking-tight mb-2 leading-none">
                {plan.price === "Paid" ? "Paid" : plan.price}
                {plan.price !== "Free" && plan.price !== "Custom" && !plan.price.includes('/') && <span className="text-sm font-normal text-slate-500">/{plan.billing_interval === 'year' ? 'yr' : 'mo'}</span>}
              </div>
              <p className="text-[13px] text-slate-500 dark:text-[#888] mb-6 flex-1">{plan.keyRestrictions}</p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 text-[13px] text-slate-700 dark:text-[#EDEDED]">
                  <Check size={16} className="text-emerald-600 dark:text-[#10B981] shrink-0" />
                  <span>{plan.limit_voice_minutes ? `${plan.limit_voice_minutes.toLocaleString()} voice minutes` : 'Custom voice limits'}</span>
                </div>
                <div className="flex items-start gap-3 text-[13px] text-slate-700 dark:text-[#EDEDED]">
                  <Check size={16} className="text-emerald-600 dark:text-[#10B981] shrink-0" />
                  <span>{plan.limit_email_sent ? `${plan.limit_email_sent.toLocaleString()} email limit` : 'Custom / Unlimited emails'}</span>
                </div>
                <div className="flex items-start gap-3 text-[13px] text-slate-700 dark:text-[#EDEDED]">
                  <Check size={16} className="text-emerald-600 dark:text-[#10B981] shrink-0" />
                  <span>{plan.limit_active_automations ? `${plan.limit_active_automations} active automations` : 'Unlimited automations'}</span>
                </div>
                {plan.credit_overage_allowed && (
                  <div className="flex items-start gap-3 text-[13px] text-slate-700 dark:text-[#EDEDED]">
                    <Check size={16} className="text-emerald-600 dark:text-[#10B981] shrink-0" />
                    <span>Credit overages permitted</span>
                  </div>
                )}
              </div>

              <button className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isCurrent 
                  ? 'bg-transparent border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-200 dark:bg-white/5' 
                  : 'bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-slate-900 dark:text-white border border-transparent'
              }`}>
                {isCurrent ? 'Manage Plan' : 'Upgrade'}
              </button>
            </div>
          )
        })}
      </div>
      
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
        <h4 className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-2 mb-6">
          <Zap className="text-sky-600 dark:text-[#00E5FF] w-5 h-5" />
          Execution Limits & Usage
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 dark:text-[#EDEDED] font-semibold">Active Automations</span>
              <span className="text-slate-500 dark:text-[#888]">{workspace.usage.activeAutomations} / {currentPlan?.limit_active_automations ?? '∞'}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-[#020617] rounded-full overflow-hidden border border-slate-200 dark:border-white/5 relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${currentPlan?.limit_active_automations ? Math.min((workspace.usage.activeAutomations / currentPlan.limit_active_automations) * 100, 100) : 0}%` }}></div>
            </div>
            {currentPlan?.limit_active_automations && workspace.usage.activeAutomations >= currentPlan.limit_active_automations ? (
              <p className="text-xs text-red-600 dark:text-[#EF4444] font-medium flex items-center gap-1.5"><AlertTriangle size={12} /> Limit reached.</p>
            ) : <p className="text-xs text-slate-500 dark:text-[#888]">Agent slots used.</p>}
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 dark:text-[#EDEDED] font-semibold">Voice Minutes</span>
              <span className="text-slate-500 dark:text-[#888]">{workspace.usage.voiceMinutes} / {currentPlan?.limit_voice_minutes?.toLocaleString() ?? '∞'}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-[#020617] rounded-full overflow-hidden border border-slate-200 dark:border-white/5 relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-500 to-[#00E5FF] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,229,255,0.4)]" style={{ width: `${currentPlan?.limit_voice_minutes ? Math.min((workspace.usage.voiceMinutes / currentPlan.limit_voice_minutes) * 100, 100) : 0}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#888]">Outbound and inbound limits.</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 dark:text-[#EDEDED] font-semibold">Email Limits</span>
              <span className="text-slate-500 dark:text-[#888]">{workspace.usage.emailSent.toLocaleString()} / {currentPlan?.limit_email_sent?.toLocaleString() ?? '∞'}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-[#020617] rounded-full overflow-hidden border border-slate-200 dark:border-white/5 relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-[#10B981] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${currentPlan?.limit_email_sent ? Math.min((workspace.usage.emailSent / currentPlan.limit_email_sent) * 100, 100) : 5}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#888]">Sequences and transactional.</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 dark:text-[#EDEDED] font-semibold">AI Credits</span>
              <span className="text-slate-500 dark:text-[#888]">{workspace.usage.credits.toLocaleString()} / {currentPlan?.limit_credits?.toLocaleString() ?? '∞'}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-[#020617] rounded-full overflow-hidden border border-slate-200 dark:border-white/5 relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(168,85,247,0.3)]" style={{ width: `${currentPlan?.limit_credits ? Math.min((workspace.usage.credits / currentPlan.limit_credits) * 100, 100) : 0}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#888]">Used for heavy generative tasks.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 flex items-center justify-between hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-center">
            <CreditCard className="text-slate-500 dark:text-[#888]" size={20} />
          </div>
          <div>
            <h4 className="text-slate-900 dark:text-white font-medium text-sm">Payment Method</h4>
            <p className="text-[13px] text-slate-500 dark:text-[#888] mt-0.5">Visa ending in 4242 &bull; Expires 04/28</p>
          </div>
        </div>
        <button className="text-[13px] font-medium text-sky-600 dark:text-[#00E5FF] hover:text-sky-600 dark:text-[#00E5FF]/80">Update Method</button>
      </div>
    </div>
  );
}

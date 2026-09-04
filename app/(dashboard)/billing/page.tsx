"use client";

import { useState } from "react";
import { CreditCard, Check, Zap, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePlans, useWorkspace } from "@/lib/services/hooks";

// Global glow styles for AI theme
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
      @keyframes pulse-slow {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      .animate-pulse-slow {
        animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      .glow-text {
        text-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
      }
    `
  }} />
);

export default function BillingPage() {
  const { data: plans, loading } = usePlans();
  const { data: wsData, loading: wsLoading } = useWorkspace();
  const [isAnnual, setIsAnnual] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);

  if (loading || wsLoading || !wsData) {
    return <div className="animate-pulse glass-card rounded-xl h-64 w-full"></div>;
  }

  const { workspace, plan: currentPlan } = wsData;

  const formatPrice = (plan: any) => {
    if (plan.price === null || plan.price === undefined) {
      return plan.name === "Custom" ? "Custom" : "Free";
    }
    const amount = Number(plan.price);
    if (Number.isNaN(amount)) return plan.price;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: plan.currency || "USD",
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleUpgrade = async (plan: any) => {
    if (plan.name === "Custom") {
      window.location.href = "mailto:sales@knoxified.org?subject=Enterprise%20Custom%20Plan";
      return;
    }

    if (!plan.flutterwave_plan_id) {
      toast.error("This plan isn't available for checkout yet.");
      return;
    }

    // Open the tab synchronously, tied to this click, so browsers don't
    // block it as a popup once we fill in the URL after the await below.
    // IMPORTANT: passing "noopener" here would make window.open() return
    // null (no reference), leaving us with an orphaned blank tab we can
    // never navigate. Grab a real reference, then sever .opener manually
    // to still prevent reverse-tabnabbing once we point it at Flutterwave.
    const checkoutTab = window.open("", "_blank");
    if (checkoutTab) {
      checkoutTab.opener = null;
    }

    setCheckoutPlanId(plan.id);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        toast.error(data.error || "Couldn't start checkout. Please try again.");
        checkoutTab?.close();
        setCheckoutPlanId(null);
        return;
      }

      if (checkoutTab && !checkoutTab.closed) {
        checkoutTab.location.href = data.url;
      } else {
        // Popup was blocked despite the synchronous open (rare) — fall back
        // to a normal link the browser can't block.
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
      setCheckoutPlanId(null);
    } catch {
      toast.error("Couldn't reach the payment provider. Please try again.");
      checkoutTab?.close();
      setCheckoutPlanId(null);
    }
  };

  // Filter plans based on toggle and format the name for display
  const displayPlans = plans.filter(p => {
    if (p.name.includes('Trial') || p.name === 'Custom' || p.price === 'Free') return true;
    return isAnnual ? (p.billing_interval === 'year' || p.name.includes('(Annual)')) : (p.billing_interval === 'month' || p.name.includes('(Monthly)'));
  });

  // Helper to get feature list for a plan name based on pricing page
  const getPlanFeatures = (planName: string) => {
    switch (planName) {
      case 'Starter':
        return [
          "Inbound Voice Agents",
          "1 Active Automation",
          "250 Mins Inbound Limit",
          "700 Automation Credits",
        ];
      case 'Pro':
        return [
          "Everything in Starter",
          "Customer Communication Tools",
          "3 Active Automations",
          "1,000 Mins (Inbound + Follow-Up)",
          "2,000 Automation Credits",
        ];
      case 'Enterprise':
        return [
          "Everything in Pro",
          "Virtual System Tools",
          "8 Active Automations",
          "5,500 Mins Limits",
          "8,000 Automation Credits",
        ];
      case 'Custom':
        return [
          "Everything in Enterprise",
          "Dedicated Success Manager",
          "Custom AI model training",
          "Bespoke limits",
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <GlobalStyles />

      {/* Header with glowing title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative">
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 relative z-10">
            Billing & Plans
            <span className="absolute -bottom-1 left-0 w-1/3 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-sm opacity-80"></span>
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm">
            Manage your subscription and usage limits.
          </p>
        </div>
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-lg p-1 inline-flex relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 z-0"></div>
          <button onClick={() => setIsAnnual(false)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all relative z-10 ${!isAnnual ? 'bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 shadow-sm' : 'text-slate-500 dark:text-[#888] hover:text-slate-900 dark:text-white'}`}>Monthly</button>
          <button onClick={() => setIsAnnual(true)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all relative z-10 ${isAnnual ? 'bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 shadow-sm' : 'text-slate-500 dark:text-[#888] hover:text-slate-900 dark:text-white'}`}>Annually <span className="text-emerald-600 dark:text-[#10B981] ml-1 text-[11px] font-bold border border-[#10B981]/20 bg-emerald-100 dark:bg-[#10B981]/10 px-1 rounded">-20%</span></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
        {displayPlans.map(plan => {
          const isCurrent = plan.id === workspace?.planId;
          const isPro = plan.name.includes('Pro');
          return (
            <div 
              key={plan.id} 
              className={`rounded-2xl p-6 flex flex-col relative border transition-all duration-500 transform-gpu ${
                isPro 
                  ? 'bg-gradient-to-br from-cyan-900/30 to-blue-900/20 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:shadow-[0_0_40px_rgba(6,182,212,0.25)] hover:-translate-y-2 ring-1 ring-cyan-500/20' 
                  : isCurrent 
                    ? 'bg-white dark:bg-[#0F172A] border-[color:var(--accent)] shadow-lg shadow-[color:var(--accent)]/10' 
                    : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[color:var(--accent)] text-slate-900 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider z-10">
                  Current Plan
                </div>
              )}
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider z-10 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse-slow">
                  People's Choice
                </div>
              )}
              <h3 className={`text-xl font-bold mb-2 ${isPro ? 'text-cyan-400' : 'text-slate-900 dark:text-white'}`}>
                {plan.name.replace(' (Monthly)', '').replace(' (Annual)', '')}
              </h3>
              <div className="text-[36px] font-bold tracking-tight mb-3 leading-none bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {formatPrice(plan)}
                {plan.price !== null && plan.price !== undefined && (
                  <span className="text-sm font-normal text-slate-500">/{plan.billing_interval === 'annual' || plan.billing_interval === 'year' ? 'yr' : 'mo'}</span>
                )}
              </div>
              <p className="text-[13px] text-slate-500 dark:text-[#888] mb-6 flex-1">{plan.keyRestrictions}</p>
              
              <div className="space-y-4 mb-8">
                <ul className="space-y-3 text-[13px] text-slate-700 dark:text-[#EDEDED]">
                  {getPlanFeatures(plan.name.replace(' (Monthly)', '').replace(' (Annual)', '')).map((feat, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 dark:bg-[#10B981] text-white font-bold text-xs flex items-center justify-center">
                        ✓
                      </span>
                      <span className="ml-2">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => !isCurrent && handleUpgrade(plan)}
                disabled={isCurrent || checkoutPlanId === plan.id}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition-all transform hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center gap-2 ${
                isCurrent 
                  ? 'bg-transparent border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-200 dark:bg-white/5 cursor-default' 
                  : isPro
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]'
                    : 'bg-[color:var(--accent)] hover:opacity-90 text-slate-900 border border-transparent shadow-[0_0_15px_rgba(0,229,255,0.25)]'
              } disabled:opacity-70`}>
                {checkoutPlanId === plan.id && <Loader2 size={14} className="animate-spin" />}
                {isCurrent ? 'Manage Plan' : plan.name === 'Custom' ? 'Contact Us' : 'Upgrade'}
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="glass-card card-hover rounded-xl p-6">
        <h4 className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-2 mb-6">
          <Zap className="text-[color:var(--accent)] w-5 h-5" />
          Execution Limits & Usage
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 dark:text-[#EDEDED] font-semibold">Active Automations</span>
              <span className="text-slate-500 dark:text-[#888]">{(workspace?.usage?.activeAutomations || 0)} / {currentPlan?.limit_active_automations ?? '∞'}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-[#020617] rounded-full overflow-hidden border border-slate-200 dark:border-white/5 relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${currentPlan?.limit_active_automations ? Math.min(((workspace?.usage?.activeAutomations || 0) / currentPlan.limit_active_automations) * 100, 100) : 0}%` }}></div>
            </div>
            {currentPlan?.limit_active_automations && (workspace?.usage?.activeAutomations || 0) >= currentPlan.limit_active_automations ? (
              <p className="text-xs text-red-600 dark:text-[#EF4444] font-medium flex items-center gap-1.5"><AlertTriangle size={12} /> Limit reached.</p>
            ) : <p className="text-xs text-slate-500 dark:text-[#888]">Agent slots used.</p>}
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 dark:text-[#EDEDED] font-semibold">Voice Minutes</span>
              <span className="text-slate-500 dark:text-[#888]">{(workspace?.usage?.voiceMinutes || 0)} / {currentPlan?.limit_voice_minutes?.toLocaleString() ?? '∞'}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-[#020617] rounded-full overflow-hidden border border-slate-200 dark:border-white/5 relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-500 to-[color:var(--accent)] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,229,255,0.4)]" style={{ width: `${currentPlan?.limit_voice_minutes ? Math.min(((workspace?.usage?.voiceMinutes || 0) / currentPlan.limit_voice_minutes) * 100, 100) : 0}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#888]">Outbound and inbound limits.</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 dark:text-[#EDEDED] font-semibold">Email Limits</span>
              <span className="text-slate-500 dark:text-[#888]">{(workspace?.usage?.emailSent || 0).toLocaleString()} / {currentPlan?.limit_email_sent?.toLocaleString() ?? '∞'}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-[#020617] rounded-full overflow-hidden border border-slate-200 dark:border-white/5 relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-[#10B981] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${currentPlan?.limit_email_sent ? Math.min(((workspace?.usage?.emailSent || 0) / currentPlan.limit_email_sent) * 100, 100) : 5}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#888]">Sequences and transactional.</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 dark:text-[#EDEDED] font-semibold">AI Credits</span>
              <span className="text-slate-500 dark:text-[#888]">{(workspace?.usage?.credits || 0).toLocaleString()} / {currentPlan?.limit_credits?.toLocaleString() ?? '∞'}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-[#020617] rounded-full overflow-hidden border border-slate-200 dark:border-white/5 relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(168,85,247,0.3)]" style={{ width: `${currentPlan?.limit_credits ? Math.min(((workspace?.usage?.credits || 0) / currentPlan.limit_credits) * 100, 100) : 0}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#888]">Used for heavy generative tasks.</p>
          </div>
        </div>
      </div>

      <div className="glass-card card-hover rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-center">
            <CreditCard className="text-slate-500 dark:text-[#888]" size={20} />
          </div>
          <div>
            <h4 className="text-slate-900 dark:text-white font-medium text-sm">Payment Method</h4>
            <p className="text-[13px] text-slate-500 dark:text-[#888] mt-0.5">Visa ending in 4242 &bull; Expires 04/28</p>
          </div>
        </div>
        <button className="text-[13px] font-medium text-[color:var(--accent)] hover:opacity-80">Update Method</button>
      </div>
    </div>
  );
}

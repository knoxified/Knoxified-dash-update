"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BrainCircuit, Activity, Users, Phone, Mail, Calendar, MessageSquare, TrendingUp, DollarSign, Clock, CheckCircle2, AlertTriangle, Play, Settings, Zap, Target, X, ShieldCheck } from "lucide-react";
import { useSystems } from "@/lib/services/hooks";

export default function SystemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: systems, loading } = useSystems();
  const [showConfig, setShowConfig] = useState(false);
  const [recordingEnabled, setRecordingEnabled] = useState(true);
  
  if (loading) {
    return <div className="animate-pulse bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl h-[400px] w-full"></div>;
  }

  const system = systems.find(s => s.id === params.id);

  if (!system) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="text-amber-500 dark:text-[#F59E0B] mb-4" size={32} />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">System Not Found</h2>
        <p className="text-slate-500 dark:text-[#888] mb-6">The system you are looking for does not exist or has been removed.</p>
        <button onClick={() => router.push('/systems')} className="text-sky-600 dark:text-[#00E5FF] hover:text-sky-600 dark:text-[#00E5FF]/80 text-sm font-medium">Return to Systems</button>
      </div>
    );
  }

  const isActive = system.status !== 'Offline';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Navigation & Header */}
      <div>
        <nav className="flex items-center text-sm font-medium mb-4 space-x-2">
          <button 
            onClick={() => router.push('/systems')}
            className="text-slate-500 dark:text-[#888] hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            <BrainCircuit size={14} className="mr-1" />
            Systems
          </button>
          <span className="text-slate-300 dark:text-[#444]">/</span>
          <span className="text-slate-900 dark:text-white">{system.name}</span>
        </nav>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${isActive ? 'bg-slate-50 dark:bg-[#020617] text-emerald-600 dark:text-[#10B981] border-slate-300 dark:border-white/10' : 'bg-slate-50 dark:bg-[#020617] text-slate-400 dark:text-[#666] border-slate-200 dark:border-white/5'}`}>
              <BrainCircuit size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{system.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#10B981]' : 'bg-[#444]'}`}></span>
                <span className={`text-sm font-medium ${isActive ? 'text-emerald-600 dark:text-[#10B981]' : 'text-slate-400 dark:text-[#666]'}`}>
                  {isActive ? system.status : 'Offline'}
                </span>
                {isActive && system.currentActivity && (
                  <>
                    <span className="text-[#444]">|</span>
                    <span className="text-sm text-slate-500 dark:text-[#888] flex items-center gap-1.5"><Activity size={12} className="text-sky-600 dark:text-[#00E5FF] animate-pulse" /> {system.currentActivity}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setShowConfig(true)} className="px-4 py-2 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
               <Settings size={16} /> Configuration
             </button>
             {!isActive && (
               <button className="px-4 py-2 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-slate-900 dark:text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                 <Play size={16} /> Deploy System
               </button>
             )}
          </div>
        </div>
      </div>

      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Settings size={18} className="text-sky-600 dark:text-[#00E5FF]"/> System Configuration</h2>
              <button onClick={() => setShowConfig(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="bg-slate-50 dark:bg-[#020617]/50 rounded-lg border border-slate-200 dark:border-white/5 p-5">
                 <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                   <ShieldCheck size={16} className="text-emerald-600 dark:text-[#10B981]" /> Compliance & Legal Settings
                 </h3>
                 <p className="text-xs text-slate-500 dark:text-[#888] mb-6 max-w-lg">These settings are enforced by default to ensure all outbound voice agents operate within legal requirements for AI disclosure and call recording.</p>
                 
                 <div className="space-y-6">
                   <div className="flex items-start justify-between">
                     <div>
                       <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">AI Identification Disclosure (Default-On)</p>
                       <p className="text-xs text-slate-500 dark:text-[#888] max-w-md">Every Voice Agent call will open with a disclosure that the recipient is speaking with an AI system. This cannot be disabled here.</p>
                     </div>
                     <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-not-allowed opacity-80" title="Enforced by System">
                       <div className="absolute right-1 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                     </div>
                   </div>

                   <div className="flex items-start justify-between pt-4 border-t border-slate-200 dark:border-white/5">
                     <div>
                       <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Call Recording & Disclosure</p>
                       <p className="text-xs text-slate-500 dark:text-[#888] max-w-md">When enabled, all calls are recorded and a recording disclosure is announced near the start. Disabling this logs an entry to the Immutable Audit Logs.</p>
                     </div>
                     <button 
                       onClick={() => setRecordingEnabled(!recordingEnabled)}
                       className={`w-10 h-5 rounded-full relative transition-colors ${recordingEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                     >
                       <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${recordingEnabled ? 'right-1' : 'left-1'}`}></div>
                     </button>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isActive ? (
        <>
          {/* Main Business Value Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <MetricCard title="Revenue Influenced" value={formatCurrency(system.revenueImpact || 0)} icon={DollarSign} color="text-emerald-600 dark:text-[#10B981]" />
             <MetricCard title="Pipeline Value" value={formatCurrency((system.revenueImpact || 0) * 2.5)} icon={TrendingUp} color="text-emerald-600 dark:text-[#10B981]" />
             {system.metrics && (
                <>
                  <MetricCard title={system.metrics.label1} value={system.metrics.value1} icon={Activity} color="text-sky-600 dark:text-[#00E5FF]" />
                  <MetricCard title={system.metrics.label2} value={system.metrics.value2} icon={Target} color="text-sky-600 dark:text-[#00E5FF]" />
                </>
             )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Outcomes Panel */}
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-2"><Calendar size={18} className="text-sky-600 dark:text-[#00E5FF]" /> Performance Actions</h3>
               </div>
               <div className="space-y-4">
                 <OutcomeRow label="Primary Actions Completed" value={typeof system.metrics?.value1 === 'number' ? system.metrics.value1 : 520} color="bg-[#10B981]" percent={65} />
                 <OutcomeRow label="Secondary Actions" value={typeof system.metrics?.value2 === 'number' ? system.metrics.value2 : 120} color="bg-[#00E5FF]" percent={20} />
                 <OutcomeRow label="Manual Work Avoided" value={`${typeof system.metrics?.value3 === 'number' ? system.metrics.value3 : system.metrics?.value3 || "48h"}`} color="bg-white/30" percent={15} />
               </div>
            </div>

            {/* Quality Panel */}
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-2"><Target size={18} className="text-amber-500 dark:text-[#F59E0B]" /> Success Routing</h3>
               </div>
               <div className="space-y-4">
                 <OutcomeRow label="High Confidence Hand-offs" value="38%" color="bg-amber-400 dark:bg-[#F59E0B]" percent={38} />
                 <OutcomeRow label="Fully Autonomous Resolution" value="51%" color="bg-[#10B981]" percent={51} />
                 <OutcomeRow label="Escalated for Human Review" value="11%" color="bg-white/30" percent={11} />
               </div>
            </div>

            {/* Channels & Analytics */}
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-2"><MessageSquare size={18} className="text-sky-600 dark:text-[#00E5FF]" /> Channel Activity</h3>
               </div>
               <div className="grid grid-cols-2 gap-4 mb-5">
                 <div className="bg-slate-50 dark:bg-[#020617] rounded-lg p-4 border border-slate-200 dark:border-white/5">
                   <p className="text-[12px] text-slate-500 dark:text-[#888] font-medium mb-1.5">Response Time</p>
                   <p className="text-[20px] text-slate-900 dark:text-white font-bold tracking-tight flex items-center gap-1.5"><Clock size={16} className="text-sky-600 dark:text-[#00E5FF]"/> {"< 45s"}</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-[#020617] rounded-lg p-4 border border-slate-200 dark:border-white/5">
                   <p className="text-[12px] text-slate-500 dark:text-[#888] font-medium mb-1.5">Conversion Rate</p>
                   <p className="text-[20px] text-slate-900 dark:text-white font-bold tracking-tight flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-600 dark:text-[#10B981]"/> 24.5%</p>
                 </div>
               </div>
               <div className="flex items-center gap-4 text-[13px] font-medium">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#888]"><Phone size={14} className="text-sky-600 dark:text-[#00E5FF]" /> 64%</div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#888]"><MessageSquare size={14} className="text-sky-600 dark:text-[#00E5FF]" /> 22%</div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#888]"><Mail size={14} className="text-sky-600 dark:text-[#00E5FF]" /> 14%</div>
               </div>
            </div>
          </div>

          {/* Automations Layer */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-2 mb-4 mt-2"><Zap size={18} className="text-emerald-600 dark:text-[#10B981]" /> Powered by Automations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <AutomationCard name="LeadReach" useCase="Enriches incoming contacts" status="Active" successRate="99.4%" />
               <AutomationCard name="AppointMate" useCase="Auto-schedules viewings" status="Active" successRate="98.1%" />
               <AutomationCard name="ReminderBot" useCase="Handles pre-meeting SMS" status="Active" successRate="100%" />
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0F172A] rounded-xl border-dashed">
          <BrainCircuit className="text-[#333] mb-4" size={48} />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">System is Offline</h2>
          <p className="text-slate-500 dark:text-[#888] mb-6 max-w-sm">Activate this system to deploy its intelligence engine to start handling your operations.</p>
          <button className="px-5 py-2.5 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-slate-900 dark:text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
            <Play size={16} /> Deploy System
          </button>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}

function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
      <p className="text-[14px] text-slate-500 dark:text-[#888] font-medium mb-3 flex items-center gap-2"><Icon size={16} className={color || ""}/> {title}</p>
      <p className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">{value}</p>
    </div>
  );
}

interface OutcomeRowProps {
  label: string;
  value: string | number;
  percent: number;
  color: string;
}

function OutcomeRow({ label, value, percent, color }: OutcomeRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between text-[13px] font-medium mb-2">
        <span className="text-slate-500 dark:text-[#888]">{label}</span>
        <span className="text-slate-900 dark:text-white">{value}</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

interface AutomationCardProps {
  name: string;
  useCase: string;
  status: string;
  successRate: string;
}

function AutomationCard({ name, useCase, status, successRate }: AutomationCardProps) {
  return (
    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-5 flex items-start gap-4 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 cursor-pointer">
       <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 flex items-center justify-center text-emerald-600 dark:text-[#10B981]">
         <Zap size={16} />
       </div>
       <div className="flex-1">
         <h4 className="text-slate-900 dark:text-white text-[15px] font-semibold">{name}</h4>
         <p className="text-slate-500 dark:text-[#888] text-[13px] mt-0.5">{useCase}</p>
         <div className="flex items-center gap-3 mt-4 text-[12px] font-medium">
           <span className="text-emerald-600 dark:text-[#10B981] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span> {status}</span>
           <span className="text-slate-400 dark:text-[#666]">Rate: {successRate}</span>
         </div>
       </div>
    </div>
  );
}

"use client";
import { ActivityFeed } from "@/components/ActivityFeed";
import { useState, useEffect } from "react";
import { ArrowRight, BarChart3, Clock, Cpu, Zap, Mail, MessageSquare, Phone, TrendingUp, ShieldCheck, Activity, Users, CreditCard, AlertTriangle, DollarSign, CalendarCheck, Search, Shield, Target, Building, Users2, Stethoscope, Bell, Mic, PhoneOff, Settings2, Volume2, Radio, Send } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, CartesianGrid, Bar } from "recharts";
import { useDashboardMetrics, useSystemLogs, useSystems, useAutomations } from "@/lib/services/hooks";
import { Select } from "@/components/ui/Select";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 p-3 rounded-xl shadow-xl">
        <p className="text-slate-500 dark:text-[#888] text-xs font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 mb-1.5 last:mb-0">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="text-slate-700 dark:text-[#EDEDED] text-xs font-medium capitalize">{entry.name}</span>
            <span className="text-slate-900 dark:text-white text-sm font-bold ml-auto">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardOverview() {
  const [dateRange, setDateRange] = useState("7d");
  const [logFilter, setLogFilter] = useState("All");
  const [isMounted, setIsMounted] = useState(false);
  const [takeoverActive, setTakeoverActive] = useState(false);
  const [whisperMode, setWhisperMode] = useState(false);
  const [whisperText, setWhisperText] = useState("");
  const { data: metrics, loading: metricsLoading } = useDashboardMetrics(dateRange);
  const { data: logs, loading: logsLoading } = useSystemLogs();
  const { data: systems, loading: systemsLoading } = useSystems();
  const { data: automations, loading: automationsLoading } = useAutomations();
  
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);


  if ((metricsLoading && !metrics) || (logsLoading && !logs) || (systemsLoading && !systems) || (automationsLoading && !automations)) {
    return (
      <div className="space-y-6 w-full opacity-80 pointer-events-none">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <div className="h-8 w-32 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse"></div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="h-9 w-full sm:w-48 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse"></div>
            <div className="h-9 w-32 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse hidden sm:block"></div>
            <div className="h-9 w-24 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse"></div>
          </div>
        </div>

        {/* Hero Area Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 lg:col-span-6 border border-slate-200 dark:border-white/5 rounded-xl p-8 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 w-40 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse"></div>
              <div className="h-6 w-24 bg-slate-200 dark:bg-white/10 rounded-full animate-pulse"></div>
            </div>
            <div className="h-16 w-3/4 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse mt-2"></div>
          </div>
          <div className="md:col-span-4 lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-slate-200 dark:border-white/5 rounded-xl p-5 relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-5 w-5 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse"></div>
                  <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse"></div>
                </div>
                <div className="h-8 w-16 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Area Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 border border-slate-200 dark:border-white/5 rounded-xl p-6">
            <div className="h-6 w-56 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-slate-200 dark:border-white/5 p-4 rounded-lg">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse mb-3"></div>
                  <div className="h-7 w-16 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="h-[200px] w-full bg-slate-100 dark:bg-white/5 rounded-md animate-pulse"></div>
          </div>
          <div className="border border-slate-200 dark:border-white/5 rounded-xl p-6">
            <div className="h-6 w-32 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-slate-200 dark:border-white/5 p-4 rounded-lg flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse"></div>
                    <div>
                      <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse mb-2"></div>
                      <div className="h-3 w-16 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-6 w-12 bg-slate-200 dark:bg-white/10 rounded-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics || !logs || !systems || !automations) return null;

  const activeSystemsList = systems.filter(s => s.status !== 'Offline').map(s => ({ ...s, opType: 'system' as const }));
  const activeAutomationsList = automations.filter(a => a.enabled).map(a => ({ ...a, status: 'Active', opType: 'automation' as const }));
  const activeOperations = [...activeSystemsList, ...activeAutomationsList];
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ${metricsLoading ? 'opacity-80 transition-opacity' : 'opacity-100 transition-opacity'}`}>
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-1">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, Knox.
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm">
            Your agents are running {activeOperations.length} active pipelines. They&apos;ve secured <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(metrics.revenueProtected)}</span> in the {dateRange === '24h' ? 'last 24 hours' : `last ${dateRange.replace('d', ' days')}`}.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button 
            type="button"
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'k', 'metaKey': true}))}
            className="flex flex-1 sm:max-w-[200px] items-center bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-md px-3 py-2 shadow-sm hover:border-sky-300 dark:hover:border-sky-500/50 transition-colors w-full tracking-wide group"
          >
            <Search className="text-slate-400 dark:text-[#666] w-3.5 h-3.5 mr-2 group-hover:text-sky-500 dark:group-hover:text-[#00E5FF] transition-colors" />
            <span className="text-xs text-slate-400 dark:text-[#666] group-hover:text-slate-600 dark:group-hover:text-[#EDEDED] transition-colors">Search command...</span>
            <div className="ml-auto flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
              <kbd className="font-mono text-[9px] font-semibold bg-slate-100 dark:bg-white/5 px-1 py-0.5 rounded text-slate-500 border border-slate-200 dark:border-white/10">⌘</kbd>
              <kbd className="font-mono text-[9px] font-semibold bg-slate-100 dark:bg-white/5 px-1 py-0.5 rounded text-slate-500 border border-slate-200 dark:border-white/10">K</kbd>
            </div>
          </button>
          <button className="hidden sm:flex relative p-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-md hover:border-slate-300 dark:hover:border-white/10 transition-all text-slate-500 dark:text-[#888] hover:text-slate-900 dark:hover:text-white">
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-[#EF4444] border border-white dark:border-[#0F172A]"></div>
            <Bell size={16} />
          </button>
          
          <div className="w-40 z-20">
            <Select 
              value={dateRange} 
              onChange={setDateRange}
              options={[
                { value: "24h", label: "Last 24 Hours" },
                { value: "7d", label: "Last 7 Days" },
                { value: "30d", label: "Last 30 Days" },
                { value: "90d", label: "Last 90 Days" }
              ]}
              className="text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-sky-100 dark:bg-[#00E5FF]/10 border border-sky-300 dark:border-[#00E5FF]/20 px-3 py-2 rounded-md text-sky-600 dark:text-[#00E5FF] text-xs font-medium w-full sm:w-auto">
            <ShieldCheck size={14} />
            {metrics.planStatus}
          </div>
        </div>
      </div>

      {/* 1) Top hero section: business outcome first */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 lg:col-span-6 bg-white dark:bg-[#0F172A]/70 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl p-6 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 dark:bg-[#10B981]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <DollarSign size={18} className="text-emerald-600 dark:text-[#10B981]" />
            <span className="text-slate-500 dark:text-[#888] font-semibold text-base">Revenue Influenced</span>
            <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-[#10B981] bg-emerald-100 dark:bg-[#10B981]/10 px-2 py-0.5 rounded-full">+12.4% this period</span>
          </div>
          <div className="text-[56px] md:text-[72px] font-bold text-slate-900 dark:text-white tracking-tighter leading-none relative z-10">
            {formatCurrency(metrics.revenueInfluenced)}
          </div>
        </div>
        
        <div className="md:col-span-4 lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard label="Revenue Protected" value={formatCurrency(metrics.revenueProtected)} icon={Shield} trend="+5.2%" trendColor="text-emerald-600 dark:text-[#10B981]" color="text-sky-600 dark:text-[#00E5FF]" sparklineData={[{val:30},{val:40},{val:35},{val:55},{val:45},{val:60},{val:70}]} />
          <StatCard label="Appointments Booked" value={metrics.appointmentsBooked.toString()} icon={CalendarCheck} trend="+18%" trendColor="text-emerald-600 dark:text-[#10B981]" color="text-slate-900 dark:text-white" sparklineData={[{val:10},{val:15},{val:12},{val:22},{val:18},{val:30},{val:40}]} />
          <StatCard label="Qualified Leads" value={metrics.qualifiedLeads.toString()} icon={Target} trend="-2.4%" trendColor="text-red-500 dark:text-[#EF4444]" color="text-slate-900 dark:text-white" sparklineData={[{val:80},{val:85},{val:75},{val:82},{val:70},{val:65},{val:60}]} />
          <StatCard label="Failed Follow-ups" value={metrics.failedFollowups.toString()} icon={AlertTriangle} subtitle="Requires attention" isWarning={true} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Voice Agent Interface */}
        <div className="xl:col-span-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 relative overflow-hidden group transition-all duration-300 shadow-sm flex flex-col justify-center h-full">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-2">
              <Radio className="text-sky-600 dark:text-[#00E5FF] animate-pulse" size={18} />
              <h3 className="text-slate-900 dark:text-white font-semibold text-base">Active Voice Agent</h3>
              <span className="ml-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-[#10B981] bg-emerald-50 dark:bg-[#10B981]/10 border border-emerald-200 dark:border-[#10B981]/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Listening
              </span>
            </div>
            <Link href="/agent-config" className="text-slate-400 hover:text-slate-600 dark:text-[#888] dark:hover:text-white transition-colors">
              <Settings2 size={18} />
            </Link>
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-stretch flex-1">
            
            <div className="flex-1 w-full bg-slate-50 dark:bg-[#020617]/50 rounded-lg border border-slate-200 dark:border-white/5 p-4 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-[#888] mb-3 uppercase tracking-wider">Live Transcript</p>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <Users size={12} className="text-slate-600 dark:text-[#EDEDED]" />
                    </div>
                    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-lg rounded-tl-none p-3 text-sm text-slate-700 dark:text-[#EDEDED] shadow-sm">
                      Yes, I would like to schedule a follow-up for next week.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-[#00E5FF]/20 flex items-center justify-center shrink-0">
                      <Mic size={12} className="text-sky-600 dark:text-[#00E5FF]" />
                    </div>
                    <div className="bg-sky-50 dark:bg-[#00E5FF]/5 border border-sky-100 dark:border-[#00E5FF]/10 rounded-lg rounded-tl-none p-3 text-sm text-slate-700 dark:text-white shadow-sm relative">
                      Perfect, I have that scheduled for Tuesday at 10 AM. Is there anything else you need help with?
                      <span className="absolute bottom-1 right-2 flex items-center gap-1">
                         <span className="w-1 h-1 bg-sky-400 dark:bg-[#00E5FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                         <span className="w-1 h-1 bg-sky-400 dark:bg-[#00E5FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                         <span className="w-1 h-1 bg-sky-400 dark:bg-[#00E5FF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-48 xl:w-56 flex flex-col justify-center items-center gap-6 bg-slate-50 dark:bg-[#020617]/50 rounded-lg border border-slate-200 dark:border-white/5 p-6 shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-sky-400 dark:bg-[#00E5FF] rounded-full animate-ping opacity-20"></div>
                <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-[#00E5FF]/10 border-4 border-white dark:border-[#0F172A] shadow-xl flex items-center justify-center relative z-10">
                  <Mic size={24} className="text-sky-600 dark:text-[#00E5FF]" />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button className="w-10 h-10 rounded-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center text-slate-600 dark:text-[#EDEDED] transition-colors shadow-sm">
                  <Volume2 size={16} />
                </button>
                <button className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 border border-transparent flex items-center justify-center text-white transition-colors shadow-sm shadow-red-500/20">
                  <PhoneOff size={16} />
                </button>
              </div>
              
              <div className="w-full space-y-2 mt-auto">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-[#888] uppercase tracking-wider">
                  <span>Signal</span>
                  <span className="text-emerald-500">Excellent</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[92%] rounded-full"></div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions Sidebar */}
            <div className="w-full lg:w-56 shrink-0 bg-slate-50 dark:bg-[#020617]/50 rounded-lg border border-slate-200 dark:border-white/5 p-5 flex flex-col">
               <h4 className="text-xs font-semibold text-slate-500 dark:text-[#888] uppercase tracking-wider mb-4">Quick Actions</h4>
               <div className="flex flex-col gap-3 flex-1">
                  <button onClick={() => setTakeoverActive(!takeoverActive)} className={`group flex items-center justify-between p-3 rounded-lg border shadow-sm transition-colors ${takeoverActive ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`}>
                    <span className={`text-[13px] font-medium transition-colors ${takeoverActive ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-[#EDEDED] group-hover:text-slate-900 dark:group-hover:text-white'}`}>Live Takeover</span>
                    <div className={`w-7 h-3.5 rounded-full relative transition-colors ${takeoverActive ? 'bg-red-500' : 'bg-slate-200 dark:bg-white/10'}`}><div className={`w-2.5 h-2.5 bg-white rounded-full absolute top-[2px] shadow-sm transition-transform ${takeoverActive ? 'right-[2px]' : 'left-[2px]'}`}></div></div>
                  </button>
                  <button onClick={() => setWhisperMode(!whisperMode)} className={`group flex items-center justify-between p-3 rounded-lg border shadow-sm transition-colors ${whisperMode ? 'bg-sky-50 dark:bg-[#00E5FF]/10 border-sky-200 dark:border-[#00E5FF]/20' : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`}>
                    <span className={`text-[13px] font-medium transition-colors ${whisperMode ? 'text-sky-700 dark:text-[#00E5FF]' : 'text-slate-700 dark:text-[#EDEDED] group-hover:text-slate-900 dark:group-hover:text-white'}`}>Whisper Mode</span>
                    <div className={`w-7 h-3.5 rounded-full relative transition-colors ${whisperMode ? 'bg-sky-500 dark:bg-[#00E5FF]' : 'bg-slate-200 dark:bg-white/10'}`}><div className={`w-2.5 h-2.5 bg-white rounded-full absolute top-[2px] shadow-sm transition-transform ${whisperMode ? 'right-[2px]' : 'left-[2px]'}`}></div></div>
                  </button>
                  {whisperMode && (
                    <div className="flex items-center gap-2 mt-1 animate-in fade-in slide-in-from-top-2">
                      <input 
                        type="text" 
                        value={whisperText}
                        onChange={(e) => setWhisperText(e.target.value)}
                        placeholder="Prompt AI..." 
                        className="w-full bg-white dark:bg-[#020617] border border-sky-200 dark:border-[#00E5FF]/30 text-slate-900 dark:text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                      <button className="w-8 h-8 flex items-center justify-center shrink-0 bg-sky-500 dark:bg-[#00E5FF] text-white dark:text-[#020617] rounded-lg hover:opacity-90 transition-opacity">
                        <Send size={14} />
                      </button>
                    </div>
                  )}
                  <button className="group flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 shadow-sm hover:border-slate-300 dark:hover:border-white/10 transition-colors mt-auto">
                    <span className="text-[13px] font-medium text-slate-700 dark:text-[#EDEDED] group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Do Not Disturb</span>
                    <div className="w-7 h-3.5 bg-slate-200 dark:bg-white/10 rounded-full relative transition-colors"><div className="w-2.5 h-2.5 bg-white rounded-full absolute top-[2px] left-[2px] shadow-sm transition-transform"></div></div>
                  </button>
               </div>
               
               <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/5 w-full">
                 <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-[#888] uppercase tracking-wider mb-2">
                   <span>Voice Minutes</span>
                   <span className="text-slate-700 dark:text-[#EDEDED]">120 / 500</span>
                 </div>
                 <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-sky-500 dark:bg-[#00E5FF] h-full w-[24%] rounded-full"></div>
                 </div>
               </div>
            </div>

          </div>
        </div>

        {/* 5) Active systems section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="text-slate-500 dark:text-[#888]" size={20} />
            Active Operations
          </h2>
          <Link href="/systems" className="text-sm font-medium text-sky-600 dark:text-[#00E5FF] hover:text-sky-700 dark:hover:text-[#00E5FF]/80 flex items-center gap-1 transition-colors">
            View All Portfolio <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {activeOperations.slice(0, 3).map(op => {
            let Icon = Building;
            if (op.opType === 'system') {
              if (op.id === 'recruitment') Icon = Users2;
              if (op.id === 'dental') Icon = Stethoscope;
            } else {
              Icon = Settings2;
            }

            return (
              <div key={op.opType + '-' + op.id} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500">
                    <Icon size={140} className="text-sky-600 dark:text-[#00E5FF]" />
                  </div>
                  
                  <div className="flex items-start justify-between mb-5 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-300 dark:border-white/10 flex items-center justify-center text-sky-600 dark:text-[#00E5FF]">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="text-slate-900 dark:text-white font-semibold text-base">{op.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`w-2 h-2 rounded-full ${op.status === 'Active' ? 'bg-[#10B981]' : 'bg-[#00E5FF]'}`}></span>
                          <span className="text-[12px] text-slate-500 dark:text-[#888] font-medium">{op.status} ({op.opType === 'system' ? 'System' : 'Automation'})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 relative z-10">
                    {op.opType === 'system' ? (
                      <>
                        <p className="text-[12px] text-emerald-600 dark:text-[#10B981] font-medium mb-1">Revenue Impact</p>
                        <p className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format((op as any).revenueImpact || 0)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[12px] text-sky-600 dark:text-sky-400 font-medium mb-1">Category</p>
                        <p className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">{(op as any).category || 'Automation'}</p>
                      </>
                    )}
                  </div>

                  <div className={`grid ${op.opType === 'system' ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mb-5 relative z-10 border-t border-slate-200 dark:border-white/5 pt-5`}>
                     <div>
                       <p className="text-[12px] text-slate-500 dark:text-[#888] font-medium mb-0.5">{op.metrics?.label1}</p>
                       <p className="text-sm text-slate-900 dark:text-white font-medium">{op.metrics?.value1}</p>
                     </div>
                     <div>
                       <p className="text-[12px] text-slate-500 dark:text-[#888] font-medium mb-0.5">{op.metrics?.label2}</p>
                       <p className="text-sm text-slate-900 dark:text-white font-medium">{op.metrics?.value2}</p>
                     </div>
                     {op.opType === 'system' && (
                       <div>
                         <p className="text-[12px] text-slate-500 dark:text-[#888] font-medium mb-0.5">{(op as any).metrics?.label3}</p>
                         <p className="text-sm text-slate-900 dark:text-white font-medium">{(op as any).metrics?.value3}</p>
                       </div>
                     )}
                  </div>
                </div>

                {(op as any).currentActivity && (
                  <div className="mt-auto bg-white dark:bg-[#0F172A]/80 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-lg p-3 text-[13px] text-slate-700 dark:text-[#EDEDED] flex items-center gap-2.5 relative z-10 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse"></span>
                    <span className="truncate">{(op as any).currentActivity}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 2) “Today’s Wins” section */}
        <div className="bg-white dark:bg-[#0F172A]/80 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 h-full">
          <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#0F172A]/50">
            <div className="flex items-center gap-2">
              <Zap className="text-amber-500 dark:text-[#F59E0B]" size={16} />
              <h3 className="text-slate-900 dark:text-white font-semibold text-base">Today&apos;s Wins</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 dark:bg-[#020617] p-1 rounded-lg border border-slate-200 dark:border-white/5">
                {['All', 'Calls', 'Emails'].map((filter) => (
                  <button 
                    key={filter}
                    onClick={() => setLogFilter(filter)}
                    className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md transition-colors ${logFilter === filter ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#666] hover:text-slate-700 dark:hover:text-[#EDEDED]'}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
              </span>
            </div>
          </div>
          
          <ActivityFeed filter={logFilter} />
        </div>
      </div>
    </div>
  );
}


interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendColor?: string;
  subtitle?: string;
  color?: string;
  isWarning?: boolean;
  sparklineData?: Array<{val: number}>;
}

function StatCard({ label, value, icon: Icon, trend, trendColor, subtitle, color, isWarning, sparklineData }: StatCardProps) {
  const warningClasses = isWarning ? 'border-red-200 dark:border-[#EF4444]/30 bg-red-50 dark:bg-[#EF4444]/5' : 'border-slate-200 dark:border-white/5 bg-white dark:bg-[#0F172A]';
  const strokeColor = trendColor?.includes('red') ? '#EF4444' : '#10B981';

  return (
    <div className={`border rounded-xl p-6 relative overflow-hidden transition-all duration-300 group hover:border-sky-300 dark:hover:border-sky-500/30 hover:shadow-lg hover:-translate-y-1 flex flex-col justify-center h-full ${warningClasses}`}>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Icon size={16} className={isWarning ? 'text-red-500 dark:text-[#EF4444]' : color} />
          <p className="text-slate-500 dark:text-[#888] font-medium text-sm">{label}</p>
        </div>
        {isWarning && <AlertTriangle size={16} className="text-red-500 dark:text-[#EF4444] animate-pulse" />}
      </div>

      <div className="flex items-end gap-2 relative z-10">
        <p className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">{value}</p>
        {trend && (
          <span className={`text-[13px] font-medium mb-1 ${trendColor ? trendColor : 'text-slate-500 dark:text-[#888]'}`}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className={`text-[12px] mt-2 font-medium relative z-10 ${isWarning ? 'text-red-500 dark:text-[#EF4444]' : 'text-slate-500 dark:text-[#888]'}`}>{subtitle}</p>
      )}

      {/* Sparkline chart in the background */}
      {sparklineData && !isWarning && (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-70 transition-opacity duration-300 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={sparklineData}>
                <defs>
                   <linearGradient id={`spark-${label.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={strokeColor} stopOpacity={0.5}/>
                      <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <Area type="monotone" dataKey="val" stroke={strokeColor} strokeWidth={2} fillOpacity={1} fill={`url(#spark-${label.replace(/\s+/g, '')})`} />
             </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

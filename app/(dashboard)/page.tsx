"use client";
import { ActivityFeed } from "@/components/ActivityFeed";
import { useState, useEffect } from "react";
import { ArrowRight, BarChart3, Clock, Cpu, Zap, Mail, MessageSquare, Phone, TrendingUp, ShieldCheck, Activity, Users, CreditCard, AlertTriangle, DollarSign, CalendarCheck, Search, Shield, Target, Building, Users2, Stethoscope, Bell } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, CartesianGrid, Bar } from "recharts";
import { useDashboardMetrics, useSystemLogs, useSystems } from "@/lib/services/hooks";
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
  const { data: metrics, loading: metricsLoading } = useDashboardMetrics(dateRange);
  const { data: logs, loading: logsLoading } = useSystemLogs();
  const { data: systems, loading: systemsLoading } = useSystems();
  
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);


  if ((metricsLoading && !metrics) || (logsLoading && !logs) || (systemsLoading && !systems)) {
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

  if (!metrics || !logs || !systems) return null;

  const activeSystems = systems.filter(s => s.status !== 'Offline');
  
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
            Your agents are running {activeSystems.length} active pipelines. They&apos;ve secured <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(metrics.revenueProtected)}</span> in the {dateRange === '24h' ? 'last 24 hours' : `last ${dateRange.replace('d', ' days')}`}.
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
        <div className="md:col-span-8 lg:col-span-6 bg-white dark:bg-[#0F172A]/70 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl p-8 flex flex-col justify-center relative overflow-hidden">
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
        
        {/* 3) Revenue and pipeline panel */}
        <div className="xl:col-span-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 flex flex-col relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00E5FF]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
             <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-base">
                <TrendingUp className="text-sky-600 dark:text-[#00E5FF]" size={18} />
                Financial Impact & Activity Volume
             </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 relative z-10">
            <div className="bg-slate-50 dark:bg-[#020617]/50 border border-slate-200 dark:border-white/5 p-4 rounded-lg">
              <p className="text-slate-500 dark:text-[#888] text-[13px] font-medium mb-1">Pipeline Value</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{formatCurrency(metrics.pipelineValue)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-[#020617]/50 border border-slate-200 dark:border-white/5 p-4 rounded-lg">
              <p className="text-slate-500 dark:text-[#888] text-[13px] font-medium mb-1">Conversion Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{metrics.conversionRate}%</p>
                <div className="bg-red-100 dark:bg-[#EF4444]/10 text-red-500 dark:text-[#EF4444] px-1.5 py-0.5 rounded text-[10px] font-bold">-1.2%</div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-[#020617]/50 border border-slate-200 dark:border-white/5 p-4 rounded-lg col-span-2 md:col-span-1">
              <p className="text-slate-500 dark:text-[#888] text-[13px] font-medium mb-1">Missed Opp. Reduction</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{metrics.missedOpportunityReduction}%</p>
                <div className="bg-emerald-100 dark:bg-[#10B981]/10 text-emerald-600 dark:text-[#10B981] px-1.5 py-0.5 rounded text-[10px] font-bold">+5.4%</div>
              </div>
            </div>
          </div>

          <div className="h-[240px] w-full mt-auto relative z-10">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart data={metrics.volumeActivity} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="#666" fontSize={11} tickLine={false} axisLine={false} dy={5} />
                  <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} dx={-5} />
                  <Tooltip 
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={<CustomTooltip />}
                  />
                  <Area type="monotone" dataKey="calls" name="Revenue Gen (Calls)" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCalls)" />
                  <Area type="monotone" dataKey="emails" name="Revenue Prot (Emails)" stroke="#00E5FF" strokeWidth={2} fillOpacity={1} fill="url(#colorEmails)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2) “Today’s Wins” section */}
        <div className="bg-white dark:bg-[#0F172A]/80 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
          <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#0F172A]/50">
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

      {/* 4) Heatmap */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#10B981]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100"></div>
        <div className="flex items-center gap-2 mb-6 relative z-10">
          <Activity className="text-sky-600 dark:text-[#00E5FF]" size={18} />
          <h3 className="text-slate-900 dark:text-white font-semibold text-base">System Interaction Heatmap</h3>
          <span className="ml-2 text-[11px] font-medium text-slate-500 dark:text-[#888] bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 px-2 py-0.5 rounded-full">Weekly Avg</span>
        </div>
        <div className="overflow-x-auto relative z-10 pb-2">
           <Heatmap dateRange={dateRange} />
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
          {activeSystems.slice(0, 3).map(system => {
            let Icon = Building;
            if (system.id === 'recruitment') Icon = Users2;
            if (system.id === 'dental') Icon = Stethoscope;

            return (
              <div key={system.id} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500">
                  <Icon size={140} className="text-sky-600 dark:text-[#00E5FF]" />
                </div>
                
                <div className="flex items-start justify-between mb-5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-300 dark:border-white/10 flex items-center justify-center text-sky-600 dark:text-[#00E5FF]">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-slate-900 dark:text-white font-semibold text-base">{system.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-2 h-2 rounded-full ${system.status === 'Active' ? 'bg-[#10B981]' : 'bg-[#00E5FF]'}`}></span>
                        <span className="text-[12px] text-slate-500 dark:text-[#888] font-medium">{system.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6 relative z-10">
                  <p className="text-[12px] text-emerald-600 dark:text-[#10B981] font-medium mb-1">Revenue Impact</p>
                  <p className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">{formatCurrency(system.revenueImpact || 0)}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5 relative z-10 border-t border-slate-200 dark:border-white/5 pt-5">
                   <div>
                     <p className="text-[12px] text-slate-500 dark:text-[#888] font-medium mb-0.5">{system.metrics?.label1}</p>
                     <p className="text-sm text-slate-900 dark:text-white font-medium">{system.metrics?.value1}</p>
                   </div>
                   <div>
                     <p className="text-[12px] text-slate-500 dark:text-[#888] font-medium mb-0.5">{system.metrics?.label2}</p>
                     <p className="text-sm text-slate-900 dark:text-white font-medium">{system.metrics?.value2}</p>
                   </div>
                   <div>
                     <p className="text-[12px] text-slate-500 dark:text-[#888] font-medium mb-0.5">{system.metrics?.label3}</p>
                     <p className="text-sm text-slate-900 dark:text-white font-medium">{system.metrics?.value3}</p>
                   </div>
                </div>

                {system.currentActivity && (
                  <div className="bg-white dark:bg-[#0F172A]/80 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-lg p-3 text-[13px] text-slate-700 dark:text-[#EDEDED] flex items-center gap-2.5 relative z-10 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse"></span>
                    <span className="truncate">{system.currentActivity}</span>
                  </div>
                )}
              </div>
            )
          })}
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
    <div className={`border rounded-xl p-5 relative overflow-hidden transition-all duration-300 group hover:border-sky-300 dark:hover:border-sky-500/30 hover:shadow-lg hover:-translate-y-1 ${warningClasses}`}>
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

function Heatmap({ dateRange }: { dateRange?: string }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({length: 24}, (_, i) => i);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const getIntensity = (day: string, hour: number) => {
    if (!mounted) return 0;
    const rangeMod = dateRange === '24h' ? 1 : dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const seed = day.charCodeAt(0) + hour * 13 + rangeMod * 42;
    const pseudoRandom = (Math.sin(seed) + 1) / 2;
    if (day === 'Sat' || day === 'Sun') return pseudoRandom > 0.8 ? 1 : 0;
    if (hour >= 8 && hour <= 18) {
       return Math.floor(pseudoRandom * 4) + 1;
    }
    return pseudoRandom > 0.7 ? 1 : 0;
  }

  const getColor = (intensity: number) => {
    switch(intensity) {
      case 0: return 'bg-slate-50 dark:bg-[#020617] border-slate-200 dark:border-white/5';
      case 1: return 'bg-emerald-200 dark:bg-[#10B981]/20 border-[#10B981]/10';
      case 2: return 'bg-[#10B981]/40 border-[#10B981]/20';
      case 3: return 'bg-[#10B981]/70 border-[#10B981]/30';
      case 4: return 'bg-[#10B981] border-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.3)]';
      default: return 'bg-slate-50 dark:bg-[#020617] border-slate-200 dark:border-white/5';
    }
  }

  return (
    <div className="min-w-[700px] select-none">
      <div className="flex mb-2">
        <div className="w-12"></div>
        {hours.map(h => (
          <div key={h} className="flex-1 text-[10px] text-slate-400 dark:text-[#666] text-center flex justify-center">
            {h % 2 === 0 ? (h === 0 ? '12A' : h < 12 ? `${h}A` : h === 12 ? '12P' : `${h-12}P`) : ''}
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {days.map(day => (
          <div key={day} className="flex items-center">
            <div className="w-12 text-[11px] text-slate-500 dark:text-[#888] font-medium">{day}</div>
            <div className="flex-1 flex gap-1">
              {hours.map(hour => {
                const intensity = getIntensity(day, hour);
                return (
                  <div 
                    key={`${day}-${hour}`}
                    className={`flex-1 aspect-[2/1] rounded-[2px] border transition-colors hover:border-white/40 ${getColor(intensity)}`}
                    title={`${day} @ ${hour}:00 - Activity level: ${intensity}`}
                  ></div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-4 text-[11px] text-slate-500 dark:text-[#888]">
        <span>Less</span>
        <div className="flex gap-1">
           <div className="w-4 h-2 rounded-[2px] bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5"></div>
           <div className="w-4 h-2 rounded-[2px] bg-emerald-200 dark:bg-[#10B981]/20"></div>
           <div className="w-4 h-2 rounded-[2px] bg-[#10B981]/40"></div>
           <div className="w-4 h-2 rounded-[2px] bg-[#10B981]/70"></div>
           <div className="w-4 h-2 rounded-[2px] bg-[#10B981]"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  )
}

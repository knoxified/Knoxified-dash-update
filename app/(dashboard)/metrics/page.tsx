"use client";

import { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Phone, Mail, MessageSquare, Zap, Target, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const DATA = [
  { name: "Mon", calls: 400, emails: 2400, chats: 240 },
  { name: "Tue", calls: 300, emails: 1398, chats: 221 },
  { name: "Wed", calls: 500, emails: 3800, chats: 229 },
  { name: "Thu", calls: 450, emails: 3908, chats: 200 },
  { name: "Fri", calls: 600, emails: 4800, chats: 218 },
  { name: "Sat", calls: 550, emails: 3800, chats: 250 },
  { name: "Sun", calls: 700, emails: 4300, chats: 210 },
];

const FUNNEL_DATA = [
  { name: "Total Leads", value: 4500, color: "#888" },
  { name: "Qualified", value: 3100, color: "#10B981" },
  { name: "Engaged", value: 1800, color: "#00E5FF" },
  { name: "Converted", value: 450, color: "#10B981" },
];

export default function MetricsPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-1">
            Performance Metrics
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm">
            Deep dive into the operational efficiency of your systems and automations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toast.success('CSV Export started: Your file will download shortly.')} className="bg-slate-100 dark:bg-[#020617] mt-1 sm:mt-0 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 dark:text-[#EDEDED] border border-slate-200 dark:border-white/5 shadow-sm hover:bg-slate-200 dark:hover:bg-white/5 transition-transform active:scale-95">
            Export CSV
          </button>
          <button onClick={() => toast.success('Report generation scheduled. We will notify you when it is ready.')} className="bg-[color:var(--accent)] mt-1 sm:mt-0 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-900 hover:opacity-90 transition-all active:scale-95 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
            Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Scheduled Inspections" icon={Target} total="+23%" trend="Up" isUp={true} dataKey="calls" color="#10B981" />
        <MetricCard title="Response Time" icon={Zap} total="< 0s" trend="Instant" isUp={true} dataKey="emails" color="#00E5FF" />
        <MetricCard title="SLA Breaches" icon={TrendingDown} total="14" trend="Up 2%" isUp={false} dataKey="chats" color="#EF4444" isWarning={true} />
        <MetricCard title="Closing Rates" icon={TrendingUp} total="+20%" trend="Up" isUp={true} dataKey="calls" color="#10B981" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card card-hover rounded-xl p-6 lg:col-span-2 flex flex-col min-h-[350px]">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6">Growth Activity Overview</h3>
          <div className="h-[280px] w-full mt-auto">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart data={DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '8px', fontSize: '13px' }}
                    itemStyle={{ color: '#eee' }}
                  />
                  <Area type="monotone" dataKey="emails" stroke="#00E5FF" fillOpacity={1} fill="url(#colorEmails)" strokeWidth={2} />
                  <Area type="monotone" dataKey="calls" stroke="#10B981" fillOpacity={1} fill="url(#colorCalls)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card card-hover rounded-xl p-6 flex flex-col min-h-[350px]">
          <div className="flex items-center gap-2 mb-6">
            <Target size={18} className="text-emerald-600 dark:text-[#10B981]" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Conversion Pipeline</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-4">
            {FUNNEL_DATA.map((item, index) => {
              const max = FUNNEL_DATA[0].value;
              const percent = (item.value / max) * 100;
              return (
                <div key={item.name} className="relative">
                  <div className="flex items-end justify-between font-medium mb-1.5">
                    <span className="text-xs text-slate-500 dark:text-[#888]">{item.name}</span>
                    <span className="text-slate-900 dark:text-white tracking-tight font-semibold">{item.value.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full relative" style={{ width: `${percent}%`, backgroundColor: item.color }}>
                    </div>
                  </div>
                  {index < FUNNEL_DATA.length - 1 && (
                     <div className="absolute -bottom-4 w-[1px] h-3 bg-white/10 left-4"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass-card card-hover rounded-xl p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6">Outbound Calls vs Response Rate</h3>
        <div className="h-72 w-full">
           {isMounted && (
             <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
               <BarChart data={DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barSize={24}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                 <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                 <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                 <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '8px', fontSize: '13px' }}
                  />
                 <Bar dataKey="calls" fill="#10B981" radius={[4, 4, 0, 0]} />
                 <Bar dataKey="chats" fill="#00E5FF" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           )}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  icon: React.ElementType;
  total: string | number;
  trend: string;
  isUp: boolean;
  dataKey: string;
  color: string;
  isWarning?: boolean;
}

function MetricCard({ title, icon: Icon, total, trend, isUp, dataKey, color, isWarning }: MetricCardProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const bgClasses = isWarning ? 'bg-red-50 dark:bg-[#EF4444]/5 border-red-200 dark:border-[#EF4444]/30' : 'glass-card';
  
  return (
    <div className={`${bgClasses} card-hover rounded-xl p-5 flex flex-col h-[180px] relative`}>
      {isWarning && <div className="absolute top-4 right-20 text-red-500 dark:text-[#EF4444] animate-pulse"><AlertTriangle size={14} /></div>}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-slate-500 dark:text-[#888]" />
          <h3 className="text-slate-900 dark:text-white font-medium text-[14px]">{title}</h3>
        </div>
        <div className={`flex items-center gap-1 text-[12px] font-bold px-2 py-0.5 rounded ${isUp ? 'text-emerald-600 dark:text-[#10B981] bg-emerald-100 dark:bg-[#10B981]/10' : 'text-red-500 dark:text-[#EF4444] bg-red-100 dark:bg-[#EF4444]/10'}`}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{total}</div>
      <div className="h-[70px] w-full opacity-70 mt-auto flex-1">
        {isMounted && (
          <ResponsiveContainer width="100%" height="80%" minWidth={1} minHeight={1} className="mt-3">
            <AreaChart data={DATA} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${dataKey}-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  cursor={false}
                />
              <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#grad-${dataKey}-${title})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

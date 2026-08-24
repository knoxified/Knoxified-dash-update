"use client";
import { ActivityFeed } from "@/components/ActivityFeed";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, BarChart3, Clock, Cpu, Zap, Mail, MessageSquare, Phone, TrendingUp, ShieldCheck, Activity, CreditCard, AlertTriangle, DollarSign, CalendarCheck, Search, Shield, Target, Building, Users2, Stethoscope, Bell, Settings2, Radio, Mic, PhoneOff, Volume2, Users, Send } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, CartesianGrid, Bar } from "recharts";
import { useDashboardMetrics, useSystemLogs, useSystems, useAutomations } from "@/lib/services/hooks";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="backdrop-blur-xl border p-3 rounded-2xl shadow-2xl" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
        <p className="text-slate-400 dark:text-white/40 text-[11px] font-semibold mb-2 uppercase tracking-wider">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 mb-1.5 last:mb-0">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="text-slate-600 dark:text-white/60 text-xs font-medium capitalize">{entry.name}</span>
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
  const { data: automations, loading: automationsLoading } = useAutomations();

  // Voice agent web call
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "active">("idle");
  const [callError, setCallError] = useState<string | null>(null);
  const [callTranscript, setCallTranscript] = useState<{ role: "user" | "agent"; content: string }[]>([]);
  const [takeoverActive, setTakeoverActive] = useState(false);
  const [whisperMode, setWhisperMode] = useState(false);
  const [whisperText, setWhisperText] = useState("");
  const voiceMinutesUsed = metrics?.voiceUsage?.used ?? 0;
  const voiceMinutesLimit = metrics?.voiceUsage?.total ?? 0;
  const deviceRef = useRef<any>(null);
  const activeCallRef = useRef<any>(null);

  // Uses Cloudflare service bindings to call voice-agent-beta internally
  async function startWebCall() {
    setCallError(null);
    setCallStatus("connecting");
    setCallTranscript([]);
    try {
      // Fetch from internal service binding instead of public URL
      const voiceAgentUrl = "/internal/voice"; // placeholder, actual routing handled by binding
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You need to be logged in to start a call.");
      }

      // Readiness check using internal service binding
      const startRes = await fetch("/internal/voice/web-call/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!startRes.ok) {
        const body = await startRes.json().catch(() => null);
        throw new Error(body?.error === "quota_exceeded"
          ? "You're out of voice minutes for this plan."
          : `Voice agent isn't ready yet (${startRes.status}).`);
      }

      // Get Twilio token using internal service binding
      const tokenRes = await fetch("/internal/voice/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!tokenRes.ok) {
        throw new Error("Couldn't get a call token from the voice agent.");
      }
      const { token } = await tokenRes.json();

      // Dynamic import: this SDK needs browser APIs (microphone, WebRTC)
      // that don't exist during any server-side render pass.
      const { Device } = await import("@twilio/voice-sdk");

      if (deviceRef.current) {
        deviceRef.current.destroy();
        deviceRef.current = null;
      }

      const device = new Device(token, {
        logLevel: 1,
        codecPreferences: ["opus", "pcmu"] as any,
      });
      deviceRef.current = device;

      device.on("error", (twilioError: any) => {
        setCallError(`Call error: ${twilioError.message}`);
        cleanupCall();
      });

      // Required before connect() on the v2 SDK.
      await device.register();

      const call = await device.connect({ params: { userId: user.id, mode: "dashboard" } });
      activeCallRef.current = call;

      call.on("accept", () => {
        setCallStatus("active");
      });

      call.on("disconnect", () => {
        cleanupCall();
      });

      call.on("cancel", () => {
        cleanupCall();
      });

      call.on("error", (err: any) => {
        setCallError(`Call error: ${err.message}`);
        cleanupCall();
      });

    } catch (err: any) {
      setCallError(err.message || "Couldn't reach the voice agent.");
      cleanupCall();
    }
  }

  function cleanupCall() {
    try {
      activeCallRef.current?.disconnect();
    } catch { /* already gone */ }
    try {
      deviceRef.current?.unregister();
      deviceRef.current?.destroy();
    } catch { /* already gone */ }
    activeCallRef.current = null;
    deviceRef.current = null;
    setCallStatus("idle");
    setCallTranscript([]);
  }

  function endWebCall() {
    cleanupCall();
  }
  
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);


  if ((metricsLoading && !metrics) || (logsLoading && !logs) || (systemsLoading && !systems) || (automationsLoading && !automations)) {
    return (
      <div className="space-y-6 w-full">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="skeleton h-7 w-48 rounded-xl mb-2" />
            <div className="skeleton h-4 w-72 rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <div className="skeleton h-9 w-44 rounded-xl" />
            <div className="skeleton h-9 w-8 rounded-xl hidden sm:block" />
            <div className="skeleton h-9 w-36 rounded-xl" />
            <div className="skeleton h-9 w-28 rounded-xl" />
          </div>
        </div>

        {/* Hero Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="skeleton md:col-span-8 lg:col-span-6 rounded-2xl h-44" />
          <div className="md:col-span-4 lg:col-span-6 grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="skeleton rounded-2xl h-[88px]" />)}
          </div>
        </div>

        {/* Bottom Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 skeleton rounded-2xl h-72" />
          <div className="skeleton rounded-2xl h-72" />
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
    <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ${metricsLoading ? 'opacity-70 transition-opacity' : 'opacity-100 transition-opacity'}`}>
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, Knox.
          </h1>
          <p className="text-slate-500 dark:text-white/40 text-sm">
            Your agents are running <span className="font-semibold text-slate-700 dark:text-white/70">{activeOperations.length}</span> active pipelines. They&apos;ve secured{' '}
            <span className="font-semibold text-slate-700 dark:text-white/70">{formatCurrency(metrics.revenueProtected)}</span>{' '}
            in the {dateRange === '24h' ? 'last 24 hours' : `last ${dateRange.replace('d', ' days')}`}.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button 
            type="button"
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'k', 'metaKey': true}))}
            className="flex flex-1 sm:max-w-[200px] items-center bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] rounded-xl px-3 py-2 hover:border-slate-300 dark:hover:border-white/10 transition-all w-full tracking-wide group shadow-sm"
          >
            <Search className="text-slate-300 dark:text-white/20 w-3.5 h-3.5 mr-2 group-hover:text-slate-500 dark:group-hover:text-white/50 transition-colors" style={{ color: 'var(--accent)' }} />
            <span className="text-xs text-slate-400 dark:text-white/30 group-hover:text-slate-600 dark:group-hover:text-white/60 transition-colors">Search command...</span>
            <div className="ml-auto flex items-center gap-1">
              <kbd className="font-mono text-[9px] font-bold bg-slate-100 dark:bg-white/[0.06] px-1 py-0.5 rounded text-slate-400 dark:text-white/25 border border-slate-200/80 dark:border-white/[0.06]">⌘</kbd>
              <kbd className="font-mono text-[9px] font-bold bg-slate-100 dark:bg-white/[0.06] px-1 py-0.5 rounded text-slate-400 dark:text-white/25 border border-slate-200/80 dark:border-white/[0.06]">K</kbd>
            </div>
          </button>
          <button className="hidden sm:flex relative p-2 bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] rounded-xl hover:border-slate-300 dark:hover:border-white/10 transition-all text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white shadow-sm">
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: '#f43f5e', boxShadow: '0 0 6px rgba(244,63,94,0.7)' }}></div>
            <Bell size={15} />
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
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold w-full sm:w-auto border"
            style={{ 
              background: 'var(--accent-muted)', 
              borderColor: 'var(--accent-dim)', 
              color: 'var(--accent)' 
            }}
          >
            <ShieldCheck size={13} />
            {metrics.planStatus}
          </div>
        </div>
      </div>

      {/* 1) Hero section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Revenue Influenced — big hero card */}
        <div className="md:col-span-8 lg:col-span-6 bg-white dark:bg-[#0d1117] border border-slate-200/60 dark:border-white/[0.05] rounded-2xl p-7 flex flex-col justify-center relative overflow-hidden card-hover shadow-sm">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full -mr-24 -mt-24 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full -ml-16 -mb-16 pointer-events-none" style={{ background: 'radial-gradient(circle, var(--accent-muted) 0%, transparent 70%)' }} />
          
          <div className="flex items-center gap-2.5 mb-5 relative z-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <DollarSign size={16} className="text-emerald-500" />
            </div>
            <span className="text-slate-500 dark:text-white/50 font-semibold text-sm">Revenue Influenced</span>
            <span className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 px-2.5 py-1 rounded-full">
              +12.4% this period
            </span>
          </div>
          <div className="text-[52px] md:text-[68px] font-extrabold text-slate-900 dark:text-white tracking-[-3px] leading-none relative z-10" style={{ fontFeatureSettings: '"tnum"' }}>
            {formatCurrency(metrics.revenueInfluenced)}
          </div>
          <p className="text-[13px] text-slate-400 dark:text-white/30 mt-3 relative z-10">Across all active systems and automations</p>
        </div>
        
        <div className="md:col-span-4 lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard label="Revenue Protected" value={formatCurrency(metrics.revenueProtected)} icon={Shield} trend="+5.2%" trendUp={true} sparklineData={[{val:30},{val:40},{val:35},{val:55},{val:45},{val:60},{val:70}]} />
          <StatCard label="Appointments" value={metrics.appointmentsBooked.toString()} icon={CalendarCheck} trend="+18%" trendUp={true} sparklineData={[{val:10},{val:15},{val:12},{val:22},{val:18},{val:30},{val:40}]} />
          <StatCard label="Qualified Leads" value={metrics.qualifiedLeads.toString()} icon={Target} trend="-2.4%" trendUp={false} sparklineData={[{val:80},{val:85},{val:75},{val:82},{val:70},{val:65},{val:60}]} />
          <StatCard label="Failed Follow-ups" value={metrics.failedFollowups.toString()} icon={AlertTriangle} subtitle="Requires attention" isWarning={true} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        
        {/* Voice Agent Interface */}
        <div className="xl:col-span-2 bg-white dark:bg-[#0d1117] border border-slate-200/60 dark:border-white/[0.05] rounded-2xl p-6 relative overflow-hidden group card-hover shadow-sm flex flex-col">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -mr-20 -mt-20 pointer-events-none transition-opacity duration-700 opacity-30 group-hover:opacity-60" style={{ background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)' }} />
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}>
                <Radio size={15} style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 4px var(--accent-glow))' }} className={callStatus === "active" ? "animate-pulse" : ""} />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold text-[15px]">Voice Agent</h3>
              {callStatus === "active" ? (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Listening
                </span>
              ) : callStatus === "connecting" ? (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Connecting
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-white/40 bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Idle
                </span>
              )}
            </div>
            <Link href="/agent-config" className="p-2 rounded-xl text-slate-400 dark:text-white/25 hover:text-slate-600 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all">
              <Settings2 size={15} />
            </Link>
          </div>

          {callError && (
            <div className="mb-4 text-[12px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2 relative z-10">
              {callError}
            </div>
          )}

          {callStatus === "idle" ? (
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4 py-6">
              <button
                onClick={startWebCall}
                className="relative group/mic"
                aria-label="Start web call with your voice agent"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl border-4 border-white dark:border-[#0d1117] transition-transform group-hover/mic:scale-105"
                  style={{ background: 'var(--accent-muted)', boxShadow: '0 0 20px var(--accent-glow)' }}
                >
                  <Mic size={22} style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 6px var(--accent-glow))' }} />
                </div>
              </button>
              <p className="text-slate-500 dark:text-white/40 text-sm">Tap to test your agent with a web call</p>
            </div>
          ) : (
          <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-stretch flex-1">
            
            {/* Transcript */}
            <div className="flex-1 w-full bg-slate-50 dark:bg-white/[0.025] rounded-xl border border-slate-200/80 dark:border-white/[0.05] p-4 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-white/25 mb-3 uppercase tracking-widest">Live Transcript</p>
                <div className="space-y-3">
                  {callTranscript.length === 0 && callStatus === "connecting" && (
                    <p className="text-[13px] text-slate-400 dark:text-white/30">Connecting to your agent...</p>
                  )}
                  {callTranscript.map((msg, i) => (
                    msg.role === "user" ? (
                      <div key={i} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/[0.08] flex items-center justify-center shrink-0">
                          <Users size={11} className="text-slate-500 dark:text-white/50" />
                        </div>
                        <div className="bg-white dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.06] rounded-2xl rounded-tl-none px-3 py-2 text-[13px] text-slate-700 dark:text-white/70 shadow-sm max-w-[85%]">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-dim)' }}>
                          <Mic size={11} style={{ color: 'var(--accent)' }} />
                        </div>
                        <div className="rounded-2xl rounded-tl-none px-3 py-2 text-[13px] text-slate-700 dark:text-white/80 shadow-sm max-w-[85%] relative" style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-dim)' }}>
                          {msg.content}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Mic / Controls */}
            <div className="w-full lg:w-44 flex flex-col justify-center items-center gap-5 bg-slate-50 dark:bg-white/[0.025] rounded-xl border border-slate-200/80 dark:border-white/[0.05] p-5 shrink-0">
              <div className="relative">
                {callStatus === "active" && (
                  <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'var(--accent)' }} />
                )}
                <div className="w-16 h-16 rounded-full flex items-center justify-center relative z-10 shadow-xl border-4 border-white dark:border-[#0d1117]"
                  style={{ background: 'var(--accent-muted)', boxShadow: '0 0 20px var(--accent-glow)' }}
                >
                  <Mic size={22} style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 6px var(--accent-glow))' }} />
                </div>
              </div>

              {callStatus === "active" && (
                <div className="flex items-center gap-[3px] h-6">
                  {[4,8,14,20,14,8,4].map((h, i) => (
                    <div key={i} className="waveform-bar" style={{ height: `${h}px`, animationDelay: `${i * 80}ms` }} />
                  ))}
                </div>
              )}

              <div className="flex gap-2.5">
                <button className="w-9 h-9 rounded-full bg-white dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-white/50 transition-all shadow-sm">
                  <Volume2 size={14} />
                </button>
                <button onClick={endWebCall} className="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-sm" style={{ boxShadow: '0 0 12px rgba(239,68,68,0.4)' }}>
                  <PhoneOff size={14} />
                </button>
              </div>

              <div className="w-full space-y-1.5 mt-auto">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-white/25 uppercase tracking-wider">
                  <span>Status</span>
                  <span className={callStatus === "active" ? "text-emerald-500" : "text-amber-500"}>{callStatus === "active" ? "Connected" : "Connecting"}</span>
                </div>
                <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className={`h-full rounded-full ${callStatus === "active" ? "w-full bg-emerald-500" : "w-1/3 bg-amber-500"}`} style={{ boxShadow: callStatus === "active" ? '0 0 6px rgba(16,185,129,0.6)' : undefined }} />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="w-full lg:w-52 shrink-0 bg-slate-50 dark:bg-white/[0.025] rounded-xl border border-slate-200/80 dark:border-white/[0.05] p-4 flex flex-col">
               <h4 className="text-[10px] font-bold text-slate-400 dark:text-white/25 uppercase tracking-widest mb-3">Quick Actions</h4>
               <div className="flex flex-col gap-2 flex-1">
                  <ToggleButton 
                    label="Live Takeover" 
                    active={takeoverActive} 
                    onToggle={() => setTakeoverActive(!takeoverActive)}
                    activeColor="bg-red-500"
                    activeStyle="bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
                    activeTextStyle="text-red-600 dark:text-red-400"
                  />
                  <ToggleButton 
                    label="Whisper Mode" 
                    active={whisperMode} 
                    onToggle={() => setWhisperMode(!whisperMode)}
                    activeStyle="dark:border-white/10"
                    useAccent
                  />
                  {whisperMode && (
                    <div className="flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-2">
                      <input 
                        type="text" 
                        value={whisperText}
                        onChange={(e) => setWhisperText(e.target.value)}
                        placeholder="Prompt AI..." 
                        className="w-full bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none transition-all border"
                        style={{ borderColor: 'var(--accent-dim)' }}
                      />
                      <button className="w-7 h-7 flex items-center justify-center shrink-0 rounded-xl text-slate-900 dark:text-[#0d1117] hover:opacity-90 transition-opacity" style={{ background: 'var(--accent)', boxShadow: '0 0 10px var(--accent-glow)' }}>
                        <Send size={12} />
                      </button>
                    </div>
                  )}
                  <ToggleButton 
                    label="Do Not Disturb" 
                    active={false} 
                    onToggle={() => {}}
                    activeStyle=""
                  />
               </div>
               
               <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-white/[0.05] w-full">
                 <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-white/25 uppercase tracking-wider mb-1.5">
                   <span>Voice Minutes</span>
                   <span className="text-slate-600 dark:text-white/50">{voiceMinutesUsed}/{voiceMinutesLimit}</span>
                 </div>
                 <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                   <div className="h-full rounded-full" style={{ width: `${voiceMinutesLimit > 0 ? Math.min((voiceMinutesUsed / voiceMinutesLimit) * 100, 100) : 0}%`, background: 'var(--accent)', boxShadow: '0 0 6px var(--accent-glow)' }} />
                 </div>
               </div>
            </div>

          </div>
          )}
        </div>

        {/* Active Systems section — col-span-1 on the right */}
        <div className="bg-white dark:bg-[#0d1117] border border-slate-200/60 dark:border-white/[0.05] rounded-2xl overflow-hidden card-hover shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100/80 dark:border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-500" style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.6))' }} />
              <h3 className="text-slate-900 dark:text-white font-semibold text-[15px]">Today&apos;s Wins</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100/80 dark:bg-white/[0.04] p-0.5 rounded-xl border border-slate-200/80 dark:border-white/[0.05] gap-0.5">
                {['All', 'Calls', 'Emails'].map((f) => (
                  <button 
                    key={f}
                    onClick={() => setLogFilter(f)}
                    className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-lg transition-all ${logFilter === f ? 'text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-white/25 hover:text-slate-600 dark:hover:text-white/50'}`}
                    style={logFilter === f ? { background: 'var(--surface-1)' } : {}}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
            </div>
          </div>
          <ActivityFeed filter={logFilter} />
        </div>
      </div>

      {/* 5) Active Operations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Cpu className="text-slate-400 dark:text-white/25" size={18} />
            Active Operations
          </h2>
          <Link href="/systems" className="flex items-center gap-1 text-[13px] font-semibold hover:opacity-70 transition-opacity" style={{ color: 'var(--accent)' }}>
            View All <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {activeOperations.slice(0, 3).map(op => {
            let Icon = Building;
            if (op.opType === 'system') {
              if (op.id === 'recruitment') Icon = Users2;
              if (op.id === 'dental') Icon = Stethoscope;
            } else {
              Icon = Settings2;
            }

            return (
              <div key={op.opType + '-' + op.id} className="bg-white dark:bg-[#0d1117] border border-slate-200/60 dark:border-white/[0.05] rounded-2xl p-6 card-hover cursor-pointer relative overflow-hidden flex flex-col justify-between shadow-sm group">
                {op.status === 'Active' && (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent pointer-events-none" />
                )}
                
                {/* Hover glow */}
                <div className="absolute top-0 right-0 w-40 h-40 -mr-16 -mt-16 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle, var(--accent-muted) 0%, transparent 70%)' }} />
                
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all" style={{ background: 'var(--accent-muted)', borderColor: 'var(--accent-dim)' }}>
                        <Icon size={18} style={{ color: 'var(--accent)' }} />
                      </div>
                      <div>
                        <h3 className="text-slate-900 dark:text-white font-semibold text-[15px]">{op.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="relative flex h-1.5 w-1.5">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${op.status === 'Active' ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${op.status === 'Active' ? 'bg-emerald-500' : 'bg-sky-400'}`} />
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-white/30 font-medium">{op.status} · {op.opType === 'system' ? 'System' : 'Automation'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Primary metric */}
                  <div className="mb-5 relative z-10">
                    {op.opType === 'system' ? (
                      <>
                        <p className="text-[11px] text-emerald-500 font-bold mb-1 uppercase tracking-wider">Revenue Impact</p>
                        <p className="text-[30px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none" style={{ fontFeatureSettings: '"tnum"' }}>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format((op as any).revenueImpact || 0)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] font-bold mb-1 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Category</p>
                        <p className="text-[26px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">{(op as any).category || 'Automation'}</p>
                      </>
                    )}
                  </div>

                  {/* Metrics grid */}
                  <div className={`grid ${op.opType === 'system' ? 'grid-cols-3' : 'grid-cols-2'} gap-3 mb-4 relative z-10 border-t border-slate-100/80 dark:border-white/[0.04] pt-4`}>
                     <div>
                       <p className="text-[11px] text-slate-400 dark:text-white/25 font-medium mb-0.5">{op.metrics?.label1}</p>
                       <p className="text-sm text-slate-800 dark:text-white/80 font-semibold">{op.metrics?.value1}</p>
                     </div>
                     <div>
                       <p className="text-[11px] text-slate-400 dark:text-white/25 font-medium mb-0.5">{op.metrics?.label2}</p>
                       <p className="text-sm text-slate-800 dark:text-white/80 font-semibold">{op.metrics?.value2}</p>
                     </div>
                     {op.opType === 'system' && (
                       <div>
                         <p className="text-[11px] text-slate-400 dark:text-white/25 font-medium mb-0.5">{(op as any).metrics?.label3}</p>
                         <p className="text-sm text-slate-800 dark:text-white/80 font-semibold">{(op as any).metrics?.value3}</p>
                       </div>
                     )}
                  </div>
                </div>

                {(op as any).currentActivity && (
                  <div className="mt-auto rounded-xl px-3 py-2.5 text-[12px] text-slate-600 dark:text-white/60 flex items-center gap-2 relative z-10 border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--accent-glow)' }} />
                    <span className="truncate">{(op as any).currentActivity}</span>
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


// ── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  isWarning?: boolean;
  sparklineData?: Array<{val: number}>;
}

function StatCard({ label, value, icon: Icon, trend, trendUp, subtitle, isWarning, sparklineData }: StatCardProps) {
  const strokeColor = trendUp ? '#10b981' : '#f43f5e';

  return (
    <div className={`border rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group card-hover flex flex-col h-full shadow-sm ${
      isWarning 
        ? 'border-red-200/80 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/[0.04]' 
        : 'border-slate-200/60 dark:border-white/[0.05] bg-white dark:bg-[#0d1117]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isWarning ? 'bg-red-100 dark:bg-red-500/10' : ''}`}
            style={!isWarning ? { background: 'var(--accent-muted)' } : {}}
          >
            <Icon size={13} className={isWarning ? 'text-red-500 dark:text-red-400' : ''} style={!isWarning ? { color: 'var(--accent)' } : {}} />
          </div>
          <p className="text-slate-500 dark:text-white/40 font-medium text-[12px]">{label}</p>
        </div>
        {isWarning && <AlertTriangle size={13} className="text-red-500 dark:text-red-400 animate-pulse" />}
      </div>

      {/* Value */}
      <div className="flex items-end gap-2 relative z-10 mt-auto">
        <p className="text-[26px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none" style={{ fontFeatureSettings: '"tnum"' }}>{value}</p>
        {trend && (
          <span className={`text-[12px] font-bold mb-0.5 ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className={`text-[11px] mt-1.5 font-semibold relative z-10 ${isWarning ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-white/30'}`}>{subtitle}</p>
      )}

      {/* Sparkline background */}
      {sparklineData && !isWarning && (
        <div className="absolute bottom-0 left-0 right-0 h-14 opacity-20 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none">
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

// ── ToggleButton ─────────────────────────────────────────────────────────────
interface ToggleButtonProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  activeStyle?: string;
  activeTextStyle?: string;
  activeColor?: string;
  useAccent?: boolean;
}

function ToggleButton({ label, active, onToggle, activeStyle, activeTextStyle, activeColor, useAccent }: ToggleButtonProps) {
  return (
    <button 
      onClick={onToggle} 
      className={`group flex items-center justify-between p-2.5 rounded-xl border shadow-sm transition-all ${
        active 
          ? (activeStyle || 'bg-white/[0.04] border-white/10')
          : 'bg-white dark:bg-white/[0.04] border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/10'
      }`}
    >
      <span className={`text-[12px] font-semibold transition-colors ${
        active 
          ? (activeTextStyle || (useAccent ? '' : 'text-slate-700 dark:text-white/80'))
          : 'text-slate-500 dark:text-white/40 group-hover:text-slate-700 dark:group-hover:text-white/70'
      }`}
        style={active && useAccent ? { color: 'var(--accent)' } : {}}
      >
        {label}
      </span>
      <div className={`w-8 h-4 rounded-full relative transition-all ${active ? (activeColor || '') : 'bg-slate-200 dark:bg-white/10'}`}
        style={active && useAccent ? { background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)' } : {}}
      >
        <div className={`w-3 h-3 bg-white rounded-full absolute top-[2px] shadow-sm transition-transform duration-200 ${active ? 'right-[2px]' : 'left-[2px]'}`} />
      </div>
    </button>
  );
}

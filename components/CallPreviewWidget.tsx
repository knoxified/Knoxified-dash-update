'use client';

import { useState, useRef, useEffect } from "react";
import { Radio, Mic, PhoneOff, Volume2, Users, Settings2, Info, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAgentReadiness } from "@/lib/actions/system-automation-actions";

interface CallPreviewWidgetProps {
  // When set, the call previews THIS vertical's tone/temperature/industry
  // context instead of the account's own configured system_type -- lets
  // someone hear how their agent would sound configured for a different
  // industry without changing their real settings. Omit for a normal
  // preview of the account's actual configuration (e.g. on the dashboard
  // overview page).
  previewSystemType?: string;
  previewSystemLabel?: string;
}

export function CallPreviewWidget({ previewSystemType, previewSystemLabel }: CallPreviewWidgetProps) {
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "active">("idle");
  const [callError, setCallError] = useState<string | null>(null);
  const [callTranscript, setCallTranscript] = useState<{ role: "user" | "agent"; content: string }[]>([]);
  const [hasPhoneNumber, setHasPhoneNumber] = useState<boolean | null>(null);
  const deviceRef = useRef<any>(null);
  const activeCallRef = useRef<any>(null);

  useEffect(() => {
    // Phone-number readiness only matters for the account's own real
    // config preview, not a vertical preview (which always works the same
    // regardless of whether a number is connected yet).
    if (!previewSystemType) {
      getAgentReadiness().then((r) => setHasPhoneNumber(r.hasPhoneNumber));
    }
  }, [previewSystemType]);

  async function startWebCall() {
    setCallError(null);
    setCallStatus("connecting");
    setCallTranscript([]);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You need to be logged in to start a call.");
      }

      const startRes = await fetch("/api/voice/web-call/start", {
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

      const tokenRes = await fetch("/api/voice/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!tokenRes.ok) {
        throw new Error("Couldn't get a call token from the voice agent.");
      }
      const { token } = await tokenRes.json();

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

      await device.register();

      const call = await device.connect({
        params: {
          userId: user.id,
          mode: "dashboard",
          // Only present for a vertical preview -- an empty string would
          // still be falsy on the receiving end, but omit the key
          // entirely rather than send an empty override.
          ...(previewSystemType ? { systemTypeOverride: previewSystemType } : {}),
        },
      });
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

  return (
    <div className="bg-white dark:bg-[#0d1117] border border-slate-200/60 dark:border-white/[0.05] rounded-2xl p-6 relative overflow-hidden group card-hover shadow-sm flex flex-col">
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full -mr-20 -mt-20 pointer-events-none transition-opacity duration-700 opacity-30 group-hover:opacity-60" style={{ background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)' }} />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}>
            {previewSystemType ? (
              <Sparkles size={15} style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 4px var(--accent-glow))' }} />
            ) : (
              <Radio size={15} style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 4px var(--accent-glow))' }} className={callStatus === "active" ? "animate-pulse" : ""} />
            )}
          </div>
          <h3 className="text-slate-900 dark:text-white font-semibold text-[15px]">
            {previewSystemType ? `Preview: ${previewSystemLabel || previewSystemType}` : "Voice Agent"}
          </h3>
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
        {!previewSystemType && (
          <Link href="/agent-config" className="p-2 rounded-xl text-slate-400 dark:text-white/25 hover:text-slate-600 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all">
            <Settings2 size={15} />
          </Link>
        )}
      </div>

      {callError && (
        <div className="mb-4 text-[12px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2 relative z-10">
          {callError}
        </div>
      )}

      {previewSystemType && callStatus === "idle" && (
        <div className="mb-4 flex items-start gap-2.5 text-[12px] text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] rounded-lg px-3 py-2.5 relative z-10">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>
            This previews your agent with <strong>{previewSystemLabel || previewSystemType}</strong>&apos;s tone and industry context, regardless of your account&apos;s own configured vertical. Your real settings aren&apos;t changed.
          </span>
        </div>
      )}

      {!previewSystemType && hasPhoneNumber === false && (
        <div className="mb-4 flex items-start gap-2.5 text-[12px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2.5 relative z-10">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>
            This is a <strong>web call preview</strong> in your browser, not a real phone call. To let real
            customers call your agent, connect a phone number in{" "}
            <Link href="/agent-config" className="underline hover:opacity-80 font-medium">Agent Config</Link>.
          </span>
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
          <p className="text-slate-500 dark:text-white/40 text-sm">
            {previewSystemType ? `Tap to hear your agent as ${previewSystemLabel || previewSystemType}` : "Tap to test your agent with a web call"}
          </p>
        </div>
      ) : (
      <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-stretch flex-1">

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
      </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { Calendar, CalendarClock, Check, KeyRound, X } from "lucide-react";
import { toast } from "sonner";
import {
  lookupCalcomKeyAction,
  connectCalcomAction,
  disconnectCalcomAction,
  getCalendarSettingsAction,
  setCalendarProviderAction,
  type CalendarProvider,
  type CalendarSettings,
  type EventTypeOption,
} from "@/lib/actions/calendar-actions";

const btnPrimary = "bg-[color:var(--accent)] hover:opacity-90 text-slate-900 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50";
const btnGhost = "bg-slate-100 dark:bg-[#020617] text-slate-700 dark:text-[#EDEDED] hover:bg-slate-200 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50";

function StatusPill({ on }: { on: boolean }) {
  return on ? (
    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-[#10B981] bg-emerald-50 dark:bg-[#10B981]/10 px-2 py-1 rounded-md">
      <Check size={12} /> Connected
    </span>
  ) : (
    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#888] bg-slate-100 dark:bg-[#020617] px-2 py-1 rounded-md">Not connected</span>
  );
}

export function CalendarConnections() {
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [modal, setModal] = useState(false);
  const [step, setStep] = useState<"key" | "pick">("key");
  const [apiKey, setApiKey] = useState("");
  const [eventTypes, setEventTypes] = useState<EventTypeOption[]>([]);
  const [account, setAccount] = useState<string>("");
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, startBusy] = useTransition();

  const reload = async () => setSettings(await getCalendarSettingsAction());
  useEffect(() => { reload(); }, []);

  const closeModal = () => {
    setModal(false); setStep("key"); setApiKey(""); setEventTypes([]); setSelected(null); setAccount("");
  };

  const verifyKey = () =>
    startBusy(async () => {
      const r = await lookupCalcomKeyAction(apiKey.trim());
      if (!r.ok) { toast.error(r.error); return; }
      const usable = r.eventTypes.filter((t) => !t.hidden);
      const list = usable.length ? usable : r.eventTypes;
      if (!list.length) { toast.error("No event types found. Create one in Cal.com first (for example a 30 minute appointment), then try again."); return; }
      setAccount(r.account.email || r.account.username || "your Cal.com account");
      setEventTypes(list);
      setSelected(list.length === 1 ? list[0].id : null);
      setStep("pick");
    });

  const save = () =>
    startBusy(async () => {
      if (selected == null) return;
      const r = await connectCalcomAction(apiKey.trim(), selected);
      if (!r.ok) { toast.error(r.error); return; }
      toast.success("Cal.com connected. Your voice agent now books into it.");
      closeModal();
      await reload();
    });

  const disconnect = () =>
    startBusy(async () => {
      const r = await disconnectCalcomAction();
      if (!r.ok) { toast.error(r.error); return; }
      toast.success("Cal.com disconnected.");
      await reload();
    });

  const choose = (p: CalendarProvider) =>
    startBusy(async () => {
      const r = await setCalendarProviderAction(p);
      if (!r.ok) { toast.error(r.error); return; }
      toast.success(`Your voice agent now books into ${p === "calcom" ? "Cal.com" : "Google Calendar"}.`);
      await reload();
    });

  if (!settings) return <div className="animate-pulse glass-card rounded-xl h-40 w-full" />;

  const options: { id: CalendarProvider; name: string; connected: boolean; note: string }[] = [
    { id: "google", name: "Google Calendar", connected: settings.googleConnected, note: "Connect Google Workspace on the App Connections tab." },
    { id: "calcom", name: "Cal.com", connected: !!settings.calcom, note: "Connect Cal.com below." },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-slate-900 dark:text-white font-semibold mb-1">Calendar your voice agent books into</h3>
        <p className="text-slate-500 dark:text-[#888] text-sm mb-4">Only one calendar is used at a time. Switch whenever you like.</p>
        <div className="space-y-2">
          {options.map((o) => {
            const active = settings.provider === o.id;
            return (
              <button
                key={o.id}
                disabled={busy || !o.connected || active}
                onClick={() => choose(o.id)}
                className={`w-full flex items-center justify-between gap-4 text-left px-4 py-3 rounded-lg border transition-all ${
                  active ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10" : "border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#020617]"
                } ${!o.connected ? "opacity-60 cursor-not-allowed" : active ? "cursor-default" : "hover:border-[color:var(--accent)]/50"}`}
              >
                <span className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${active ? "border-[color:var(--accent)]" : "border-slate-400 dark:border-[#555]"}`}>
                    {active && <span className="w-2 h-2 rounded-full bg-[color:var(--accent)]" />}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-slate-900 dark:text-white">{o.name}</span>
                    {!o.connected && <span className="block text-xs text-slate-500 dark:text-[#888]">{o.note}</span>}
                  </span>
                </span>
                {active ? <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--accent)]">In use</span> : <StatusPill on={o.connected} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 flex items-center justify-center text-sky-500"><Calendar size={20} /></div>
            <StatusPill on={!!settings.calcom} />
          </div>
          <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-1">Cal.com</h3>
          {settings.calcom ? (
            <p className="text-slate-500 dark:text-[#888] text-xs mb-6 flex-1">
              {settings.calcom.email || settings.calcom.username}
              {settings.calcom.eventTypeTitle ? ` · ${settings.calcom.eventTypeTitle}` : ""}
              {settings.calcom.lengthMinutes ? ` (${settings.calcom.lengthMinutes} min)` : ""}
              <br />Callers can book, reschedule and cancel by phone.
            </p>
          ) : (
            <p className="text-slate-500 dark:text-[#888] text-xs mb-6 flex-1">Let callers book, reschedule and cancel appointments in your Cal.com calendar. Uses an API key, no sign-in screen.</p>
          )}
          <div className="flex gap-2">
            <button onClick={() => setModal(true)} disabled={busy} className={`${settings.calcom ? btnGhost : btnPrimary} flex-1`}>
              {settings.calcom ? "Reconnect" : "Connect with API key"}
            </button>
            {settings.calcom && <button onClick={disconnect} disabled={busy} className={btnGhost}>Disconnect</button>}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 flex flex-col opacity-70">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/5 flex items-center justify-center text-blue-500"><CalendarClock size={20} /></div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#888] bg-slate-100 dark:bg-[#020617] px-2 py-1 rounded-md">Coming soon</span>
          </div>
          <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-1">Calendly</h3>
          <p className="text-slate-500 dark:text-[#888] text-xs flex-1">Book into Calendly with a personal access token.</p>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Connect Cal.com">
          <div className="glass-card rounded-xl p-6 w-full max-w-md bg-white dark:bg-[#0b1220]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 dark:text-white font-semibold flex items-center gap-2"><KeyRound size={16} /> Connect Cal.com</h3>
              <button onClick={closeModal} aria-label="Close" className="text-slate-500 hover:text-slate-900 dark:hover:text-white"><X size={18} /></button>
            </div>

            {step === "key" ? (
              <>
                <p className="text-slate-500 dark:text-[#888] text-sm mb-3">
                  In Cal.com open Settings → Developer → API keys, create a key and paste it here. We only store it to book appointments for you.
                </p>
                <input
                  type="password"
                  autoComplete="off"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="cal_live_..."
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 dark:text-white mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={closeModal} className={btnGhost}>Cancel</button>
                  <button onClick={verifyKey} disabled={busy || apiKey.trim().length < 10} className={btnPrimary}>{busy ? "Checking..." : "Check key"}</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-500 dark:text-[#888] text-sm mb-3">Key accepted for {account}. Which event type should your agent book?</p>
                <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
                  {eventTypes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelected(t.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${selected === t.id ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10" : "border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#020617]"}`}
                    >
                      <span className="text-slate-900 dark:text-white font-medium">{t.title || t.slug}</span>
                      {t.lengthMinutes ? <span className="text-slate-500 dark:text-[#888]"> · {t.lengthMinutes} min</span> : null}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setStep("key")} className={btnGhost}>Back</button>
                  <button onClick={save} disabled={busy || selected == null} className={btnPrimary}>{busy ? "Saving..." : "Connect"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

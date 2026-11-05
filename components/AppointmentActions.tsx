"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Star, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getLeadAppointment, rescheduleAppointment, type LeadAppointmentInfo } from "@/lib/actions/appointments-actions";
import { buildRescheduleMessage, formatAppointmentTime } from "@/lib/appointment-message";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// <input type="datetime-local"> works in the browser's local time.
function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

type Lead = { id: string; name: string | null };

// Reschedule + Review for a booked lead. "compact" (table row) shows just Reschedule;
// the full version (lead drawer) also shows the Review button.
export function AppointmentActions({ lead, compact = false, onDone }: { lead: Lead; compact?: boolean; onDone?: () => void }) {
  const [info, setInfo] = useState<LeadAppointmentInfo | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const viewerTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;

  const load = () =>
    getLeadAppointment(lead.id, viewerTz).then((r) => {
      if ("error" in r) { setError(r.error); setInfo(null); } else { setError(null); setInfo(r); }
    });

  // The drawer needs the booked time to know when Review unlocks; table rows fetch only on click.
  useEffect(() => {
    if (!compact) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id, compact]);

  const appt = info?.appointment || null;
  const endMs = appt ? Date.parse(appt.end || appt.start) : NaN;
  const reviewAt = Number.isFinite(endMs) ? endMs + HOUR_MS : null;
  const reviewUnlocked = reviewAt !== null && Date.now() >= reviewAt;

  const openDialog = async () => {
    setOpen(true);
    if (info === undefined || compact) { setInfo(undefined); await load(); }
  };

  const btn = "inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors";

  return (
    <>
      <div className={compact ? "mt-1" : "flex flex-wrap items-center gap-2"}>
        <button
          type="button"
          onClick={openDialog}
          className={`${btn} ${compact ? "text-[color:var(--accent)] hover:underline px-0 py-0" : "bg-[color:var(--accent)] text-slate-900 hover:opacity-90"}`}
        >
          <CalendarClock size={13} /> Reschedule
        </button>
        {!compact && (
          <button
            type="button"
            disabled={!reviewUnlocked}
            onClick={() => toast.info("Review requests are coming soon.")}
            title={reviewUnlocked ? "Review requests are coming soon" : "Available 1 hour after the appointment ends"}
            className={`${btn} border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-slate-100 dark:enabled:hover:bg-white/5`}
          >
            <Star size={13} /> Request review
          </button>
        )}
      </div>
      {open && (
        <RescheduleDialog
          lead={lead}
          info={info}
          error={error}
          viewerTz={viewerTz}
          onClose={() => setOpen(false)}
          onDone={() => { setOpen(false); load(); onDone?.(); }}
        />
      )}
    </>
  );
}

function RescheduleDialog({ lead, info, error, viewerTz, onClose, onDone }: {
  lead: Lead; info: LeadAppointmentInfo | null | undefined; error: string | null; viewerTz?: string; onClose: () => void; onDone: () => void;
}) {
  const appt = info?.appointment || null;
  const startMs = appt ? Date.parse(appt.start) : NaN;
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setValue(""); }, [appt?.start]);

  const minMs = Number.isFinite(startMs) ? Math.max(startMs - DAY_MS, Date.now() + 60_000) : 0;
  const maxMs = Number.isFinite(startMs) ? startMs + DAY_MS : 0;
  const pickedMs = value ? new Date(value).getTime() : NaN;
  const inRange = Number.isFinite(pickedMs) && pickedMs >= minMs - 1000 && pickedMs <= maxMs + 1000 && Math.abs(pickedMs - startMs) >= 60_000;

  const preview = useMemo(() => {
    if (!info || !appt || !Number.isFinite(pickedMs)) return null;
    return buildRescheduleMessage({
      firstName: info.firstName,
      reasonForBooking: info.reasonForBooking,
      when: formatAppointmentTime(new Date(pickedMs), appt.timeZone),
      ownerReason: reason,
      businessName: info.businessName,
    });
  }, [info, appt, pickedMs, reason]);

  const quick = (delta: number) => {
    const t = startMs + delta;
    if (t < Date.now() + 60_000) { toast.error("That time has already passed."); return; }
    setValue(toLocalInput(new Date(t)));
  };

  const submit = async () => {
    if (!inRange) return;
    setBusy(true);
    const res = await rescheduleAppointment({ leadId: lead.id, newStart: new Date(pickedMs).toISOString(), reason, viewerTz });
    setBusy(false);
    if (!res.ok) { toast.error(res.error); return; }
    if (res.warning) toast.warning(res.warning); else toast.success("Appointment moved and the lead has been emailed.");
    onDone();
  };

  const blocked =
    error ||
    (info === null ? "Couldn't load this appointment." : null) ||
    (info && !appt ? "No booked time was found for this lead yet. Bookings made by the voice agent appear here once they are saved." : null) ||
    (info && appt && appt.provider !== "google" ? "Rescheduling is only available for Google Calendar bookings right now." : null) ||
    (info && !info.hasEmail ? "Add an email address to this lead first, so we can tell them about the change." : null);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-white/5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Reschedule appointment</h2>
            <p className="text-sm text-slate-500 dark:text-[#888]">Move it up to 24 hours either way. We&apos;ll email {info?.firstName && info.firstName !== "there" ? info.firstName : "the lead"} the new time.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-900 dark:hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          {info === undefined ? (
            <p className="flex items-center gap-2 text-slate-500"><Loader2 size={14} className="animate-spin" /> Loading appointment...</p>
          ) : blocked ? (
            <p className="text-amber-600 dark:text-amber-400">{blocked}</p>
          ) : appt ? (
            <>
              <div className="rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 px-3 py-2.5">
                <p className="text-xs text-slate-500 dark:text-[#888]">Currently booked</p>
                <p className="font-medium text-slate-900 dark:text-white">{formatAppointmentTime(appt.start, appt.timeZone)}</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-[#888]">New time</label>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => quick(-DAY_MS)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5">−24 hours</button>
                  <button type="button" onClick={() => quick(DAY_MS)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5">+24 hours</button>
                  <input
                    type="datetime-local"
                    value={value}
                    min={toLocalInput(new Date(minMs))}
                    max={toLocalInput(new Date(maxMs))}
                    onChange={(e) => setValue(e.target.value)}
                    className="flex-1 min-w-[190px] bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                {value && !inRange && <p className="text-xs text-red-500">Pick a time within 24 hours of the booking, in the future.</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-500 dark:text-[#888]">Reason (optional, added to the message)</label>
                <textarea
                  value={reason}
                  maxLength={200}
                  rows={2}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. an emergency came up at the clinic"
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {preview && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-500 dark:text-[#888]">Message they will receive</p>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2.5 text-[13px] text-slate-700 dark:text-slate-300 whitespace-pre-line">
                    <p className="font-semibold text-slate-900 dark:text-white mb-1.5">{preview.subject}</p>
                    {preview.body}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-slate-200 dark:border-white/5">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#888] hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">Cancel</button>
          {appt && !blocked && (
            <button
              onClick={submit}
              disabled={!inRange || busy}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[color:var(--accent)] text-slate-900 rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              {busy ? "Moving..." : "Move appointment & email"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

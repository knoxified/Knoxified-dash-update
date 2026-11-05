"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, X } from "lucide-react";
import { getRecentCallLeads, type Lead } from "@/lib/actions/leads-actions";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { getSeenAt, markCallersSeen } from "@/lib/recent-callers-seen";

const FIRST_VISIT_WINDOW_MS = 7 * 86_400_000;

function lastActivity(l: Lead): number {
  const t = Date.parse(l.last_contact_at || l.created_at);
  return Number.isNaN(t) ? 0 : t;
}

// New callers since you last looked, shown like a push notification. Once you
// open it, dismiss it or visit Leads, it disappears until someone else calls.
export function RecentLeads() {
  const [fresh, setFresh] = useState<Lead[]>([]);

  const load = useCallback(async () => {
    try {
      const [{ seenAt }, data] = await Promise.all([getSeenAt(), getRecentCallLeads(5)]);
      // No marker yet: only surface the last week, not the whole call history.
      const since = seenAt ?? Date.now() - FIRST_VISIT_WINDOW_MS;
      setFresh(data.leads.filter((l) => lastActivity(l) > since));
    } catch {
      setFresh([]);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 30_000); // a new caller pops in without a reload
    return () => clearInterval(poll);
  }, [load]);

  async function seen() {
    setFresh([]);
    await markCallersSeen();
  }

  if (fresh.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {fresh.length === 1 ? "1 new caller" : `${fresh.length} new callers`}
        </h2>
        <div className="flex items-center gap-3">
          <Link
            href="/leads"
            onClick={seen}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--accent)] hover:opacity-80 transition-opacity"
          >
            View leads
            <ArrowRight size={14} />
          </Link>
          <button
            type="button"
            onClick={seen}
            aria-label="Dismiss"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-white/5">
        {fresh.map((l) => (
          <div key={l.id} className="py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {l.name || l.phone || "Unknown caller"}
              </p>
              <p className="text-[12px] text-slate-500 dark:text-[#888] truncate">
                {l.reason || l.last_call_summary || "No details yet"}
                {l.caller_tone ? ` · ${l.caller_tone}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {l.appointment_booked && <CalendarCheck size={15} className="text-emerald-500" aria-label="Appointment booked" />}
              <UrgencyBadge urgency={l.urgency} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

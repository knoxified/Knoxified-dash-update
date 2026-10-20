"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck } from "lucide-react";
import { getRecentCallLeads, type Lead } from "@/lib/actions/leads-actions";
import { UrgencyBadge } from "@/components/UrgencyBadge";

// The newest callers at a glance, with a link to the full Leads table.
export function RecentLeads() {
  const [data, setData] = useState<{ leads: Lead[]; total: number } | null>(null);

  useEffect(() => {
    getRecentCallLeads(5).then(setData).catch(() => setData(null));
  }, []);

  if (!data || data.leads.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent callers</h2>
        <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--accent)] hover:opacity-80 transition-opacity">
          View all leads{data.total > data.leads.length ? ` (${data.total})` : ""}
          <ArrowRight size={14} />
        </Link>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-white/5">
        {data.leads.map((l) => (
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

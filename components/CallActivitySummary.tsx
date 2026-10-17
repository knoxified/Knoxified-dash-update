"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCallActivity, type CallActivity } from "@/lib/actions/questions-actions";

// One plain-English line: what the agent did for the owner in the last 30 days,
// plus a nudge when callers have asked things it couldn't answer.
export function CallActivitySummary() {
  const [a, setA] = useState<CallActivity | null>(null);

  useEffect(() => {
    getCallActivity(30).then(setA).catch(() => setA(null));
  }, []);

  if (!a) return null;
  if (a.total === 0 && a.openQuestions === 0) return null;

  return (
    <div className="glass-card rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p className="text-sm text-slate-700 dark:text-white/70">
        Last 30 days: your agent answered{" "}
        <span className="font-semibold text-slate-900 dark:text-white">{a.total} {a.total === 1 ? "call" : "calls"}</span>
        {a.booked > 0 && (
          <>
            {" "}and booked <span className="font-semibold text-slate-900 dark:text-white">{a.booked}</span>
          </>
        )}
        .
      </p>
      {a.openQuestions > 0 && (
        <Link
          href="/questions"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--accent)] hover:opacity-80 transition-opacity"
        >
          {a.openQuestions} {a.openQuestions === 1 ? "question is" : "questions are"} waiting for your answer
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

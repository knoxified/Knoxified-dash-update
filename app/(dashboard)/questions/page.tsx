"use client";

import { useEffect, useState } from "react";
import { HelpCircle, Check, X, Inbox } from "lucide-react";
import {
  getPendingQuestions,
  answerQuestion,
  dismissQuestion,
  type PendingQuestion,
} from "@/lib/actions/questions-actions";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<PendingQuestion[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { questions, error } = await getPendingQuestions();
    setQuestions(questions);
    setError(error);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(id: string) {
    setBusyId(id);
    setRowError((e) => ({ ...e, [id]: "" }));
    const res = await answerQuestion(id, drafts[id] || "");
    setBusyId(null);
    if (!res.ok) {
      setRowError((e) => ({ ...e, [id]: res.error || "Could not save." }));
      return;
    }
    await load();
  }

  async function dismiss(id: string) {
    setBusyId(id);
    const res = await dismissQuestion(id);
    setBusyId(null);
    if (!res.ok) {
      setRowError((e) => ({ ...e, [id]: res.error || "Could not dismiss." }));
      return;
    }
    await load();
  }

  const open = questions.filter((q) => q.status === "open");
  const done = questions.filter((q) => q.status !== "open");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">Questions waiting</h1>
        <p className="text-slate-500 dark:text-[#888] text-sm max-w-2xl">
          When a caller asks something your agent doesn&apos;t know, it tells them your team will follow up and the question lands here.
          Answer it once and your agent knows the answer on every call from then on.
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-[color:var(--accent)] border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && open.length === 0 && (
        <div className="glass-card rounded-xl flex flex-col items-center text-center px-6 py-14 gap-2">
          <Inbox size={28} className="text-slate-400 dark:text-[#666]" />
          <p className="text-sm text-slate-500 dark:text-[#888]">
            Nothing waiting. New questions from callers will show up here.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {open.map((q) => (
          <div key={q.id} className="glass-card rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <HelpCircle size={18} className="text-[color:var(--accent)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{q.question}</p>
                  <p className="text-[12px] text-slate-500 dark:text-[#888] mt-1">
                    Asked {q.asked_count === 1 ? "once" : `${q.asked_count} times`} · last {new Date(q.last_asked_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismiss(q.id)}
                disabled={busyId === q.id}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors shrink-0"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
            <textarea
              value={drafts[q.id] || ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
              rows={2}
              maxLength={600}
              placeholder="Type the answer your agent should give callers..."
              className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-300 dark:border-white/10 text-sm text-slate-900 dark:text-white rounded-md px-3 py-2.5 focus:outline-none focus:border-[color:var(--accent)] transition-colors"
            />
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-red-500">{rowError[q.id]}</p>
              <button
                onClick={() => submit(q.id)}
                disabled={busyId === q.id || !(drafts[q.id] || "").trim()}
                className="px-4 py-2 bg-[color:var(--accent)] text-slate-900 text-sm font-semibold rounded-lg transition-all hover:opacity-90 disabled:opacity-40"
              >
                {busyId === q.id ? "Saving..." : "Save answer"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Handled</h2>
          {done.map((q) => (
            <div key={q.id} className="glass-card rounded-xl px-5 py-4 flex items-start gap-3">
              <Check size={16} className={q.status === "answered" ? "text-emerald-500 mt-0.5" : "text-slate-400 mt-0.5"} />
              <div className="min-w-0">
                <p className="text-sm text-slate-900 dark:text-white">{q.question}</p>
                <p className="text-[12px] text-slate-500 dark:text-[#888] mt-0.5 truncate">
                  {q.status === "answered" ? q.answer : "Dismissed"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

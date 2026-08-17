"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Phone, Mic, Inbox } from "lucide-react";
import { getCallTranscripts, type CallTranscript } from "@/lib/actions/conversations-actions";

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function previewFor(t: CallTranscript): string {
  const firstUserMsg = t.messages.find((m) => m.role === "user");
  return firstUserMsg?.content || "No speech captured for this call.";
}

export default function ConversationsPage() {
  const [transcripts, setTranscripts] = useState<CallTranscript[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { transcripts, error } = await getCallTranscripts();
      setTranscripts(transcripts);
      if (transcripts.length > 0) setSelectedId(transcripts[0].id);
      setError(error);
      setLoading(false);
    }
    load();
  }, []);

  const selected = transcripts.find((t) => t.id === selectedId) || null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
            Conversations Log
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm">
            Audit and review call transcripts from your AI voice agent.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden flex flex-col md:flex-row shadow-sm">
        <div className="w-full md:w-80 border-r border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#020617]/50 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-white/5">
            <input
              type="text"
              placeholder="Search logs..."
              className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-300 dark:border-white/10 text-sm text-slate-900 dark:text-white rounded-md px-3 py-2.5 focus:outline-none focus:border-sky-600 dark:border-[#00E5FF]"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"></div>
              </div>
            )}

            {!loading && transcripts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
                <Inbox size={28} className="text-slate-400 dark:text-[#666]" />
                <p className="text-sm text-slate-500 dark:text-[#888]">
                  No calls yet. Transcripts will show up here once your voice agent starts taking calls.
                </p>
              </div>
            )}

            {transcripts.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`p-4 rounded-lg mb-1 cursor-pointer transition-colors ${
                  t.id === selectedId
                    ? "bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10"
                    : "hover:bg-slate-200 dark:hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-sky-600 dark:text-[#00E5FF]" />
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white">
                      {t.caller_number || "Unknown caller"}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-[#666]">
                    {formatRelativeTime(t.created_at)}
                  </span>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-[#888] truncate">{previewFor(t)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#020617]/30 h-[600px] md:h-auto">
          {!selected && !loading && (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-500 dark:text-[#888]">
              {transcripts.length === 0 ? "No calls to show yet." : "Select a call to view its transcript."}
            </div>
          )}

          {selected && (
            <>
              <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#0F172A]/50">
                <div>
                  <h3 className="text-slate-900 dark:text-white font-semibold text-base">
                    {selected.caller_number || "Unknown caller"}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-[#888] mt-1">
                    {formatDuration(selected.duration_secs)}
                    {selected.provider ? ` • via ${selected.provider}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {selected.messages.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-[#888]">
                    This call didn&apos;t capture any speech (e.g. it may have gone unanswered).
                  </p>
                )}

                {selected.messages.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="flex gap-4 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                        <Phone size={14} className="text-emerald-600 dark:text-[#10B981]" />
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-[12px] font-bold text-slate-500 dark:text-[#888] mb-1">Customer</p>
                        <div className="bg-[#00E5FF] text-slate-900 dark:text-white p-3.5 rounded-2xl rounded-tr-sm text-[14px] leading-relaxed shadow-sm shadow-[#00E5FF]/20">
                          {m.content}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-[#0F172A] border border-sky-600 dark:border-[#00E5FF]/30 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(79,140,255,0.2)]">
                        <Mic size={14} className="text-sky-600 dark:text-[#00E5FF]" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-slate-500 dark:text-[#888] mb-1">AI Agent</p>
                        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white/90 p-3.5 rounded-2xl rounded-tl-sm text-[14px] leading-relaxed shadow-sm">
                          {m.content}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">Couldn&apos;t load conversations: {error}</p>
      )}
    </div>
  );
}

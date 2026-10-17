"use server";

import { createClient } from "@/lib/supabase/server";

export type PendingQuestion = {
  id: string;
  question: string;
  asked_count: number;
  status: "open" | "answered" | "dismissed";
  answer: string | null;
  last_asked_at: string;
  created_at: string;
};

export type CallActivity = {
  total: number;
  booked: number;
  escalated: number;
  openQuestions: number;
};

async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getPendingQuestions(): Promise<{ questions: PendingQuestion[]; error: string | null }> {
  const { supabase, user } = await authed();
  if (!user) return { questions: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("pending_questions")
    .select("id, question, asked_count, status, answer, last_asked_at, created_at")
    .eq("user_id", user.id)
    .order("last_asked_at", { ascending: false })
    .limit(100);

  if (error) return { questions: [], error: error.message };
  const rows = (data as PendingQuestion[]) || [];
  // Open first, then answered, then dismissed.
  const rank = { open: 0, answered: 1, dismissed: 2 } as const;
  rows.sort((a, b) => rank[a.status] - rank[b.status]);
  return { questions: rows, error: null };
}

// Saves the owner's answer AND teaches the agent: the Q&A is appended to the
// same `faqs` list the website scan fills, which the agent reads every call.
export async function answerQuestion(id: string, answer: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "Not authenticated" };

  const text = answer.trim();
  if (text.length < 2) return { ok: false, error: "Type an answer first." };
  if (text.length > 600) return { ok: false, error: "Keep the answer under 600 characters so the agent can say it naturally." };

  const { data: row, error: readErr } = await supabase
    .from("pending_questions")
    .select("id, question, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readErr || !row) return { ok: false, error: "Question not found." };
  if (row.status !== "open") return { ok: false, error: "This question was already handled." };

  // 1) Teach the agent first. If this fails nothing is marked answered.
  const { data: cfg, error: cfgErr } = await supabase
    .from("agent_configs")
    .select("faqs")
    .eq("user_id", user.id)
    .maybeSingle();
  if (cfgErr) return { ok: false, error: cfgErr.message };
  if (!cfg) return { ok: false, error: "Set up your agent in Agent Config first." };

  const faqs = Array.isArray(cfg.faqs) ? cfg.faqs : [];
  const { error: faqErr } = await supabase
    .from("agent_configs")
    .update({ faqs: [{ q: row.question, a: text }, ...faqs] })
    .eq("user_id", user.id);
  if (faqErr) return { ok: false, error: faqErr.message };

  // 2) Mark the question answered.
  const { error: updErr } = await supabase
    .from("pending_questions")
    .update({ status: "answered", answer: text, answered_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (updErr) return { ok: false, error: updErr.message };

  return { ok: true };
}

export async function dismissQuestion(id: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "Not authenticated" };
  const { error } = await supabase
    .from("pending_questions")
    .update({ status: "dismissed" })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "open");
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function getCallActivity(days = 30): Promise<CallActivity> {
  const { supabase, user } = await authed();
  const empty = { total: 0, booked: 0, escalated: 0, openQuestions: 0 };
  if (!user) return empty;

  const since = new Date(Date.now() - days * 86400000).toISOString();
  const [calls, qs] = await Promise.all([
    supabase.from("call_transcripts").select("outcome").eq("user_id", user.id).gte("created_at", since).limit(2000),
    supabase.from("pending_questions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "open"),
  ]);

  const rows = (calls.data as { outcome: string | null }[]) || [];
  // Calls that hung up before saying anything are not counted as "answered".
  const real = rows.filter((r) => r.outcome !== "abandoned");
  return {
    total: real.length,
    booked: rows.filter((r) => r.outcome === "booked").length,
    escalated: rows.filter((r) => r.outcome === "escalated").length,
    openQuestions: qs.count || 0,
  };
}

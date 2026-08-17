"use server";

import { createClient } from "@/lib/supabase/server";

export type CallTranscriptMessage = {
  role: "user" | "assistant" | string;
  content: string;
};

export type CallTranscript = {
  id: string;
  call_id: string;
  caller_number: string | null;
  provider: string | null;
  duration_secs: number;
  messages: CallTranscriptMessage[];
  created_at: string;
};

export async function getCallTranscripts(): Promise<{
  transcripts: CallTranscript[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { transcripts: [], error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("call_transcripts")
    .select("id, call_id, caller_number, provider, duration_secs, messages, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return { transcripts: [], error: error.message };
  }

  return { transcripts: (data as CallTranscript[]) || [], error: null };
}

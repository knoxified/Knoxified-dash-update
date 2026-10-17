"use server";

import { createClient } from "@/lib/supabase/server";

// Plays the agent's greeting. With voiceId/agentName it previews that voice
// and the name currently typed on screen WITHOUT saving anything, so owners
// can compare several voices quickly.
export async function previewAgentVoice(
  opts: { voiceId?: string; agentName?: string } = {}
): Promise<{ audioDataUrl?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { error: "Not authenticated" };
  }

  const voiceAgentUrl = process.env.NEXT_PUBLIC_VOICE_AGENT_URL;
  if (!voiceAgentUrl) {
    return { error: "Voice agent URL isn't configured." };
  }

  try {
    const res = await fetch(`${voiceAgentUrl}/voice/preview`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ voiceId: opts.voiceId, agentName: opts.agentName }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return { error: `Preview failed (${res.status}). Try again in a moment.` };
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return { audioDataUrl: `data:audio/mpeg;base64,${base64}` };
  } catch (err: any) {
    return { error: `Preview failed: ${err.message || "request timed out"}` };
  }
}

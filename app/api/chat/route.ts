import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Support-oriented, not sales-oriented -- this runs inside the logged-in
// dashboard, so the person is already a trial or paying user. Their
// question is almost always "how do I do X" or "why isn't Y working," not
// "should I sign up." Kept deliberately honest about what it can't help
// with (account-specific billing/technical issues) rather than guessing.
const SYSTEM_PROMPT = `You are the in-dashboard support assistant for Knoxified, an AI voice agent and automation platform. The person asking is already a logged-in trial or paying customer, not a prospect.

WHAT THE DASHBOARD DOES: Lets a customer configure their AI voice agent (name, avatar, greeting, business hours, main call-to-action), enable automations (like LeadReach for lead search, MailCraft for cold email sequences, AppointMate for appointment booking), view call transcripts and recordings (if enabled), and manage their plan/billing.

PLANS: Trial (free, no card required), Starter, Pro, Enterprise -- each with different automation slots and usage limits. Exact current limits and prices can change, so if asked for a specific number you're not certain of, say so honestly rather than guessing, and suggest they check the Billing page.

TONE: Direct, calm, helpful -- like a competent support person, not a salesperson. No exclamation marks, no hype.

WHAT TO DO IF UNSURE: For anything account-specific (their exact usage, billing status, a bug affecting only them), say you can't see their specific account details and point them to reach out through support rather than guessing an answer. Never invent a number, status, or troubleshooting step you're not confident about -- for a paying customer, a wrong answer is worse than "I'm not sure, here's who can help."

Keep answers short -- 2-4 sentences unless the question genuinely needs more.`;

async function tryGemini(messages: { role: string; content: string }[]): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = messages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join("\n") + "\nAssistant:";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    const text = response.text;
    return text && text.trim().length > 0 ? text : null;
  } catch (err) {
    console.error("Gemini chat error (falling back to OpenRouter):", err);
    return null;
  }
}

async function tryOpenRouter(messages: { role: string; content: string }[]): Promise<string | null> {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        ],
      }),
    });

    if (!res.ok) {
      console.error("OpenRouter fallback error:", res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return text && text.trim().length > 0 ? text : null;
  } catch (err) {
    console.error("OpenRouter fallback threw:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ text: "What can I help you with?" });
    }

    const text = (await tryGemini(messages)) ?? (await tryOpenRouter(messages));

    if (!text) {
      return NextResponse.json({
        text: "I'm having trouble connecting right now. Please try again in a moment, or reach out through support.",
      });
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { text: "Something went wrong on my end. Please try again." },
      { status: 500 }
    );
  }
}

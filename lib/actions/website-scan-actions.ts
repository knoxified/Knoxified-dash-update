"use server";

import { createClient } from "@/lib/supabase/server";

const MAX_FETCH_BYTES = 500_000; // don't pull down huge pages
const MAX_TEXT_CHARS = 6000; // keep the LLM prompt small/cheap

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(input: string): string | null {
  let url = input.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function scanWebsite(rawUrl: string): Promise<{ summary?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const url = normalizeUrl(rawUrl);
  if (!url) return { error: "Enter a valid website URL." };

  let html: string;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "KnoxifiedBot/1.0 (+https://knoxified.org)" },
    });
    if (!res.ok) return { error: `Couldn't reach that site (HTTP ${res.status}).` };
    const reader = res.body?.getReader();
    if (!reader) {
      html = await res.text();
    } else {
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (total < MAX_FETCH_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          total += value.length;
        }
      }
      html = new TextDecoder().decode(
        chunks.reduce((acc, c) => new Uint8Array([...acc, ...c]), new Uint8Array())
      );
    }
  } catch (err: any) {
    return { error: `Couldn't reach that site: ${err.message || "request failed"}` };
  }

  const text = stripHtml(html).slice(0, MAX_TEXT_CHARS);
  if (text.length < 100) {
    return { error: "Couldn't find enough readable text on that page to summarize." };
  }

  if (!process.env.GROQ_API_KEY) {
    return { error: "Website summarization isn't configured yet (missing GROQ_API_KEY)." };
  }

  try {
    const llmRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        temperature: 0.3,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              "You write short business summaries for an AI phone receptionist's memory. Given raw website text, produce a concise summary (150-250 words, plain prose, no markdown) covering: what the business does, services/products offered, and anything about hours, location, or pricing if mentioned. Do not invent facts not present in the text.",
          },
          { role: "user", content: text },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!llmRes.ok) {
      const errBody = await llmRes.text();
      console.error("[scanWebsite] Groq error:", errBody);
      return { error: "Summarization failed. Please try again." };
    }

    const data = await llmRes.json();
    const summary = data?.choices?.[0]?.message?.content?.trim();
    if (!summary) return { error: "Summarization returned nothing usable." };

    return { summary };
  } catch (err: any) {
    return { error: `Summarization failed: ${err.message || "request failed"}` };
  }
}

"use server";

import { createClient } from "@/lib/supabase/server";

// Deep website scan for the agent's business memory.
//
// Reads the homepage plus a handful of same-site pages that usually hold the
// useful facts (services, pricing, contact, FAQ, about), pulls any structured
// FAQ data the site publishes, asks the model for a structured brief, and SAVES
// the result to the owner's agent_configs row straight away, so it is still
// there when they come back to the page. Owner edits are saved with
// saveWebsiteKnowledge().

const MAX_PAGE_BYTES = 400_000;
const MAX_EXTRA_PAGES = 5;
const HOME_CHARS = 4500;
const PAGE_CHARS = 2500;
const TOTAL_CHARS = 14_000;

const MAX_SUMMARY_CHARS = 4000;
const MAX_FAQS = 40;

export interface Faq {
  id: string;
  q: string;
  a: string;
  /** "scan" = written by a website scan, "manual" = written or edited by the owner */
  source: "scan" | "manual";
}

export type ScanResult =
  | { error: string }
  | { error?: undefined; url: string; summary: string; faqs: Faq[]; scannedAt: string; pagesRead: number };

// ---------------------------------------------------------------- helpers

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(input: string): string | null {
  let url = input.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    return new URL(url).toString();
  } catch {
    return null;
  }
}

// Keep the scanner from being pointed at internal addresses.
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || h === "[::1]") return true;
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  return false;
}

async function fetchPage(url: string, timeoutMs: number): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": "KnoxifiedBot/1.0 (+https://knoxified.org)", Accept: "text/html,application/xhtml+xml" },
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    if (type && !/text\/html|application\/xhtml/i.test(type)) return null;

    const reader = res.body?.getReader();
    if (!reader) return (await res.text()).slice(0, MAX_PAGE_BYTES);
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_PAGE_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.length;
      }
    }
    reader.cancel().catch(() => {});
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }
    return new TextDecoder().decode(merged);
  } catch {
    return null;
  }
}

const USEFUL_PATH = /(about|service|treatment|procedure|pricing|price|fee|cost|rate|plan|contact|faq|question|hours|location|visit|team|insurance|payment|menu|book|appointment|emergency)/i;
const SKIP_EXT = /\.(pdf|jpe?g|png|gif|svg|webp|zip|docx?|xlsx?|mp4|mp3|ico|css|js)(\?|$)/i;

function sameSite(a: string, b: string): boolean {
  const strip = (h: string) => h.replace(/^www\./, "");
  return strip(new URL(a).hostname) === strip(new URL(b).hostname);
}

function pickLinks(html: string, base: string): string[] {
  const found = new Map<string, number>();
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let abs: URL;
    try {
      abs = new URL(m[1], base);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(abs.protocol) || !sameSite(abs.toString(), base) || SKIP_EXT.test(abs.pathname)) continue;
    abs.hash = "";
    abs.search = "";
    const key = abs.toString().replace(/\/$/, "");
    if (key === base.replace(/\/$/, "")) continue;
    const label = stripHtml(m[2]).slice(0, 60);
    if (USEFUL_PATH.test(abs.pathname) || USEFUL_PATH.test(label)) {
      // shallower paths first: they are usually the main section pages
      found.set(key, abs.pathname.split("/").filter(Boolean).length);
    }
  }
  return [...found.entries()].sort((a, b) => a[1] - b[1]).slice(0, MAX_EXTRA_PAGES).map(([u]) => u);
}

function pageMeta(html: string): string {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
  const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || "";
  return stripHtml(`${title}. ${desc}`).slice(0, 300);
}

// FAQ pairs the site itself publishes as schema.org FAQPage JSON-LD.
function extractJsonLdFaqs(html: string): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  const walk = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    const type = node["@type"];
    const isQuestion = type === "Question" || (Array.isArray(type) && type.includes("Question"));
    if (isQuestion && node.name && node.acceptedAnswer?.text) {
      out.push({ q: stripHtml(String(node.name)), a: stripHtml(String(node.acceptedAnswer.text)) });
    }
    for (const v of Object.values(node)) walk(v);
  };
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(m[1].trim()));
    } catch {
      /* malformed JSON-LD, ignore */
    }
  }
  return out;
}

function clean(s: unknown, max: number): string {
  return String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function newId(): string {
  return crypto.randomUUID();
}

function normQ(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------- scan

export async function scanWebsite(rawUrl: string): Promise<ScanResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const url = normalizeUrl(rawUrl);
  if (!url) return { error: "Enter a valid website URL." };
  if (isBlockedHost(new URL(url).hostname)) return { error: "That address can't be scanned." };

  if (!process.env.GROQ_API_KEY) {
    return { error: "Website scanning isn't configured yet (missing GROQ_API_KEY)." };
  }

  const homeHtml = await fetchPage(url, 10_000);
  if (!homeHtml) return { error: "Couldn't reach that site. Check the address and try again." };

  const extraUrls = pickLinks(homeHtml, url);
  const extra = await Promise.all(extraUrls.map((u) => fetchPage(u, 8_000).then((h) => (h ? { u, h } : null))));
  const pages = [
    { u: url, h: homeHtml, limit: HOME_CHARS },
    ...extra.filter((p): p is { u: string; h: string } => !!p).map((p) => ({ ...p, limit: PAGE_CHARS })),
  ];

  const siteFaqs: { q: string; a: string }[] = [];
  let corpus = "";
  for (const p of pages) {
    siteFaqs.push(...extractJsonLdFaqs(p.h));
    const text = stripHtml(p.h).slice(0, p.limit);
    if (text.length < 40) continue;
    const path = new URL(p.u).pathname || "/";
    corpus += `\n## Page ${path}\n${pageMeta(p.h)}\n${text}\n`;
    if (corpus.length >= TOTAL_CHARS) break;
  }
  corpus = corpus.slice(0, TOTAL_CHARS);
  if (corpus.replace(/\s/g, "").length < 150) {
    return { error: "Couldn't find enough readable text on that site to learn from." };
  }

  const knownFaqs = siteFaqs
    .slice(0, 15)
    .map((f) => `Q: ${clean(f.q, 200)}\nA: ${clean(f.a, 400)}`)
    .join("\n");

  const system = `You read the text of a business's website to brief an AI phone receptionist. Use ONLY facts stated in the text. If something is not stated, leave it empty; never guess or invent.
Reply with JSON only (no markdown), exactly this shape:
{"summary": string, "hours": string, "location": string, "phone": string, "services": string[], "pricing": string, "faqs": [{"q": string, "a": string}]}
- summary: 120-220 words of plain prose on what the business does, who it serves and what it offers.
- hours, location, phone: exactly as the site states them, else "".
- services: up to 12 short names.
- pricing: prices, fees, free consultations, insurance and payment information if stated, else "".
- faqs: 10 to 15 questions a caller would most likely ask, each answered in at most two short sentences from the text. Start with the site's own FAQs if provided. Skip a question rather than guess its answer.`;

  let parsed: any;
  try {
    const llmRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        temperature: 0.2,
        max_tokens: 3500,
        reasoning_effort: "low",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `${knownFaqs ? `Known FAQs from the site:\n${knownFaqs}\n\n` : ""}Website text:\n${corpus}` },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!llmRes.ok) {
      console.error("[scanWebsite] Groq error:", await llmRes.text());
      return { error: "Summarization failed. Please try again." };
    }
    const data = await llmRes.json();
    const text: string = data?.choices?.[0]?.message?.content || "";
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return { error: "Summarization returned nothing usable." };
    parsed = JSON.parse(json);
  } catch (err: any) {
    return { error: `Summarization failed: ${err.message || "request failed"}` };
  }

  // One editable block for the agent: the prose plus the hard facts.
  const parts: string[] = [clean(parsed.summary, 1800)];
  if (clean(parsed.hours, 200)) parts.push(`Hours: ${clean(parsed.hours, 200)}`);
  if (clean(parsed.location, 200)) parts.push(`Location: ${clean(parsed.location, 200)}`);
  if (clean(parsed.phone, 60)) parts.push(`Phone: ${clean(parsed.phone, 60)}`);
  const services = Array.isArray(parsed.services)
    ? parsed.services.map((s: unknown) => clean(s, 60)).filter(Boolean).slice(0, 12)
    : [];
  if (services.length) parts.push(`Services: ${services.join(", ")}`);
  if (clean(parsed.pricing, 500)) parts.push(`Pricing: ${clean(parsed.pricing, 500)}`);
  const summary = parts.filter(Boolean).join("\n").slice(0, MAX_SUMMARY_CHARS);
  if (summary.length < 40) return { error: "Summarization returned nothing usable." };

  // Existing owner-written FAQs always survive a rescan.
  const { data: existing } = await supabase.from("agent_configs").select("faqs").eq("user_id", user.id).maybeSingle();
  const manual: Faq[] = (Array.isArray(existing?.faqs) ? existing!.faqs : []).filter(
    (f: Faq) => f?.source === "manual" && f.q && f.a
  );
  const taken = new Set(manual.map((f) => normQ(f.q)));

  const scanned: Faq[] = [];
  const candidates: { q: string; a: string }[] = [...siteFaqs, ...(Array.isArray(parsed.faqs) ? parsed.faqs : [])];
  for (const f of candidates) {
    const q = clean(f?.q, 300);
    const a = clean(f?.a, 800);
    if (!q || !a || taken.has(normQ(q))) continue;
    taken.add(normQ(q));
    scanned.push({ id: newId(), q, a, source: "scan" });
    if (manual.length + scanned.length >= MAX_FAQS) break;
  }
  const faqs = [...manual, ...scanned];
  const scannedAt = new Date().toISOString();

  const save = await persist(supabase, user.id, {
    website_url: url,
    website_summary: summary,
    website_scanned_at: scannedAt,
    faqs,
  });
  if (save.error) return { error: save.error };

  return { url, summary, faqs, scannedAt, pagesRead: pages.length };
}

// ---------------------------------------------------------------- save edits

export async function saveWebsiteKnowledge(summary: string, faqs: Faq[]): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const cleanFaqs: Faq[] = [];
  for (const f of Array.isArray(faqs) ? faqs : []) {
    const q = clean(f?.q, 300);
    const a = clean(f?.a, 800);
    if (!q || !a) continue; // half-filled rows are dropped
    cleanFaqs.push({ id: clean(f?.id, 64) || newId(), q, a, source: f?.source === "scan" ? "scan" : "manual" });
    if (cleanFaqs.length >= MAX_FAQS) break;
  }

  const res = await persist(supabase, user.id, {
    website_summary: String(summary ?? "").trim().slice(0, MAX_SUMMARY_CHARS),
    faqs: cleanFaqs,
  });
  return res.error ? { error: res.error } : { ok: true };
}

async function persist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  fields: Record<string, unknown>
): Promise<{ error?: string }> {
  const payload = { ...fields, updated_at: new Date().toISOString() };
  const { data: row } = await supabase.from("agent_configs").select("id").eq("user_id", userId).maybeSingle();
  const res = row
    ? await supabase.from("agent_configs").update(payload).eq("id", row.id)
    : await supabase.from("agent_configs").insert({ ...payload, user_id: userId });
  if (res.error) {
    console.error("[website-knowledge] save failed:", res.error.message);
    return { error: "Couldn't save to your account: " + res.error.message };
  }
  return {};
}

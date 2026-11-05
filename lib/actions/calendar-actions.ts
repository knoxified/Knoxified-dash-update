"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from "@/lib/supabase/server";

// Calendar connections that use an API key instead of OAuth (Cal.com now; Calendly etc. later), and the
// per-account choice of which calendar the voice agent books into (agent_configs.calendar_provider).
//
// The key never touches the browser after the form submit: this server action checks the signed-in user,
// then talks to knoxified-auth through the service binding with the shared CONNECT_API_KEY secret.

export type CalendarProvider = "google" | "calcom";
const PROVIDERS: CalendarProvider[] = ["google", "calcom"];

export type EventTypeOption = { id: number; slug: string | null; title: string | null; lengthMinutes: number | null; hidden: boolean };
export type CalendarSettings = {
  provider: CalendarProvider;
  calcom: null | { email: string | null; username: string | null; eventTypeTitle: string | null; lengthMinutes: number | null; timeZone: string | null };
  googleConnected: boolean;
};

const ERRORS: Record<string, string> = {
  invalid_api_key: "Cal.com didn't accept that API key. Copy it again from Cal.com → Settings → Developer → API keys.",
  calcom_unavailable: "Couldn't reach Cal.com just now. Please try again in a minute.",
  invalid_event_type: "Pick one of your Cal.com event types.",
  not_configured: "Cal.com connections aren't switched on for this server yet.",
  unauthorized: "Cal.com connections aren't switched on for this server yet.",
};
const friendly = (code?: string) => ERRORS[code || ""] || "Something went wrong connecting Cal.com. Please try again.";

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

async function callAuth(path: string, body: unknown): Promise<{ status: number; json: any }> {
  const { env } = getCloudflareContext() as any;
  const key = env?.CONNECT_API_KEY || process.env.CONNECT_API_KEY;
  if (!key) return { status: 503, json: { error: "not_configured" } };
  try {
    const res = await env.OAUTH.fetch(`https://knoxified-auth.internal${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-connect-key": key },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  } catch {
    return { status: 502, json: { error: "calcom_unavailable" } };
  }
}

// Step 1: check the pasted key and list the event types to choose from (nothing is saved yet).
export async function lookupCalcomKeyAction(apiKey: string): Promise<
  { ok: true; account: { username: string | null; email: string | null; timeZone: string | null }; eventTypes: EventTypeOption[] } | { ok: false; error: string }
> {
  const { user } = await currentUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { status, json } = await callAuth("/auth/calcom/event-types", { apiKey });
  if (status !== 200) return { ok: false, error: friendly(json?.error) };
  return { ok: true, account: json.account, eventTypes: json.eventTypes || [] };
}

// Step 2: save the connection with the chosen event type, and make Cal.com the voice agent's calendar.
export async function connectCalcomAction(apiKey: string, eventTypeId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user } = await currentUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { status, json } = await callAuth("/auth/calcom/connect", { userId: user.id, apiKey, eventTypeId, setAsCalendar: true });
  if (status !== 200) return { ok: false, error: friendly(json?.error) };
  return { ok: true };
}

export async function disconnectCalcomAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user } = await currentUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { status } = await callAuth("/auth/calcom/disconnect", { userId: user.id });
  return status === 200 ? { ok: true } : { ok: false, error: "Couldn't disconnect Cal.com. Please try again." };
}

const OAUTH_PROVIDERS = ["google", "microsoft", "zoho", "slack", "github", "notion", "meta", "linkedin"];

// Disconnects an OAuth app for the signed-in user. knoxified-auth revokes the
// grant at the provider where it can (Google) and deletes the stored tokens.
export async function disconnectOAuthAction(provider: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user } = await currentUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  if (!OAUTH_PROVIDERS.includes(provider)) return { ok: false, error: "Unknown app." };
  const { status } = await callAuth(`/auth/${provider}/disconnect`, { userId: user.id });
  return status === 200 ? { ok: true } : { ok: false, error: "Couldn't disconnect. Please try again." };
}

export async function getCalendarSettingsAction(): Promise<CalendarSettings> {
  const empty: CalendarSettings = { provider: "google", calcom: null, googleConnected: false };
  const { supabase, user } = await currentUser();
  if (!user) return empty;

  const [{ data: cfg }, { data: conns }] = await Promise.all([
    supabase.from("agent_configs").select("calendar_provider").eq("user_id", user.id).maybeSingle(),
    // Never select the token columns: the browser only needs to know a connection exists.
    supabase.from("oauth_connections").select("provider, status, provider_email, metadata, created_at").eq("user_id", user.id).in("provider", ["google", "calcom"]).order("created_at", { ascending: false }),
  ]);

  const active = (conns || []).filter((c: any) => c.status === "active");
  const cal: any = active.find((c: any) => c.provider === "calcom");
  const provider = PROVIDERS.includes(cfg?.calendar_provider as CalendarProvider) ? (cfg!.calendar_provider as CalendarProvider) : "google";
  return {
    provider,
    googleConnected: active.some((c: any) => c.provider === "google"),
    calcom: cal
      ? {
          email: cal.provider_email || null,
          username: cal.metadata?.username || null,
          eventTypeTitle: cal.metadata?.eventTypeTitle || null,
          lengthMinutes: cal.metadata?.lengthMinutes ?? null,
          timeZone: cal.metadata?.timeZone || null,
        }
      : null,
  };
}

// Which calendar the voice agent books into. Only a connected calendar can be chosen.
export async function setCalendarProviderAction(provider: CalendarProvider): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!PROVIDERS.includes(provider)) return { ok: false, error: "Unknown calendar." };
  const { supabase, user } = await currentUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const { data: conn } = await supabase
    .from("oauth_connections").select("id").eq("user_id", user.id).eq("provider", provider).eq("status", "active").limit(1);
  if (!conn || conn.length === 0) return { ok: false, error: "Connect that calendar first." };

  const { error } = await supabase.from("agent_configs").upsert({ user_id: user.id, calendar_provider: provider }, { onConflict: "user_id" });
  return error ? { ok: false, error: "Couldn't save that choice. Please try again." } : { ok: true };
}

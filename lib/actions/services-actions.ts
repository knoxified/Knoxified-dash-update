"use server";

import { createClient } from "@/lib/supabase/server";

// Services & prices the owner lists in Agent Config. The Overview uses them to
// estimate revenue: when an appointment's date passes without being cancelled,
// its appointment_type is matched to a service name and that price is added.
// Stored on agent_configs.services as [{ id, name, price }].

export interface ServicePrice {
  id: string;
  name: string;
  price: number;
}

const MAX_SERVICES = 60;

function clean(s: unknown, max: number): string {
  return String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function getServices(): Promise<{ services: ServicePrice[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { services: [], error: "Not authenticated" };

  const res = await supabase.from("agent_configs").select("*").eq("user_id", user.id).maybeSingle();
  const raw: any = res.data?.services;
  const services: ServicePrice[] = (Array.isArray(raw) ? raw : [])
    .map((s: any) => ({ id: clean(s?.id, 64) || crypto.randomUUID(), name: clean(s?.name, 120), price: Number(s?.price) || 0 }))
    .filter((s) => s.name);
  return { services };
}

export async function saveServices(services: ServicePrice[]): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const seen = new Set<string>();
  const cleaned: ServicePrice[] = [];
  for (const s of Array.isArray(services) ? services : []) {
    const name = clean(s?.name, 120);
    const price = Number(s?.price);
    if (!name || !Number.isFinite(price) || price < 0) continue; // half-filled rows are dropped
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push({ id: clean(s?.id, 64) || crypto.randomUUID(), name, price: Math.round(price * 100) / 100 });
    if (cleaned.length >= MAX_SERVICES) break;
  }

  const payload = { services: cleaned, updated_at: new Date().toISOString() };
  const { data: row } = await supabase.from("agent_configs").select("id").eq("user_id", user.id).maybeSingle();
  const res = row
    ? await supabase.from("agent_configs").update(payload).eq("id", row.id)
    : await supabase.from("agent_configs").insert({ ...payload, user_id: user.id });
  if (res.error) {
    console.error("[services] save failed:", res.error.message);
    return { error: "Couldn't save: " + res.error.message };
  }
  return { ok: true };
}

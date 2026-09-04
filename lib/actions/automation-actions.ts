"use server";

import { createClient, supabaseAdmin } from "@/lib/supabase/server";

export async function runAutomation(automationId: string, actionKey: string | null, payload: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Duplicate-account abuse lock: this account can browse the dashboard
  // fine, but can't spend credits/minutes until it upgrades to a paid plan.
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("credits_locked")
    .eq("id", user.id)
    .maybeSingle();

  if (userRow?.credits_locked) {
    return { success: false, error: "locked", locked: true };
  }

  // Here you would typically look up the webhook URL from your database
  // or use the automationId/actionKey to route the request to n8n/Python.
  // We'll simulate it for now.
  
  if (automationId === "appointmate") {
    if (actionKey === "check_availability") {
      return { 
        success: true, 
        data: [
          { time: "09:00 AM", status: "available" },
          { time: "10:00 AM", status: "booked" },
          { time: "11:00 AM", status: "available" }
        ] 
      };
    } else if (actionKey === "book_appointment") {
      return { 
        success: true, 
        data: { 
          confirmation_code: "APP-" + Math.floor(Math.random() * 10000),
          status: "Booked Successfully",
          client: payload.client_name,
          time: payload.datetime
        } 
      };
    }
  }

  return { success: false, error: "Coming soon! This automation doesn't have a live webhook yet." };
}

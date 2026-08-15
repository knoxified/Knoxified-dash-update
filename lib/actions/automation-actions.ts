"use server";

import { createClient } from "@/lib/supabase/server";

export async function runAutomation(automationId: string, actionKey: string | null, payload: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
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

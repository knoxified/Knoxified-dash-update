"use server";

import { createClient } from "@/lib/supabase/server";

export async function getTourStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { completed: true }; // don't show a tour to a logged-out view

  const { data, error } = await supabase
    .from("user_profiles")
    .select("dashboard_tour_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { completed: true }; // fail closed -- never block on this
  return { completed: Boolean(data?.dashboard_tour_completed) };
}

export async function completeDashboardTour() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("user_profiles")
    .update({ dashboard_tour_completed: true })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

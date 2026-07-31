"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateThemeAction(theme: string) {
  try {
    if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return;
    }
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.auth.updateUser({
        data: { theme }
      });
    }
  } catch (error) {
    // Ignore error
  }
}

export async function getUserThemeAction() {
  try {
    if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return null;
    }
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user && user.user_metadata?.theme) {
      return user.user_metadata.theme;
    }
  } catch (error) {
    return null;
  }
  return null;
}

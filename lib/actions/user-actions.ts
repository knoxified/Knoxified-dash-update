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

// First name for the dashboard greeting: the name they gave when signing up,
// else the first word of their email (a.b@x.com -> "A"), else nothing.
export async function getDisplayNameAction(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const tidy = (raw: unknown, fromEmail = false): string | null => {
      let text = String(raw || "").trim();
      if (!text) return null;
      if (fromEmail) text = text.split(/[._\-+\d]+/)[0] || "";
      const first = text.split(/\s+/)[0]?.replace(/[^\p{L}'-]/gu, "") || "";
      if (first.length < 2) return null;
      return first.charAt(0).toUpperCase() + first.slice(1);
    };

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    // Onboarding stores the email's local part when no name was typed; treat
    // that value the same as an email so it is cleaned up the same way.
    const stored = profile?.full_name ? String(profile.full_name) : "";
    const emailLocal = (user.email || "").split("@")[0];
    const looksLikeEmailLocal = stored && stored.toLowerCase() === emailLocal.toLowerCase();

    return (
      (!looksLikeEmailLocal ? tidy(stored) : null) ||
      tidy(user.user_metadata?.full_name || user.user_metadata?.name) ||
      tidy(emailLocal, true)
    );
  } catch {
    return null;
  }
}

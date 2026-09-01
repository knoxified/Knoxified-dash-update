import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // sessionStorage (not localStorage) means the session is tied to
      // this browser tab -- closing the tab clears it, forcing a fresh
      // login next time, instead of silently staying logged in forever.
      storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return client;
}

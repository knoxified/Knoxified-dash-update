import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  if (typeof window === "undefined") {
    // Server-render pass: there's no such thing as "this browser tab"
    // here, so sessionStorage doesn't apply anyway. Passing
    // storage: undefined explicitly (instead of omitting the option)
    // made createBrowserClient try to read from it during init and
    // throw during the Server Components render -- that's the crash
    // seen when opening an automation directly. Falling back to no
    // override lets @supabase/ssr use its own SSR-safe cookie storage.
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // sessionStorage (not localStorage) means the session is tied to
      // this browser tab -- closing the tab clears it, forcing a fresh
      // login next time, instead of silently staying logged in forever.
      storage: window.sessionStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

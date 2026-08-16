import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createClientJs } from "@supabase/supabase-js";

export async function createClient() {
  const cookieStore = await cookies();
  // Make sure we have env vars, otherwise we'll return a proxy that prevents crashing in dev
  const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "placeholder-key";

  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });

  return client;
}

// Keep a service role admin client only for trusted backend tasks (bypasses RLS)
export const supabaseAdmin = (() => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return createClientJs("https://placeholder.supabase.co", "placeholder-key");
  }

  return createClientJs(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
})();

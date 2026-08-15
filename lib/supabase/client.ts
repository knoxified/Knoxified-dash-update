import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  
  // Bypass login for real-time preview
  client.auth.getUser = async () => {
    return { data: { user: { id: "mock-user-123", email: "preview@knoxified.org" } as any }, error: null };
  };
  client.auth.getSession = async () => {
    return { data: { session: { user: { id: "mock-user-123", email: "preview@knoxified.org" } } as any }, error: null };
  };
  client.auth.onAuthStateChange = (() => {
    return { data: { subscription: { unsubscribe: () => {}, id: "mock-sub", callback: () => {} } } };
  }) as any;

  return client;
}

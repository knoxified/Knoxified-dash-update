import "server-only";
import { createClient } from "@supabase/supabase-js";

// This file is server-only ("server-only" package throws a build error
// if anything imports this from a "use client" component). The service
// role key must never reach the browser.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: any;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("[AI Studio] Database not connected — using mock");
  
  const mockChain: any = {
    select: () => mockChain,
    insert: () => mockChain,
    update: () => mockChain,
    delete: () => mockChain,
    eq: () => mockChain,
    order: () => mockChain,
    limit: () => mockChain,
    single: async () => ({
      data: {
        require_ai_disclosure: true,
        require_recording_disclosure: true,
        calling_window_start: "09:00:00",
        calling_window_end: "17:00:00",
        calling_window_timezone: "UTC"
      },
      error: null
    }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  };
  
  supabaseAdmin = new Proxy({}, {
    get: (_, prop) => {
      if (prop === 'from') {
        return () => mockChain;
      }
      return mockChain;
    }
  });
} else {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { supabaseAdmin };

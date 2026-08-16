const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_string: 'ALTER TABLE public.user_automations ALTER COLUMN automation_id TYPE text;'
  });
  console.log("Execute SQL Result:", data, error);
}
run();

const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('user_automations').insert({ user_id: '00000000-0000-0000-0000-000000000000', automation_id: 'leadreach', is_enabled: false }).select();
  console.log(error);
}
run();

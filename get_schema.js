const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

async function run() {
  const { data: i } = await supabase.from('integrations').select('*').limit(1);
  console.log("integrations:", i);
  const { data: p } = await supabase.from('phone_number_mappings').select('*').limit(1);
  console.log("phone_number_mappings:", p);
  const { data: o } = await supabase.from('oauth_sessions').select('*').limit(1);
  console.log("oauth_sessions:", o);
}
run();

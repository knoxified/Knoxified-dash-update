const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.rpc('get_schema_info'); // if rpc doesn't exist, we can just try querying one row
  const res1 = await supabase.from('agent_configs').select('*').limit(1);
  const res2 = await supabase.from('user_voice_settings').select('*').limit(1);
  console.log('agent_configs columns:', res1.data && res1.data.length > 0 ? Object.keys(res1.data[0]) : 'no data');
  console.log('user_voice_settings columns:', res2.data && res2.data.length > 0 ? Object.keys(res2.data[0]) : 'no data');
  if(res1.error) console.error(res1.error);
  if(res2.error) console.error(res2.error);
}
run();

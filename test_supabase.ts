import { supabaseAdmin } from "./lib/supabase/server";

async function main() {
    let res = await supabaseAdmin.from('automation_schedules').select('*').limit(1);
    console.log("automation_schedules:", res.error || res.data);
    
    let res2 = await supabaseAdmin.from('call_schedules').select('*').limit(1);
    console.log("call_schedules:", res2.error || res2.data);
}
main().catch(console.error);

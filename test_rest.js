const fs = require('fs');
const env = fs.readFileSync('.env.example', 'utf8');
const urlMatch = env.match(/SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const url = urlMatch ? urlMatch[1] : null;
const key = keyMatch ? keyMatch[1] : null;

if (!url || !key) {
    console.log("No env");
    process.exit(1);
}

fetch(`${url}/rest/v1/automation_schedules?select=*&limit=1`, {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
}).then(res => res.json()).then(console.log);

fetch(`${url}/rest/v1/call_schedules?select=*&limit=1`, {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
}).then(res => res.json()).then(console.log);

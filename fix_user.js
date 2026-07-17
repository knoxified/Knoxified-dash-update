const fs = require('fs');
let content = fs.readFileSync('components/ScheduleManager.tsx', 'utf8');

content = content.replace(
  'import { useUser } from "@/lib/supabase/client";',
  'const CURRENT_USER_ID = "ad409f1e-7150-4ed1-a4d1-ab5d523ab265";'
);

content = content.replace(/const \{ user \} = useUser\(\);\n/g, '');
content = content.replace(/user\!\.id/g, 'CURRENT_USER_ID');
content = content.replace(/\[user, type\]/g, '[type]');
content = content.replace(/if \(\!user\) return;\n/g, '');

fs.writeFileSync('components/ScheduleManager.tsx', content, 'utf8');

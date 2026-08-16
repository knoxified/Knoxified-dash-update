const fs = require('fs');
const path = '/app/applet/app/(dashboard)/automations/page.tsx';
let content = fs.readFileSync(path, 'utf8');

if(!content.includes('getUuidForId')) {
  // insert import right after use client
  content = content.replace(/"use client";\n?/, '"use client";\nimport { getUuidForId } from "@/lib/utils";\n');
}

// replace automation_id: aut.id with automation_id: getUuidForId(aut.id)
content = content.replace(/automation_id: aut\.id/g, 'automation_id: getUuidForId(aut.id)');
content = content.replace(/automation_id: activeAutomation\.id/g, 'automation_id: getUuidForId(activeAutomation.id)');

// replace map matching: userAutomationsMap.set(ua.automation_id, ua);
// replace map getting: userAutomationsMap.get(aut.id);
// Actually, earlier I saw userAutomationsMap.set(ua.automation_id, ua);
// Let's replace the retrieval.
content = content.replace(/userAutomationsMap\.get\(aut\.id\)/g, 'userAutomationsMap.get(getUuidForId(aut.id))');

fs.writeFileSync(path, content);

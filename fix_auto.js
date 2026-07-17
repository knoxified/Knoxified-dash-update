const fs = require('fs');
let content = fs.readFileSync('app/automations/[id]/page.tsx', 'utf8');

// Add import
content = content.replace(
  'import MailCraftBoard from "./MailCraftBoard";',
  'import MailCraftBoard from "./MailCraftBoard";\nimport ScheduleManager from "@/components/ScheduleManager";'
);

// Add to JSX
content = content.replace(
  /(\s*)\{id === "leadreach" \? \(/,
  `$1{id === "leadreach" ? (`
);

content = content.replace(
  /(\s*)\<\/div\>\s*\)\;\s*\}/,
  `\n      <ScheduleManager type="automation" targetId={id} />$1</div>\n  );\n}`
);

fs.writeFileSync('app/automations/[id]/page.tsx', content, 'utf8');

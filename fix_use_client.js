const fs = require('fs');
const path = '/app/applet/app/(dashboard)/automations/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove all occurrences of "use client"; and "use client"
content = content.replace(/"use client";\n?/g, '');
content = content.replace(/'use client';\n?/g, '');

// Prepend "use client"; at the very top
content = '"use client";\n' + content;

fs.writeFileSync(path, content);

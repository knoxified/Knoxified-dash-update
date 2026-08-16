const fs = require('fs');
const path = '/app/applet/app/(dashboard)/billing/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace workspace. with workspace?.
content = content.replace(/workspace\.planId/g, 'workspace?.planId');
content = content.replace(/workspace\.usage\.activeAutomations/g, '(workspace?.usage?.activeAutomations || 0)');
content = content.replace(/workspace\.usage\.voiceMinutes/g, '(workspace?.usage?.voiceMinutes || 0)');
content = content.replace(/workspace\.usage\.emailSent/g, '(workspace?.usage?.emailSent || 0)');
content = content.replace(/workspace\.usage\.credits/g, '(workspace?.usage?.credits || 0)');

fs.writeFileSync(path, content);

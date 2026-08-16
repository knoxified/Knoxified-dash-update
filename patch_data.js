const fs = require('fs');
const path = '/app/applet/lib/services/data.ts';
let content = fs.readFileSync(path, 'utf8');

// Add static import
const importStr = "import { getRealSystems, getDashboardStats, getRealWorkspace, getRealPlans, getRecentActivityLogs } from '../actions/dashboard-actions';\n";
content = importStr + content;

// Remove dynamic imports
content = content.replace(/const \{ getRealSystems \} = await import\('\.\.\/actions\/dashboard-actions'\);\n/g, '');
content = content.replace(/const \{ getDashboardStats \} = await import\('\.\.\/actions\/dashboard-actions'\);\n/g, '');
content = content.replace(/const \{ getRealWorkspace \} = await import\('\.\.\/actions\/dashboard-actions'\);\n/g, '');
content = content.replace(/const \{ getRealPlans \} = await import\('\.\.\/actions\/dashboard-actions'\);\n/g, '');
content = content.replace(/const \{ getRecentActivityLogs \} = await import\('\.\.\/actions\/dashboard-actions'\);\n/g, '');

fs.writeFileSync(path, content);

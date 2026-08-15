const fs = require('fs');
const content = fs.readFileSync('/app/applet/app/(dashboard)/agent-config/page.tsx', 'utf8');
try {
  require('acorn').parse(content, { ecmaVersion: 2020, sourceType: 'module' });
  console.log('Parses fine as JS');
} catch (e) {
  console.log('Parse error:', e.message);
}

const fs = require('fs');

function replaceFile(path, search, replace) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(path, content);
}

replaceFile(
  '/app/applet/app/(dashboard)/agent-config/page.tsx',
  /if \(!hasAccepted\) \{\s+setShowLegalDisclaimer\(true\);\s+\}/,
  'if (!hasAccepted) {\n        setTimeout(() => setShowLegalDisclaimer(true), 0);\n      }'
);

console.log("Fixed");

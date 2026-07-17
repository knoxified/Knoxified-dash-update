import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
        if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
            results = results.concat(walk(file));
        }
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
          results.push(file);
      }
    }
  });
  return results;
}

const files = walk('.');

const replacements = [
  { from: /#0B0D10/g, to: '#020617' }, // Deep Navy Background
  { from: /#161B22/g, to: '#0F172A' }, // Slate 900 Cards
  { from: /#4F8CFF/g, to: '#00E5FF' }, // Neon Cyan Accent to match video
  { from: /bg-\[#4F8CFF\]/g, to: 'bg-[#00E5FF]' }, 
  { from: /text-\[#4F8CFF\]/g, to: 'text-[#00E5FF]' },
  { from: /border-\[#4F8CFF\]/g, to: 'border-[#00E5FF]' }
];

let updatedFiles = 0;

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content;
  
  for (const { from, to } of replacements) {
    newContent = newContent.replace(from, to);
  }
  
  if (content !== newContent) {
    fs.writeFileSync(f, newContent);
    updatedFiles++;
  }
}

console.log(`Updated ${updatedFiles} files to match the deep navy and neon cyan theme from the video.`);

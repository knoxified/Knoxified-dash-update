const fs = require('fs');
const path = '/app/applet/app/(dashboard)/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `<div key={op.opType + '-' + op.id} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between">`;
const replace1 = `<div key={op.opType + '-' + op.id} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between shadow-[0_0_15px_rgba(16,185,129,0.05)] dark:shadow-[0_0_15px_rgba(16,185,129,0.02)]">
                {op.status === 'Active' && (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent dark:from-emerald-500/10 dark:to-transparent animate-pulse pointer-events-none"></div>
                )}`;

const target2 = `<span className={\`w-2 h-2 rounded-full \${op.status === 'Active' ? 'bg-[#10B981]' : 'bg-[#00E5FF]'}\`}></span>`;
const replace2 = `<div className="relative flex h-2 w-2">
                            <span className={\`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 \${op.status === 'Active' ? 'bg-[#10B981]' : 'bg-[#00E5FF]'}\`}></span>
                            <span className={\`relative inline-flex rounded-full h-2 w-2 \${op.status === 'Active' ? 'bg-[#10B981]' : 'bg-[#00E5FF]'}\`}></span>
                          </div>`;

content = content.replace(target1, replace1);
content = content.replace(target2, replace2);

fs.writeFileSync(path, content);

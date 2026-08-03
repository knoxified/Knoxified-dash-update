const fs = require('fs');
const file = '/app/applet/app/(dashboard)/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target2 = `          <div className="p-2 overflow-y-auto max-h-[400px]">
            {metrics.winsFeed
              .filter(win => logFilter === 'All' || win.system?.toLowerCase().includes(logFilter.toLowerCase()) || win.message?.toLowerCase().includes(logFilter.toLowerCase()))
              .map((win, i) => (
              <div 
                key={win.id} 
                className="flex gap-3 p-3 rounded-md hover:bg-white/[0.02] transition-colors group border-b border-slate-200 dark:border-white/5 last:border-0 relative animate-in slide-in-from-right-4 fade-in duration-500"
                style={{ animationDelay: \`\${i * 50}ms\`, animationFillMode: 'both' }}
              >
                <div className="mt-0.5 opacity-80">
                  <span className="text-emerald-600 dark:text-[#10B981] text-sm">✓</span>
                </div>
                <div className="flex-1">
                  <p className="text-[14px] text-slate-700 dark:text-[#EDEDED] leading-snug">
                    <span className="font-semibold text-slate-900 dark:text-white">{win.system}</span> {win.message}
                  </p>
                  <p className="text-slate-500 dark:text-[#888] text-[12px] mt-1.5 font-medium">{win.timeAgo}</p>
                </div>
              </div>
            ))}
          </div>`;

if (content.includes(target2)) {
  content = content.replace(target2, `          <ActivityFeed filter={logFilter} />`);
  fs.writeFileSync(file, content);
  console.log("Feed replaced");
} else {
  console.log("Feed not found exactly.");
}

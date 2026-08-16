const fs = require('fs');
let file = '/app/applet/dashboard_page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. imports
content = content.replace(
  'import { useDashboardMetrics, useSystemLogs, useSystems } from "@/lib/services/hooks";',
  'import { useDashboardMetrics, useSystemLogs, useSystems, useAutomations } from "@/lib/services/hooks";'
);

// 2. hook calls
content = content.replace(
  'const { data: systems, loading: systemsLoading } = useSystems();',
  'const { data: systems, loading: systemsLoading } = useSystems();\n  const { data: automations, loading: automationsLoading } = useAutomations();'
);

// 3. loading check
content = content.replace(
  'if ((metricsLoading && !metrics) || (logsLoading && !logs) || (systemsLoading && !systems)) {',
  'if ((metricsLoading && !metrics) || (logsLoading && !logs) || (systemsLoading && !systems) || (automationsLoading && !automations)) {'
);

// 4. data check and combining
content = content.replace(
  'if (!metrics || !logs || !systems) return null;\n\n  const activeSystems = systems.filter(s => s.status !== \'Offline\');',
  'if (!metrics || !logs || !systems || !automations) return null;\n\n  const activeSystemsList = systems.filter(s => s.status !== \'Offline\').map(s => ({ ...s, opType: \'system\' as const }));\n  const activeAutomationsList = automations.filter(a => a.enabled).map(a => ({ ...a, status: \'Active\', opType: \'automation\' as const }));\n  const activeOperations = [...activeSystemsList, ...activeAutomationsList];'
);

// 5. activeSystems.length in hero
content = content.replace(
  '{activeSystems.length}',
  '{activeOperations.length}'
);

const startIndex = content.indexOf('{activeSystems.slice(0, 3).map(system => {');
const endString = '          })}\n        </div>';
const endIndex = content.indexOf(endString, startIndex) + endString.length;

if (startIndex === -1 || content.indexOf(endString, startIndex) === -1) {
    console.log("Could not find start or end index.");
    process.exit(1);
}

const replacement = `{activeOperations.slice(0, 3).map(op => {
            let Icon = Building;
            if (op.opType === 'system') {
              if (op.id === 'recruitment') Icon = Users2;
              if (op.id === 'dental') Icon = Stethoscope;
            } else {
              Icon = Settings2;
            }

            return (
              <div key={op.opType + '-' + op.id} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500">
                    <Icon size={140} className="text-sky-600 dark:text-[#00E5FF]" />
                  </div>
                  
                  <div className="flex items-start justify-between mb-5 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-300 dark:border-white/10 flex items-center justify-center text-sky-600 dark:text-[#00E5FF]">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="text-slate-900 dark:text-white font-semibold text-base">{op.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={\`w-2 h-2 rounded-full \${op.status === 'Active' ? 'bg-[#10B981]' : 'bg-[#00E5FF]'}\`}></span>
                          <span className="text-[12px] text-slate-500 dark:text-[#888] font-medium">{op.status} ({op.opType === 'system' ? 'System' : 'Automation'})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 relative z-10">
                    {op.opType === 'system' ? (
                      <>
                        <p className="text-[12px] text-emerald-600 dark:text-[#10B981] font-medium mb-1">Revenue Impact</p>
                        <p className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format((op as any).revenueImpact || 0)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[12px] text-sky-600 dark:text-sky-400 font-medium mb-1">Category</p>
                        <p className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">{(op as any).category || 'Automation'}</p>
                      </>
                    )}
                  </div>

                  <div className={\`grid \${op.opType === 'system' ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mb-5 relative z-10 border-t border-slate-200 dark:border-white/5 pt-5\`}>
                     <div>
                       <p className="text-[12px] text-slate-500 dark:text-[#888] font-medium mb-0.5">{op.metrics?.label1}</p>
                       <p className="text-sm text-slate-900 dark:text-white font-medium">{op.metrics?.value1}</p>
                     </div>
                     <div>
                       <p className="text-[12px] text-slate-500 dark:text-[#888] font-medium mb-0.5">{op.metrics?.label2}</p>
                       <p className="text-sm text-slate-900 dark:text-white font-medium">{op.metrics?.value2}</p>
                     </div>
                     {op.opType === 'system' && (
                       <div>
                         <p className="text-[12px] text-slate-500 dark:text-[#888] font-medium mb-0.5">{(op as any).metrics?.label3}</p>
                         <p className="text-sm text-slate-900 dark:text-white font-medium">{(op as any).metrics?.value3}</p>
                       </div>
                     )}
                  </div>
                </div>

                {(op as any).currentActivity && (
                  <div className="mt-auto bg-white dark:bg-[#0F172A]/80 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-lg p-3 text-[13px] text-slate-700 dark:text-[#EDEDED] flex items-center gap-2.5 relative z-10 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse"></span>
                    <span className="truncate">{(op as any).currentActivity}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);

fs.writeFileSync(file, content);
fs.writeFileSync('/app/applet/app/(dashboard)/page.tsx', content);

console.log("Done");

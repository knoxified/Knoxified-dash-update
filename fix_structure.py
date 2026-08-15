import re

with open('/app/applet/app/(dashboard)/page.tsx', 'r') as f:
    content = f.read()

# I will find the parts of the file using clear markers.
# 1. Everything up to `{/* 5) Active`
part_before_active = content[:content.find('{/* 5) Active systems')]
# Wait, originally `{/* 2) “Today` was before `{/* 5) Active`. 
# Since I messed it up, let's just find each block.

marker_today = "{/* 2) “Today’s Wins” section */}"
marker_active = "{/* 5) Active systems section */}"
marker_statcard = "interface StatCardProps"

# Let's find them in the CURRENT messed up file.
idx_active = content.find(marker_active)
idx_today = content.find(marker_today)
idx_statcard = content.find(marker_statcard)

print("idx_active:", idx_active)
print("idx_today:", idx_today)
print("idx_statcard:", idx_statcard)

# Let's find the original start of the main container.
# It should be the end of part_before_active if it didn't contain Today's Wins.
# Actually, part1 = content[:23738]. That is before the original Today's Wins.
part1 = content[:23738]

# We need the pure Today's Wins block.
# Let's extract it from the current file.
# It starts at idx_today. Where does it end?
# It ends with `<ActivityFeed filter={logFilter} />\n        </div>\n      </div>`
today_end_str = "<ActivityFeed filter={logFilter} />\n        </div>\n      </div>"
idx_today_end = content.find(today_end_str, idx_today) + len(today_end_str)
today_block = content[idx_today:idx_today_end]

# We need the pure Active Systems block.
# It starts at idx_active. Where does it end?
# It ends with `              </div>\n            )\n          })}\n        </div>\n      </div>`
active_end_str = "              </div>\n            )\n          })}\n        </div>\n      </div>"
idx_active_end = content.find(active_end_str, idx_active) + len(active_end_str)
active_block = content[idx_active:idx_active_end]

# Now we need the end of DashboardPage.
dashboard_end_block = "\n    </div>\n  );\n}\n\n"

# And finally, the StatCard definition.
# I will just write a clean StatCard definition since the current one is garbled.
statcard_block = """
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendColor?: string;
  subtitle?: string;
  color?: string;
  isWarning?: boolean;
  sparklineData?: Array<{val: number}>;
}

function StatCard({ label, value, icon: Icon, trend, trendColor, subtitle, color, isWarning, sparklineData }: StatCardProps) {
  const warningClasses = isWarning ? 'border-red-200 dark:border-[#EF4444]/30 bg-red-50 dark:bg-[#EF4444]/5' : 'border-slate-200 dark:border-white/5 bg-white dark:bg-[#0F172A]';
  const strokeColor = trendColor?.includes('red') ? '#EF4444' : '#10B981';

  return (
    <div className={`border rounded-xl p-6 relative overflow-hidden transition-all duration-300 group hover:border-sky-300 dark:hover:border-sky-500/30 hover:shadow-lg hover:-translate-y-1 flex flex-col justify-center h-full ${warningClasses}`}>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Icon size={16} className={isWarning ? 'text-red-500 dark:text-[#EF4444]' : color} />
          <p className="text-slate-500 dark:text-[#888] font-medium text-sm">{label}</p>
        </div>
        {isWarning && <AlertTriangle size={16} className="text-red-500 dark:text-[#EF4444] animate-pulse" />}
      </div>

      <div className="flex items-end gap-2 relative z-10">
        <p className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">{value}</p>
        {trend && (
          <span className={`text-[13px] font-medium mb-1 ${trendColor ? trendColor : 'text-slate-500 dark:text-[#888]'}`}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className={`text-[12px] mt-2 font-medium relative z-10 ${isWarning ? 'text-red-500 dark:text-[#EF4444]' : 'text-slate-500 dark:text-[#888]'}`}>{subtitle}</p>
      )}

      {/* Sparkline chart in the background */}
      {sparklineData && !isWarning && (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-70 transition-opacity duration-300 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={sparklineData}>
                <defs>
                   <linearGradient id={`spark-${label.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={strokeColor} stopOpacity={0.5}/>
                      <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <Area type="monotone" dataKey="val" stroke={strokeColor} strokeWidth={2} fillOpacity={1} fill={`url(#spark-${label.replace(/\s+/g, '')})`} />
             </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
"""

new_content = part1 + active_block + "\n\n      " + today_block + dashboard_end_block + statcard_block

with open('/app/applet/app/(dashboard)/page.tsx', 'w') as f:
    f.write(new_content)

print("Rebuilt page.tsx successfully!")

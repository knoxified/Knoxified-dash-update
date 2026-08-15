import re

with open('/app/applet/app/(dashboard)/automations/[id]/page.tsx', 'r') as f:
    content = f.read()

import_statement = 'import ScheduleManager from "@/components/ScheduleManager";\nimport AutomationRunner from "@/components/AutomationRunner";'
content = content.replace('import ScheduleManager from "@/components/ScheduleManager";', import_statement)

old_placeholder = """        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <Activity size={40} className="text-slate-300 dark:text-slate-700 mb-4" />
          <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{title} Dashboard</h2>
          <p className="text-sm text-slate-500 max-w-md">
            This automation board is currently being provisioned. Custom configuration interfaces will appear here once the system initializes.
          </p>
        </div>"""

new_runner = """        <AutomationRunner automation={automation} />"""

content = content.replace(old_placeholder, new_runner)

with open('/app/applet/app/(dashboard)/automations/[id]/page.tsx', 'w') as f:
    f.write(content)

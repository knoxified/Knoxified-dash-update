import re

with open('/app/applet/app/(dashboard)/automations/[id]/page.tsx', 'r') as f:
    content = f.read()

import_statement = 'import AppointMateBoard from "./AppointMateBoard";\nexport default function'
content = content.replace('export default function', import_statement)

old_logic = """      {id === "leadreach" ? (
        <LeadReachBoard />
      ) : id === "mailcraft" ? (
        <MailCraftBoard />
      ) : (
        <AutomationRunner automation={automation} />
      )}"""

new_logic = """      {id === "leadreach" ? (
        <LeadReachBoard />
      ) : id === "mailcraft" ? (
        <MailCraftBoard />
      ) : id === "appointmate" ? (
        <AppointMateBoard automation={automation} />
      ) : (
        <AutomationRunner automation={automation} />
      )}"""

content = content.replace(old_logic, new_logic)

with open('/app/applet/app/(dashboard)/automations/[id]/page.tsx', 'w') as f:
    f.write(content)

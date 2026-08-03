import re
with open('/app/applet/app/(dashboard)/automations/page.tsx', 'r') as f:
    content = f.read()
content = content.replace('// eslint-disable-next-line react-hooks/exhaustive-deps\n    fetchAutomations();', '// eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect\n    fetchAutomations();')
with open('/app/applet/app/(dashboard)/automations/page.tsx', 'w') as f:
    f.write(content)

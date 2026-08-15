import re

with open('/app/applet/app/(dashboard)/page.tsx', 'r') as f:
    content = f.read()

s1 = content.find('{/* 4) Today')
if s1 == -1:
    s1 = content.find('{/* 2) “Today')
s2 = content.find('{/* 5) Active systems')
s3 = content.find('</div>', s2 + 100) # end of Active systems

print("s1:", s1, "s2:", s2, "s3:", s3)


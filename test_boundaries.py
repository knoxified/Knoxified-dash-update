with open('/app/applet/app/(dashboard)/page.tsx', 'r') as f:
    content = f.read()

s2_marker = "{/* 5) Active"
s1_marker = "{/* 2) “Today"

s2_start = content.find(s2_marker)
s1_start = content.find(s1_marker)
statcard_start = content.find('interface StatCardProps')

print("s2_start:", s2_start)
print("statcard_start:", statcard_start)
print("s1_start:", s1_start)
print("len:", len(content))

print("\n--- End of Active Systems (before statcard):")
print(content[statcard_start-100:statcard_start])

print("\n--- End of Statcard (before Today's Wins):")
print(content[s1_start-100:s1_start])

print("\n--- End of File:")
print(content[-100:])


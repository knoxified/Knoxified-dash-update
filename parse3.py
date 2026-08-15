with open('/app/applet/app/(dashboard)/page.tsx', 'r') as f:
    content = f.read()

s1_start = content.find('{/* 4) Today')
if s1_start == -1:
    s1_start = content.find('{/* 2) “Today')
    if s1_start == -1:
        s1_start = content.find("Today's Wins")
        
s2_start = content.find('{/* 5) Active systems section */}')
if s2_start == -1:
    s2_start = content.find('{/* 5) Active')

print("s1_start:", s1_start, "s2_start:", s2_start)
if s1_start != -1 and s2_start != -1:
    # We need to find the end of s2
    # The end of s2 should be just before `    </div>\n  );\n}`
    
    end_index = content.rfind('    </div>\n  );\n}')
    print("end_index:", end_index)
    
    s1_text = content[s1_start:s2_start]
    s2_text = content[s2_start:end_index]
    
    # We want to replace s1_start to end_index with s2_text + s1_text
    new_content = content[:s1_start] + s2_text + "\n      " + s1_text + content[end_index:]
    with open('/app/applet/app/(dashboard)/page.tsx', 'w') as f:
        f.write(new_content)
    print("Done swapping!")

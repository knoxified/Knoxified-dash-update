with open('/app/applet/app/(dashboard)/page.tsx', 'r') as f:
    content = f.read()

s2_text = content[23738:23738+7283]
s1_text = content[31028:31028+1946]
part1 = content[:23738]
end_part = content[31028+1946:] # Wait, content[32974:] should be just `  );\n}` from the end_index + whatever was left.

original_content = part1 + s1_text + s2_text + end_part
print("Original content restored length:", len(original_content))

# Let's do the correct swap!
# We want "Active Operations" BEFORE "Today's Wins"
# Active operations is inside s2_text, but s2_text ALSO includes StatCard!
# Let's split s2_text into active_systems and statcard.
# We know active_systems ends at `    </div>\n  );\n}` for DashboardPage.
# Let's find `interface StatCardProps` inside s2_text
statcard_idx = s2_text.find('interface StatCardProps')
active_systems = s2_text[:statcard_idx]
statcard = s2_text[statcard_idx:]

print("active_systems length:", len(active_systems))
print("statcard length:", len(statcard))
print("s1_text (Today's Wins) length:", len(s1_text))

# The new content should be:
# part1 + active_systems + s1_text + end of DashboardPage + statcard
# Wait, active_systems ALREADY includes the end of DashboardPage!
# Let's look at the end of active_systems
print("End of active_systems:", repr(active_systems[-40:]))

# It ends with `        </div>\n      </div>\n    </div>\n  );\n}\n`
# We need to insert s1_text BEFORE the end of DashboardPage.
# Actually, active_systems has `      </div>\n    </div>\n  );\n}\n`.
# Let's find `  );\n}\n` in active_systems
dashboard_end_idx = active_systems.rfind('  );\n}\n')
active_systems_inner = active_systems[:dashboard_end_idx]
dashboard_end = active_systems[dashboard_end_idx:]

# But wait, we also have to make sure the div structure is correct.
# Today's Wins (s1_text) was originally right before Active Systems.
# Today's Wins is wrapped in something?
# Let's check s1_text boundaries:
print("Start of s1_text:", repr(s1_text[:40]))
print("End of s1_text:", repr(s1_text[-40:]))

# s1_text starts with `{/* 2) “Today’s Wins” section */}`
# s1_text ends with `<ActivityFeed filter={logFilter} />\n        </div>\n      </div>`
# Wait, s1_text doesn't close all divs, it just closes its own.
# So we can just put it after Active Systems (but before the DashboardPage closes).

swapped_content = part1 + active_systems_inner + s1_text + dashboard_end + statcard + end_part

with open('/app/applet/app/(dashboard)/page.tsx', 'w') as f:
    f.write(swapped_content)
    
print("Swapped successfully!")

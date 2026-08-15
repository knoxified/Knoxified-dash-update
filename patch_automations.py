import re

with open('/app/applet/data/automations.ts', 'r') as f:
    content = f.read()

# Add formSchema to Automation interface
interface_replacement = """  // NEW — only set this for "two-in-one" automations (e.g. AppointMate).
  // Each action maps to its own webhook so the runner can offer a selector
  // instead of you building a custom board.
  actions?: { key: string; label: string }[];
  formSchema?: { key: string; label: string; type: "text" | "number" | "select" | "textarea" | "date"; options?: string[] }[] | Record<string, { key: string; label: string; type: "text" | "number" | "select" | "textarea" | "date"; options?: string[] }[]>;
  metrics?: {"""

content = re.sub(r'  // NEW — only set this for "two-in-one".*?metrics\?: \{', interface_replacement, content, flags=re.DOTALL)

# Add formSchema to appointmate
appointmate_old = """    actions: [
      { key: "check_availability", label: "Check Availability" },
      { key: "book_appointment", label: "Book Appointment" },
    ],
    metrics: { label1: "Appts Booked", value1: "89", label2: "Conflicts Avoided", value2: "12" }"""

appointmate_new = """    actions: [
      { key: "check_availability", label: "Check Availability" },
      { key: "book_appointment", label: "Book Appointment" },
    ],
    formSchema: {
      check_availability: [
        { key: "date", label: "Date to Check", type: "date" },
        { key: "timezone", label: "Timezone", type: "select", options: ["America/Los_Angeles", "America/New_York", "Europe/London", "Asia/Tokyo"] }
      ],
      book_appointment: [
        { key: "client_name", label: "Client Name", type: "text" },
        { key: "client_email", label: "Client Email", type: "text" },
        { key: "datetime", label: "Preferred Date & Time", type: "date" },
        { key: "notes", label: "Meeting Notes", type: "textarea" }
      ]
    },
    metrics: { label1: "Appts Booked", value1: "89", label2: "Conflicts Avoided", value2: "12" }"""

content = content.replace(appointmate_old, appointmate_new)

with open('/app/applet/data/automations.ts', 'w') as f:
    f.write(content)

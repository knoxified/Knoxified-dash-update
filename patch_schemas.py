import re

with open('/app/applet/data/automations.ts', 'r') as f:
    content = f.read()

def add_schema(content, auto_id, schema_str):
    if f'id: "{auto_id}"' in content and 'formSchema:' not in content.split(f'id: "{auto_id}"')[1].split('}')[0]:
        # We find the id, and replace it by injecting the formSchema before metrics or enabled
        pattern = r'(id: "' + auto_id + r'".*?)(enabled: false)(.*?})'
        replacement = r'\1\2,\n    formSchema: ' + schema_str + r'\3'
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    return content

# Schemas for some top ones:
schemas = {
    "adpilot": '[ { key: "campaign_id", label: "Campaign ID", type: "text" }, { key: "action", label: "Action", type: "select", options: ["Analyze Waste", "Optimize Bids", "Generate Report"] } ]',
    "waitlistbot": '[ { key: "guest_name", label: "Guest Name", type: "text" }, { key: "party_size", label: "Party Size", type: "number" }, { key: "phone", label: "Phone Number", type: "text" } ]',
    "reminderbot": '[ { key: "client_phone", label: "Client Phone", type: "text" }, { key: "appointment_time", label: "Appointment Time", type: "date" }, { key: "message_template", label: "Message Template", type: "select", options: ["Standard Reminder", "Urgent Reminder", "Follow-up"] } ]',
    "proofpulse": '[ { key: "customer_email", label: "Customer Email", type: "text" }, { key: "transaction_id", label: "Transaction ID", type: "text" }, { key: "service_type", label: "Service Type", type: "text" } ]',
    "omniserve": '[ { key: "ticket_id", label: "Ticket ID", type: "text" }, { key: "message", label: "Customer Message", type: "textarea" }, { key: "channel", label: "Channel", type: "select", options: ["Email", "Chat", "Social"] } ]',
    "replybot": '[ { key: "question", label: "Customer Question", type: "textarea" }, { key: "context", label: "Context/History", type: "textarea" } ]',
    "routemaster": '[ { key: "start_address", label: "Start Address", type: "text" }, { key: "stops", label: "Number of Stops", type: "number" }, { key: "priority", label: "Priority", type: "select", options: ["Standard", "Express", "Overnight"] } ]',
    "statusync": '[ { key: "order_id", label: "Order ID", type: "text" }, { key: "status", label: "New Status", type: "select", options: ["Processing", "Dispatched", "Arriving", "Delivered"] } ]',
    "claimbot": '[ { key: "claim_id", label: "Claim ID", type: "text" }, { key: "document_url", label: "Document URL", type: "text" } ]',
    "stocksentinel": '[ { key: "sku", label: "Product SKU", type: "text" }, { key: "threshold", label: "Alert Threshold", type: "number" } ]',
    "qualisync": '[ { key: "lead_phone", label: "Lead Phone", type: "text" }, { key: "initial_message", label: "Initial Message", type: "textarea" } ]',
    "screensync": '[ { key: "resume_url", label: "Resume URL/Text", type: "textarea" }, { key: "role", label: "Role Applied For", type: "text" } ]',
    "eventstream": '[ { key: "event_id", label: "Event ID", type: "text" }, { key: "attendee_email", label: "Attendee Email", type: "text" }, { key: "action", label: "Action", type: "select", options: ["Register", "Send Reminder", "Post-Event Followup"] } ]',
    "omnipulse": '[ { key: "customer_id", label: "Customer ID", type: "text" }, { key: "event_type", label: "Event Type", type: "select", options: ["Purchase", "Milestone", "Warning"] } ]',
    "pulsepay": '[ { key: "account_id", label: "Account ID", type: "text" }, { key: "amount", label: "Declined Amount", type: "number" }, { key: "retry_date", label: "Retry Date", type: "date" } ]',
    "onboardiq": '[ { key: "employee_name", label: "Employee Name", type: "text" }, { key: "department", label: "Department", type: "text" }, { key: "start_date", label: "Start Date", type: "date" } ]',
    "invoiceai": '[ { key: "client_id", label: "Client ID", type: "text" }, { key: "project_id", label: "Project ID", type: "text" }, { key: "amount", label: "Amount", type: "number" } ]',
    "leadloom": '[ { key: "lead_email", label: "Lead Email", type: "text" }, { key: "company_size", label: "Company Size", type: "number" }, { key: "industry", label: "Industry", type: "text" } ]',
    "fraudshield": '[ { key: "transaction_id", label: "Transaction ID", type: "text" }, { key: "amount", label: "Amount", type: "number" }, { key: "ip_address", label: "IP Address", type: "text" } ]',
    "casesync": '[ { key: "case_type", label: "Case Type", type: "select", options: ["Personal Injury", "Family Law", "Corporate", "Other"] }, { key: "inquiry_details", label: "Inquiry Details", type: "textarea" } ]',
    "cartrevive": '[ { key: "cart_id", label: "Cart ID", type: "text" }, { key: "customer_phone", label: "Customer Phone", type: "text" }, { key: "discount_code", label: "Discount Code", type: "text" } ]',
    "returnbot": '[ { key: "order_id", label: "Order ID", type: "text" }, { key: "reason", label: "Return Reason", type: "textarea" } ]',
    "estimate": '[ { key: "project_type", label: "Project Type", type: "text" }, { key: "dimensions", label: "Dimensions (sq ft)", type: "number" }, { key: "materials", label: "Materials", type: "text" } ]',
    "maintainbot": '[ { key: "property_id", label: "Property ID", type: "text" }, { key: "issue_description", label: "Issue Description", type: "textarea" }, { key: "urgency", label: "Urgency", type: "select", options: ["Low", "Medium", "High", "Emergency"] } ]',
    "leasesync": '[ { key: "tenant_id", label: "Tenant ID", type: "text" }, { key: "lease_end_date", label: "Lease End Date", type: "date" } ]',
    "carepulse": '[ { key: "patient_id", label: "Patient ID", type: "text" }, { key: "treatment_date", label: "Treatment Date", type: "date" }, { key: "treatment_type", label: "Treatment Type", type: "text" } ]',
    "caterbot": '[ { key: "inquiry_id", label: "Inquiry ID", type: "text" }, { key: "headcount", label: "Headcount", type: "number" }, { key: "budget", label: "Budget", type: "number" } ]',
    "winbackbot": '[ { key: "client_id", label: "Client ID", type: "text" }, { key: "last_purchase_date", label: "Last Purchase Date", type: "date" } ]',
    "memomind": '[ { key: "meeting_recording_url", label: "Meeting Recording URL", type: "text" }, { key: "participants", label: "Participants", type: "text" } ]',
    "taskgen": '[ { key: "transcript", label: "Conversation Transcript", type: "textarea" }, { key: "project_id", label: "Project ID", type: "text" } ]',
    "docuflow": '[ { key: "crm_record_id", label: "CRM Record ID", type: "text" }, { key: "template_type", label: "Template Type", type: "select", options: ["Contract", "Proposal", "Report"] } ]',
    "signsync": '[ { key: "document_id", label: "Document ID", type: "text" }, { key: "signer_email", label: "Signer Email", type: "text" } ]',
}

for k, v in schemas.items():
    content = add_schema(content, k, v)

with open('/app/applet/data/automations.ts', 'w') as f:
    f.write(content)


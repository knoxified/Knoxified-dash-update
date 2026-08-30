export interface Automation {
  id: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
  // NEW — used by the generic webhook runner. Defaults to `id` if omitted.
  webhookKey?: string;
  // NEW — only set this for "two-in-one" automations (e.g. AppointMate).
  // Each action maps to its own webhook so the runner can offer a selector
  // instead of you building a custom board.
  actions?: { key: string; label: string }[];
  formSchema?: { key: string; label: string; type: "text" | "number" | "select" | "textarea" | "date"; options?: string[] }[] | Record<string, { key: string; label: string; type: "text" | "number" | "select" | "textarea" | "date"; options?: string[] }[]>;
  metrics?: {
    label1: string; value1: string | number;
    label2: string; value2: string | number;
  };
}

// Synced against https://knoxified.org/automations on 2026-08-03.
// Metrics were intentionally left OFF new items rather than invented —
// see note in chat about why fabricated per-user numbers are a problem
// once this is a paying customer's own dashboard, not a marketing page.
// Maps a dashboard automation `id` to its real automation_catalog `key`.
// Only automations with a real n8n workflow behind them belong here --
// anything not listed has no live backend yet, and the UI shows
// "Coming soon" for it rather than attempting to enable it.
// AppointMate covers two catalog rows (appointment_booking + check_availability)
// but only the booking row is used here as the single toggle/slot-cost
// representative, since it's one feature with one on/off switch in the dashboard.
export const AUTOMATION_CATALOG_KEYS: Record<string, string> = {
  leadreach: "lead_reach_search",
  mailcraft: "mailcraft_sequence",
  appointmate: "appointment_booking",
};

export const AUTOMATIONS: Automation[] = [
  { id: "leadreach", name: "LeadReach 🔍", category: "Sales", description: "Automatically finds and enriches any lead with 12 verified contact fields — name, email, phone, all social handles, LinkedIn URLs, and more.", enabled: false, metrics: { label1: "Leads Enriched", value1: "1,204", label2: "Fields Verified", value2: "14k" } },
  { id: "mailcraft", name: "MailCraft ✍️", category: "Marketing", description: "Takes approved contact context and drafts customer-authorized email follow-ups for team review.", enabled: false, metrics: { label1: "Emails Drafted", value1: "842", label2: "Avg Open Rate", value2: "41%" } },
  { id: "adpilot", name: "AdPilot 🎯", category: "Marketing", description: "Monitors campaigns, detects waste, suggests optimizations, generates reports, and triggers alerts.", enabled: false,
    formSchema: [ { key: "campaign_id", label: "Campaign ID", type: "text" }, { key: "action", label: "Action", type: "select", options: ["Analyze Waste", "Optimize Bids", "Generate Report"] } ], metrics: { label1: "Ad Waste Saved", value1: "$1.2k", label2: "Alerts Triggered", value2: "14" } },
  { id: "waitlistbot", name: "WaitlistBot 🛎️", category: "Operations", description: "Intelligently manages virtual queues, providing live updates and maximizing table turns.", enabled: false,
    formSchema: [ { key: "guest_name", label: "Guest Name", type: "text" }, { key: "party_size", label: "Party Size", type: "number" }, { key: "phone", label: "Phone Number", type: "text" } ], metrics: { label1: "Parties Queued", value1: "340", label2: "No-Shows Avoided", value2: "42" } },
  { id: "caterbot", name: "CaterBot 🍽️", category: "Sales", description: "Automatically qualifies, nurtures, and builds out catering quotes directly from customer inquiries.", enabled: false,
    formSchema: [ { key: "inquiry_id", label: "Inquiry ID", type: "text" }, { key: "headcount", label: "Headcount", type: "number" }, { key: "budget", label: "Budget", type: "number" } ], metrics: { label1: "Quotes Prepared", value1: "12", label2: "Avg Value", value2: "$4.5k" } },
  { id: "winbackbot", name: "WinBackBot 🔥", category: "Marketing", description: "Helps teams prepare authorized follow-ups for existing clients with relevant service updates.", enabled: false,
    formSchema: [ { key: "client_id", label: "Client ID", type: "text" }, { key: "last_purchase_date", label: "Last Purchase Date", type: "date" } ], metrics: { label1: "Re-engaged", value1: "56", label2: "Revenue Recovered", value2: "$8.4k" } },
  { id: "memomind", name: "MemoMind 🧠", category: "Admin", description: "Automatically transcribes and summarizes meetings, capturing key decisions without manual effort.", enabled: false,
    formSchema: [ { key: "meeting_recording_url", label: "Meeting Recording URL", type: "text" }, { key: "participants", label: "Participants", type: "text" } ], metrics: { label1: "Meetings Logged", value1: "28", label2: "Hours Saved", value2: "14h" } },
  { id: "taskgen", name: "TaskGen ✅", category: "Admin", description: "Parses conversations and documents to automatically create and assign tasks in project management tools.", enabled: false,
    formSchema: [ { key: "transcript", label: "Conversation Transcript", type: "textarea" }, { key: "project_id", label: "Project ID", type: "text" } ], metrics: { label1: "Tasks Created", value1: "156", label2: "Projects Synced", value2: "8" } },
  { id: "docuflow", name: "DocuFlow 📄", category: "Admin", description: "Auto-generates contracts, proposals, and reports from CRM data instantly.", enabled: false,
    formSchema: [ { key: "crm_record_id", label: "CRM Record ID", type: "text" }, { key: "template_type", label: "Template Type", type: "select", options: ["Contract", "Proposal", "Report"] } ], metrics: { label1: "Docs Generated", value1: "42", label2: "Errors Prevented", value2: "11" } },
  { id: "signsync", name: "SignSync 🖋️", category: "Admin", description: "Manages the entire e-signature lifecycle, from sending to follow-ups and final storage.", enabled: false,
    formSchema: [ { key: "document_id", label: "Document ID", type: "text" }, { key: "signer_email", label: "Signer Email", type: "text" } ], metrics: { label1: "Signatures", value1: "18", label2: "Turnaround Time", value2: "-45%" } },
  {
    id: "appointmate", name: "AppointMate 📅", category: "Operations",
    description: "Automates calendar availability, booking, and buffer time allocation to eliminate email ping-pong.",
    enabled: false,
    actions: [
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
    metrics: { label1: "Appts Booked", value1: "89", label2: "Conflicts Avoided", value2: "12" }
  },
  { id: "reminderbot", name: "ReminderBot ⏰", category: "Operations", description: "Reduces no-shows by sending timed SMS and email reminders to scheduled clients.", enabled: false,
    formSchema: [ { key: "client_phone", label: "Client Phone", type: "text" }, { key: "appointment_time", label: "Appointment Time", type: "date" }, { key: "message_template", label: "Message Template", type: "select", options: ["Standard Reminder", "Urgent Reminder", "Follow-up"] } ], metrics: { label1: "Reminders Sent", value1: "410", label2: "No-Show Rate", value2: "1.2%" } },
  { id: "proofpulse", name: "ProofPulse ⭐", category: "Marketing", description: "Triggers review requests to satisfied customers automatically after successful transactions or services.", enabled: false,
    formSchema: [ { key: "customer_email", label: "Customer Email", type: "text" }, { key: "transaction_id", label: "Transaction ID", type: "text" }, { key: "service_type", label: "Service Type", type: "text" } ], metrics: { label1: "Requests Sent", value1: "156", label2: "Reviews Captured", value2: "34" } },
  { id: "omniserve", name: "OmniServe 💬", category: "Operations", description: "Triages and routes incoming support emails and chats to the appropriate department.", enabled: false,
    formSchema: [ { key: "ticket_id", label: "Ticket ID", type: "text" }, { key: "message", label: "Customer Message", type: "textarea" }, { key: "channel", label: "Channel", type: "select", options: ["Email", "Chat", "Social"] } ], metrics: { label1: "Tickets Routed", value1: "892", label2: "Avg Triage", value2: "<1s" } },
  { id: "replybot", name: "ReplyBot 🤖", category: "Support", description: "Instantly answers common customer questions, deflecting basic inquiries away from human agents.", enabled: false,
    formSchema: [ { key: "question", label: "Customer Question", type: "textarea" }, { key: "context", label: "Context/History", type: "textarea" } ], metrics: { label1: "Questions Answered", value1: "1.4k", label2: "Deflection Rate", value2: "68%" } },
  { id: "routemaster", name: "RouteMaster 🗺️", category: "Operations", description: "Optimizes field service and delivery routes based on location, traffic, and schedule.", enabled: false,
    formSchema: [ { key: "start_address", label: "Start Address", type: "text" }, { key: "stops", label: "Number of Stops", type: "number" }, { key: "priority", label: "Priority", type: "select", options: ["Standard", "Express", "Overnight"] } ] },
  { id: "statusync", name: "StatuSync 🚚", category: "Operations", description: "Keeps clients informed with automated 'on-the-way' notifications and live ETAs.", enabled: false,
    formSchema: [ { key: "order_id", label: "Order ID", type: "text" }, { key: "status", label: "New Status", type: "select", options: ["Processing", "Dispatched", "Arriving", "Delivered"] } ] },
  { id: "claimbot", name: "ClaimBot 🛡️", category: "Finance", description: "Automatically extracts and structures data from forms and images to accelerate processing.", enabled: false,
    formSchema: [ { key: "claim_id", label: "Claim ID", type: "text" }, { key: "document_url", label: "Document URL", type: "text" } ] },
  { id: "stocksentinel", name: "StockSentinel 📦", category: "Operations", description: "Monitors inventory levels and automatically alerts procurement when stocks drop below critical metrics.", enabled: false,
    formSchema: [ { key: "sku", label: "Product SKU", type: "text" }, { key: "threshold", label: "Alert Threshold", type: "number" } ], metrics: { label1: "Stock Alerts", value1: "12", label2: "Outages Avoided", value2: "4" } },
  { id: "qualisync", name: "QualiSync 🚀", category: "Sales", description: "Engages new leads instantly via chat or SMS to vet them before handing off to sales.", enabled: false,
    formSchema: [ { key: "lead_phone", label: "Lead Phone", type: "text" }, { key: "initial_message", label: "Initial Message", type: "textarea" } ], metrics: { label1: "Leads Vetted", value1: "210", label2: "Sales Passed", value2: "45" } },
  { id: "screensync", name: "ScreenSync 🤝", category: "HR", description: "Organizes incoming resumes against recruiter-defined criteria for human review.", enabled: false,
    formSchema: [ { key: "resume_url", label: "Resume URL/Text", type: "textarea" }, { key: "role", label: "Role Applied For", type: "text" } ], metrics: { label1: "Resumes Ranked", value1: "450", label2: "Shortlists", value2: "14" } },
  { id: "eventstream", name: "EventStream 🎥", category: "Marketing", description: "Manages the entire pre-event sequence to maximize webinar attendance rates.", enabled: false,
    formSchema: [ { key: "event_id", label: "Event ID", type: "text" }, { key: "attendee_email", label: "Attendee Email", type: "text" }, { key: "action", label: "Action", type: "select", options: ["Register", "Send Reminder", "Post-Event Followup"] } ], metrics: { label1: "Registrants", value1: "840", label2: "Attendance", value2: "42%" } },
  { id: "omnipulse", name: "OmniPulse 🚀", category: "Marketing", description: "Sends customer-authorized SMS updates based on relevant account or purchase events.", enabled: false,
    formSchema: [ { key: "customer_id", label: "Customer ID", type: "text" }, { key: "event_type", label: "Event Type", type: "select", options: ["Purchase", "Milestone", "Warning"] } ], metrics: { label1: "SMS Sent", value1: "4.2k", label2: "Event Triggers", value2: "2.1k" } },
  { id: "pulsepay", name: "PulsePay 💳", category: "Finance", description: "Automatically engages customers whose credit cards decline to recover lost recurring revenue.", enabled: false,
    formSchema: [ { key: "account_id", label: "Account ID", type: "text" }, { key: "amount", label: "Declined Amount", type: "number" }, { key: "retry_date", label: "Retry Date", type: "date" } ], metrics: { label1: "Declines Caught", value1: "14", label2: "Revenue Saved", value2: "$1.4k" } },
  { id: "onboardiq", name: "OnboardIQ 📑", category: "HR", description: "Automates the collection and filing of new hire documents and IT provisioning requests.", enabled: false,
    formSchema: [ { key: "employee_name", label: "Employee Name", type: "text" }, { key: "department", label: "Department", type: "text" }, { key: "start_date", label: "Start Date", type: "date" } ] },
  { id: "invoiceai", name: "InvoiceAI 💰", category: "Finance", description: "Creates and dispatches accurate invoices based on logged hours or completed project milestones.", enabled: false,
    formSchema: [ { key: "client_id", label: "Client ID", type: "text" }, { key: "project_id", label: "Project ID", type: "text" }, { key: "amount", label: "Amount", type: "number" } ] },
  { id: "leadloom", name: "LeadLoom 🎯", category: "Sales", description: "Routes incoming leads instantly to the correct sales rep based on territory, size, or round-robin rules.", enabled: false,
    formSchema: [ { key: "lead_email", label: "Lead Email", type: "text" }, { key: "company_size", label: "Company Size", type: "number" }, { key: "industry", label: "Industry", type: "text" } ] },
  { id: "fraudshield", name: "FraudShield 🛑", category: "Finance", description: "Monitors e-commerce transactions and flags highly suspicious orders for manual review.", enabled: false,
    formSchema: [ { key: "transaction_id", label: "Transaction ID", type: "text" }, { key: "amount", label: "Amount", type: "number" }, { key: "ip_address", label: "IP Address", type: "text" } ], metrics: { label1: "Orders Scanned", value1: "8.4k", label2: "Flags Raised", value2: "12" } },
  { id: "casesync", name: "CaseSync ⚖️", category: "Legal", description: "Organizes new legal inquiries by your firm's criteria before they reach attorneys, gathering initial case facts.", enabled: false,
    formSchema: [ { key: "case_type", label: "Case Type", type: "select", options: ["Personal Injury", "Family Law", "Corporate", "Other"] }, { key: "inquiry_details", label: "Inquiry Details", type: "textarea" } ], metrics: { label1: "Cases Screened", value1: "42", label2: "Hours Saved", value2: "18h" } },
  { id: "cartrevive", name: "CartRevive 🛒", category: "Sales", description: "Sends customer-authorized cart reminders on SMS and WhatsApp with approved recovery offers.", enabled: false,
    formSchema: [ { key: "cart_id", label: "Cart ID", type: "text" }, { key: "customer_phone", label: "Customer Phone", type: "text" }, { key: "discount_code", label: "Discount Code", type: "text" } ], metrics: { label1: "Carts Abandoned", value1: "156", label2: "Recovered", value2: "34" } },
  { id: "returnbot", name: "ReturnBot 📦", category: "Support", description: "Automates the entire RMA and return processing lifecycle to reduce operational costs.", enabled: false,
    formSchema: [ { key: "order_id", label: "Order ID", type: "text" }, { key: "reason", label: "Return Reason", type: "textarea" } ], metrics: { label1: "RMAs", value1: "45", label2: "Support Saved", value2: "12h" } },
  { id: "estimate", name: "EstiMate 📐", category: "Sales", description: "Instantly process project dimensions and job types to generate and send accurate preliminary estimates.", enabled: false,
    formSchema: [ { key: "project_type", label: "Project Type", type: "text" }, { key: "dimensions", label: "Dimensions (sq ft)", type: "number" }, { key: "materials", label: "Materials", type: "text" } ], metrics: { label1: "Estimates", value1: "28", label2: "Jobs Won", value2: "6" } },
  { id: "maintainbot", name: "MaintainBot 🔧", category: "Operations", description: "Automates the intake, triage, and vendor assignment of property maintenance requests.", enabled: false,
    formSchema: [ { key: "property_id", label: "Property ID", type: "text" }, { key: "issue_description", label: "Issue Description", type: "textarea" }, { key: "urgency", label: "Urgency", type: "select", options: ["Low", "Medium", "High", "Emergency"] } ], metrics: { label1: "Requests", value1: "34", label2: "Vendors", value2: "28" } },
  { id: "leasesync", name: "LeaseSync 📝", category: "Operations", description: "Automatically texts and emails tenants well before lease expiration to drive higher retention rates.", enabled: false,
    formSchema: [ { key: "tenant_id", label: "Tenant ID", type: "text" }, { key: "lease_end_date", label: "Lease End Date", type: "date" } ] },
  { id: "carepulse", name: "CarePulse 🩺", category: "Support", description: "Triggers highly specific post-treatment check-ins to monitor healing and request reviews.", enabled: false,
    formSchema: [ { key: "patient_id", label: "Patient ID", type: "text" }, { key: "treatment_date", label: "Treatment Date", type: "date" }, { key: "treatment_type", label: "Treatment Type", type: "text" } ] }
];

export interface Automation {
  id: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
  metrics?: {
    label1: string; value1: string | number;
    label2: string; value2: string | number;
  };
}

export const AUTOMATIONS: Automation[] = [
  { id: "leadreach", name: "LeadReach 🔍", category: "Sales", description: "Automatically finds and enriches any lead with 12 verified contact fields.", enabled: false, metrics: { label1: "Leads Enriched", value1: "1,204", label2: "Fields Verified", value2: "14k" } },
  { id: "mailcraft", name: "MailCraft ✉️", category: "Marketing", description: "Takes an enriched lead profile and instantly drafts a 4-step personalized outreach email sequence.", enabled: false, metrics: { label1: "Emails Drafted", value1: "842", label2: "Avg Open Rate", value2: "41%" } },
  { id: "adpilot", name: "AdPilot 🎯", category: "Marketing", description: "Monitors campaigns, detects waste, suggests optimizations, generates reports, and triggers alerts.", enabled: false, metrics: { label1: "Ad Waste Saved", value1: "$1.2k", label2: "Alerts Triggered", value2: "14" } },
  { id: "waitlistbot", name: "WaitlistBot 🛎️", category: "Operations", description: "Intelligently manages virtual queues, providing live updates and maximizing table turns.", enabled: false, metrics: { label1: "Parties Queued", value1: "340", label2: "No-Shows Avoided", value2: "42" } },
  { id: "caterbot", name: "CaterBot 🍽️", category: "Sales", description: "Automatically qualifies, nurtures, and builds out catering quotes directly from customer inquiries.", enabled: false, metrics: { label1: "Quotes Prepared", value1: "12", label2: "Avg Value", value2: "$4.5k" } },
  { id: "winbackbot", name: "WinBackBot 🔥", category: "Marketing", description: "Identifies dormant clients and automatically re-engages them with personalized offers.", enabled: false, metrics: { label1: "Re-engaged", value1: "56", label2: "Revenue Recovered", value2: "$8.4k" } },
  { id: "memomind", name: "MemoMind 🧠", category: "Admin", description: "Automatically transcribes and summarizes meetings, capturing key decisions without manual effort.", enabled: false, metrics: { label1: "Meetings Logged", value1: "28", label2: "Hours Saved", value2: "14h" } },
  { id: "taskgen", name: "TaskGen ✅", category: "Admin", description: "Parses conversations and documents to automatically create and assign tasks in project management tools.", enabled: false, metrics: { label1: "Tasks Created", value1: "156", label2: "Projects Synced", value2: "8" } },
  { id: "docuflow", name: "DocuFlow 📄", category: "Admin", description: "Auto-generates contracts, proposals, and reports from CRM data instantly.", enabled: false, metrics: { label1: "Docs Generated", value1: "42", label2: "Errors Prevented", value2: "11" } },
  { id: "signsync", name: "SignSync 🖋️", category: "Admin", description: "Manages the entire e-signature lifecycle, from sending to follow-ups and final storage.", enabled: false, metrics: { label1: "Signatures", value1: "18", label2: "Turnaround Time", value2: "-45%" } },
  { id: "appointmate", name: "AppointMate 📅", category: "Operations", description: "Automates calendar availability, booking, and buffer time allocation to eliminate email ping-pong.", enabled: false, metrics: { label1: "Appts Booked", value1: "89", label2: "Conflicts Avoided", value2: "12" } },
  { id: "reminderbot", name: "ReminderBot ⏰", category: "Operations", description: "Reduces no-shows by sending timed SMS and email reminders to scheduled clients.", enabled: false, metrics: { label1: "Reminders Sent", value1: "410", label2: "No-Show Rate", value2: "1.2%" } },
  { id: "proofpulse", name: "ProofPulse ⭐", category: "Marketing", description: "Triggers review requests to satisfied customers automatically after successful transactions or services.", enabled: false, metrics: { label1: "Requests Sent", value1: "156", label2: "Reviews Captured", value2: "34" } },
  { id: "omniserve", name: "OmniServe 🌍", category: "Operations", description: "Triages and routes incoming support emails and chats to the appropriate department.", enabled: false, metrics: { label1: "Tickets Routed", value1: "892", label2: "Avg Triage", value2: "<1s" } },
  { id: "replybot", name: "ReplyBot 💬", category: "Support", description: "Instantly answers common customer questions, deflecting basic inquiries away from human agents.", enabled: false, metrics: { label1: "Questions Answered", value1: "1.4k", label2: "Deflection Rate", value2: "68%" } },
  { id: "stocksentinel", name: "StockSentinel 📦", category: "Operations", description: "Monitors inventory levels and automatically alerts procurement when stocks drop below critical metrics.", enabled: false, metrics: { label1: "Stock Alerts", value1: "12", label2: "Outages Avoided", value2: "4" } },
  { id: "qualisync", name: "QualiSync 🚀", category: "Sales", description: "Engages new leads instantly via chat or SMS to vet them before handing off to sales.", enabled: false, metrics: { label1: "Leads Vetted", value1: "210", label2: "Sales Passed", value2: "45" } },
  { id: "screensync", name: "ScreenSync 🤝", category: "HR", description: "Automatically reviews and ranks incoming resumes against specific job requirements.", enabled: false, metrics: { label1: "Resumes Ranked", value1: "450", label2: "Shortlists", value2: "14" } },
  { id: "eventstream", name: "EventStream 🎟", category: "Marketing", description: "Manages the entire pre-event sequence to maximize webinar attendance rates.", enabled: false, metrics: { label1: "Registrants", value1: "840", label2: "Attendance", value2: "42%" } },
  { id: "omnipulse", name: "OmniPulse ⚡", category: "Marketing", description: "Fires highly targeted SMS campaigns based on user behavior and purchasing events.", enabled: false, metrics: { label1: "SMS Sent", value1: "4.2k", label2: "Event Triggers", value2: "2.1k" } },
  { id: "pulsepay", name: "PulsePay 💳", category: "Finance", description: "Automatically engages customers whose credit cards decline to recover lost recurring revenue.", enabled: false, metrics: { label1: "Declines Caught", value1: "14", label2: "Revenue Saved", value2: "$1.4k" } },
  { id: "fraudshield", name: "FraudShield 🛡", category: "Finance", description: "Monitors e-commerce transactions and flags highly suspicious orders for manual review.", enabled: false, metrics: { label1: "Orders Scanned", value1: "8.4k", label2: "Flags Raised", value2: "12" } },
  { id: "casesync", name: "CaseSync ⚖️", category: "Legal", description: "Screens and qualifies new legal inquiries before they reach attorneys, gathering initial case facts.", enabled: false, metrics: { label1: "Cases Screened", value1: "42", label2: "Hours Saved", value2: "18h" } },
  { id: "cartrevive", name: "CartRevive 🛒", category: "Sales", description: "Engages with abandoned cart customers on SMS and WhatsApp, offering intelligent discounts and recovering sales.", enabled: false, metrics: { label1: "Carts Abandoned", value1: "156", label2: "Recovered", value2: "34" } },
  { id: "returnbot", name: "ReturnBot 🔄", category: "Support", description: "Automates the entire RMA and return processing lifecycle to reduce operational costs.", enabled: false, metrics: { label1: "RMAs", value1: "45", label2: "Support Saved", value2: "12h" } },
  { id: "estimate", name: "EstimAte 📏", category: "Sales", description: "Instantly process project dimensions and job types to generate and send accurate preliminary estimates.", enabled: false, metrics: { label1: "Estimates", value1: "28", label2: "Jobs Won", value2: "6" } },
  { id: "maintainbot", name: "MaintainBot 🔧", category: "Operations", description: "Automates the intake, triage, and vendor assignment of property maintenance requests.", enabled: false, metrics: { label1: "Requests", value1: "34", label2: "Vendors", value2: "28" } },
  { id: "leasesync", name: "LeaseSync 📝", category: "Operations", description: "Handles lease renewal inquiries and automatically generates upcoming renewal paperwork.", enabled: false, metrics: { label1: "Renewals", value1: "14", label2: "Questions Auto-Answered", value2: "45" } }
];

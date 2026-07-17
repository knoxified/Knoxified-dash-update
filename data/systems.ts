export interface System {
  id: string;
  name: string;
  tier: string;
  status: 'Active' | 'Offline' | 'Deploying' | 'Needs Review' | 'Peak Performance';
  description: string;
  iconName?: string;
  complexity?: string;
  revenueImpact?: number;
  metrics?: {
    label1: string; value1: string | number;
    label2: string; value2: string | number;
    label3: string; value3: string | number;
  };
  currentActivity?: string;
}

export const SYSTEMS: System[] = [
  { 
    id: "real-estate", name: "Real Estate System", tier: "Enterprise Tier", status: "Active", 
    description: "Handles the entire property inquiry lifecycle, qualifying serious buyers and organizing viewings to build a stronger sales pipeline.", 
    iconName: "Home", complexity: "High", revenueImpact: 18400, 
    metrics: { label1: "Calls Handled", value1: 124, label2: "Leads Qualified", value2: 37, label3: "Appointments", value3: 11 },
    currentActivity: "Qualifying Zillow leads" 
  },
  { 
    id: "property", name: "Property Management System", tier: "Enterprise Tier", status: "Offline", 
    description: "Manages tenant requests end-to-end, instantly routing maintenance issues and driving lease renewals without staff involvement.", 
    iconName: "Building", complexity: "High", revenueImpact: 6200,
    metrics: { label1: "Requests Routed", value1: 45, label2: "Issues Resolved", value2: 38, label3: "Renewals", value3: 4 }
  },
  { 
    id: "dental", name: "Dental Receptionist System", tier: "Enterprise Tier", status: "Peak Performance", 
    description: "Controls complex treatment scheduling and insurance verification to ensure your chairs stay full and patients stay engaged.", 
    iconName: "Stethoscope", complexity: "High", revenueImpact: 12500, 
    metrics: { label1: "Verifications", value1: 89, label2: "Rescheduled", value2: 22, label3: "No-Shows Prevented", value3: 15 },
    currentActivity: "Handling rescheduling queue" 
  },
  { 
    id: "recruitment", name: "Recruitment System", tier: "Enterprise Tier", status: "Active", 
    description: "Runs candidate screening on autopilot, handling interview staging to ensure you never lose top talent to competitors.", 
    iconName: "Users", complexity: "High", revenueImpact: 24000, 
    metrics: { label1: "Resumes Screened", value1: 412, label2: "Interviews Staged", value2: 45, label3: "Top Talent Saved", value3: 8 },
    currentActivity: "Screening engineering candidates" 
  },
  { 
    id: "healthcare", name: "Healthcare Inquiry System", tier: "Enterprise Tier", status: "Offline", 
    description: "Automates the complete patient intake process, securing private pre-consultation triage and seamless cross-department scheduling.", 
    iconName: "HeartPulse", complexity: "High", revenueImpact: 9400,
    metrics: { label1: "Intakes Complete", value1: 130, label2: "Triage Routed", value2: 56, label3: "Hours Saved", value3: "24h" }
  },
  { 
    id: "insurance", name: "Insurance Concierge System", tier: "Enterprise Tier", status: "Offline", 
    description: "Manages first-response claims intake and seamlessly collects policy documents to accelerate your underwriting handoffs.", 
    iconName: "Shield", complexity: "High", revenueImpact: 31000,
    metrics: { label1: "Claims Initiated", value1: 82, label2: "Docs Collected", value2: 145, label3: "Processing Saved", value3: "41h" }
  },
  { 
    id: "logistics", name: "Logistics Supervisor System", tier: "Enterprise Tier", status: "Offline", 
    description: "Resolves delivery carrier tracking disputes and manages proactive exception handling to keep customers fully updated.", 
    iconName: "Truck", complexity: "High", revenueImpact: 11000,
    metrics: { label1: "Disputes Resolved", value1: 34, label2: "Exceptions Caught", value2: 78, label3: "Updates Sent", value3: 890 }
  },
  { 
    id: "ecommerce", name: "E-commerce System", tier: "Enterprise Tier", status: "Offline", 
    description: "Protects overall revenue by managing post-purchase workflows, returns authorization, and incoming order inquiries automatically.", 
    iconName: "ShoppingCart", complexity: "High", revenueImpact: 28500,
    metrics: { label1: "Returns Auth", value1: 210, label2: "Tickets Deflected", value2: 455, label3: "Revenue Retained", value3: "$14k" }
  },
  { 
    id: "corporate", name: "Corporate Virtual Executive System", tier: "Enterprise Tier", status: "Offline", 
    description: "Operates as a continuous digital executive, coordinating complex cross-department meetings to save management hours each week.", 
    iconName: "Video", complexity: "High", revenueImpact: 15000,
    metrics: { label1: "Meetings Synced", value1: 42, label2: "Conflicts Fixed", value2: 16, label3: "Exec Hours Saved", value3: "18h" }
  },
  { 
    id: "med-spa", name: "Med Spa System", tier: "Enterprise Tier", status: "Offline", 
    description: "Drives high-ticket treatment growth by securing premium consultations and managing the full membership lifecycle.", 
    iconName: "HeartPulse", complexity: "High", revenueImpact: 42000,
    metrics: { label1: "Consultations", value1: 52, label2: "Upsells Handled", value2: 28, label3: "Retention Boost", value3: "+14%" }
  },
  { 
    id: "legal", name: "Legal Intake System", tier: "Enterprise Tier", status: "Offline", 
    description: "Secures sensitive case details instantly, organizing attorney routing so your firm can focus exclusively on winning premium cases.", 
    iconName: "Scale", complexity: "High", revenueImpact: 56000,
    metrics: { label1: "Intakes Cleared", value1: 18, label2: "Conflict Checks", value2: 24, label3: "Billable Saved", value3: "32h" }
  },
  { 
    id: "construction", name: "Construction System", tier: "Enterprise Tier", status: "Offline", 
    description: "Accelerates bid closing by capturing incoming inquiries and organizing complex dispatch routing while your team stays on the job site.", 
    iconName: "Hammer", complexity: "High", revenueImpact: 35000,
    metrics: { label1: "Bids Captured", value1: 9, label2: "Crews Dispatched", value2: 34, label3: "Delay Prevented", value3: "12h" }
  },
  { 
    id: "hotel", name: "Hotel System", tier: "Enterprise Tier", status: "Offline", 
    description: "Elevates guest experiences through automated concierge-level service, upselling amenities and deflecting front-desk volume.", 
    iconName: "Building", complexity: "High", revenueImpact: 22000,
    metrics: { label1: "Requests Done", value1: 310, label2: "Upsell Revenue", value2: "$4.2k", label3: "Desk Deflection", value3: "48%" }
  },
  { 
    id: "solar", name: "Solar Consultant System", tier: "Enterprise Tier", status: "Offline", 
    description: "Manages the multi-step solar qualification process, verifying homeowner leads to secure solid, ready-to-close appointments.", 
    iconName: "Sun", complexity: "High", revenueImpact: 48000,
    metrics: { label1: "Homes Verified", value1: 115, label2: "Audits Scheduled", value2: 42, label3: "Close Rate", value3: "+8%" }
  },
  { 
    id: "retail", name: "Retail Frontdesk System", tier: "Enterprise Tier", status: "Offline", 
    description: "Drives true sales volume by handling inventory questions instantly, providing VIP-level guidance that brings customers to the register.", 
    iconName: "ShoppingBag", complexity: "High", revenueImpact: 14000,
    metrics: { label1: "Inquiries Auth", value1: 650, label2: "Inventory Lookups", value2: 280, label3: "Sales Referred", value3: 112 }
  },
  { 
    id: "custom", name: "Custom Agent System", tier: "Custom Setup", status: "Offline", 
    description: "An exclusive, tailored AI operating system engineered specifically to resolve your exact bottlenecks and scale your unique capabilities.", 
    iconName: "Briefcase", complexity: "Advanced",
    metrics: { label1: "Workflows Active", value1: 4, label2: "API calls", value2: "12k", label3: "Total Automation", value3: "99%" }
  },
  { 
    id: "plumbing", name: "Plumbing Dispatcher System", tier: "Pro Tier", status: "Offline", 
    description: "Answers emergency calls and dispatches technicians automatically.", 
    iconName: "Droplet", complexity: "Standard", revenueImpact: 6500,
    metrics: { label1: "Emergencies Handled", value1: 34, label2: "Techs Routed", value2: 28, label3: "Missed Calls", value3: 0 }
  },
  { 
    id: "hvac", name: "HVAC Dispatcher System", tier: "Pro Tier", status: "Offline", 
    description: "Handles incoming service calls and manages your technician scheduling.", 
    iconName: "Thermometer", complexity: "Standard", revenueImpact: 8200,
    metrics: { label1: "Calls Answered", value1: 156, label2: "Jobs Scheduled", value2: 44, label3: "Time Saved", value3: "15h" }
  },
  { 
    id: "roofing", name: "Roofing Estimator System", tier: "Pro Tier", status: "Offline", 
    description: "Catches storm damage leads instantly and schedules your inspections.", 
    iconName: "Hammer", complexity: "Standard", revenueImpact: 19000,
    metrics: { label1: "Storm Leads", value1: 82, label2: "Estimates Sent", value2: 45, label3: "Inspections", value3: 21 }
  },
  { 
    id: "restaurant", name: "Restaurant System", tier: "Pro Tier", status: "Offline", 
    description: "Takes reservations automatically and answers basic customer questions.", 
    iconName: "Utensils", complexity: "Standard", revenueImpact: 4500,
    metrics: { label1: "Reservations", value1: 210, label2: "Menus Read", value2: 450, label3: "Calls Deflected", value3: "65%" }
  },
  { 
    id: "fitness", name: "Gym & Fitness System", tier: "Pro Tier", status: "Offline", 
    description: "Answers membership inquiries and helps book trial passes for new visitors.", 
    iconName: "Dumbbell", complexity: "Standard", revenueImpact: 3200,
    metrics: { label1: "Trials Booked", value1: 45, label2: "Info Given", value2: 120, label3: "Signups", value3: 14 }
  },
  { 
    id: "automotive", name: "Automotive Dealership System", tier: "Pro Tier", status: "Offline", 
    description: "Helps dealerships book test drives and log initial vehicle interest.", 
    iconName: "Car", complexity: "Standard", revenueImpact: 21000,
    metrics: { label1: "Test Drives", value1: 34, label2: "Leads Logged", value2: 89, label3: "Follow-ups", value3: 156 }
  }
];

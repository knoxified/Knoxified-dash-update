const fs = require('fs');
let content = fs.readFileSync('app/campaigns/page.tsx', 'utf8');

content = content.replace(/import { useState } from "react";/, 'import { useState } from "react";\nimport { Select } from "@/components/ui/Select";');

content = content.replace(
/<select[\s\S]*?value=\{newCampaign\.audience\}[\s\S]*?onChange=\{\(e\) => setNewCampaign\(\{ \.\.\.newCampaign, audience: e\.target\.value \}\)\}[\s\S]*?>\s*<option value="">Select an audience\.\.\.<\/option>\s*<option value="All Qualified Leads">All Qualified Leads<\/option>\s*<option value="Uploaded CSV \(Marketing List\)">Uploaded CSV \(Marketing List\)<\/option>\s*<\/select>/m,
`<Select 
                    value={newCampaign.audience} 
                    onChange={(val) => setNewCampaign({ ...newCampaign, audience: val })} 
                    options={[
                      { value: "All Qualified Leads", label: "All Qualified Leads" },
                      { value: "Uploaded CSV (Marketing List)", label: "Uploaded CSV (Marketing List)" }
                    ]}
                  />`
);

content = content.replace(
/<select[\s\S]*?value=\{newCampaign\.type\}[\s\S]*?onChange=\{\(e\) => setNewCampaign\(\{ \.\.\.newCampaign, type: e\.target\.value \}\)\}[\s\S]*?>\s*<option value="Email">Email<\/option>\s*<option value="SMS">SMS<\/option>\s*<option value="Voice \+ SMS">Voice \+ SMS<\/option>\s*<option value="Multi-Channel">Multi-Channel<\/option>\s*<\/select>/m,
`<Select 
                    value={newCampaign.type} 
                    onChange={(val) => setNewCampaign({ ...newCampaign, type: val })} 
                    options={[
                      { value: "Email", label: "Email" },
                      { value: "SMS", label: "SMS" },
                      { value: "Voice + SMS", label: "Voice + SMS" },
                      { value: "Multi-Channel", label: "Multi-Channel" }
                    ]}
                  />`
);

content = content.replace(
/<select[\s\S]*?value=\{newCampaign\.consentSource\}[\s\S]*?onChange=\{\(e\) => setNewCampaign\(\{ \.\.\.newCampaign, consentSource: e\.target\.value \}\)\}[\s\S]*?>\s*<option value="">Select consent basis\.\.\.<\/option>\s*<option value="Existing Customers \(Implied Consent\)">Existing Customers \(Implied Consent\)<\/option>\s*<option value="Inbound Inquiry \/ Web Form">Inbound Inquiry \/ Web Form<\/option>\s*<option value="Explicit Opt-In List">Explicit Opt-In List<\/option>\s*<\/select>/m,
`<Select 
                      value={newCampaign.consentSource} 
                      onChange={(val) => setNewCampaign({ ...newCampaign, consentSource: val })} 
                      options={[
                        { value: "Existing Customers (Implied Consent)", label: "Existing Customers (Implied Consent)" },
                        { value: "Inbound Inquiry / Web Form", label: "Inbound Inquiry / Web Form" },
                        { value: "Explicit Opt-In List", label: "Explicit Opt-In List" }
                      ]}
                    />`
);

content = content.replace(
/<select[\s\S]*?value=\{newCampaign\.startTime\}[\s\S]*?onChange=\{\(e\) => setNewCampaign\(\{ \.\.\.newCampaign, startTime: e\.target\.value \}\)\}[\s\S]*?>\s*<option value="08:00 AM \(Local Time\)">08:00 AM \(Local Time\)<\/option>\s*<option value="09:00 AM \(Local Time\)">09:00 AM \(Local Time\)<\/option>\s*<option value="10:00 AM \(Local Time\)">10:00 AM \(Local Time\)<\/option>\s*<\/select>/m,
`<Select 
                        value={newCampaign.startTime} 
                        onChange={(val) => setNewCampaign({ ...newCampaign, startTime: val })} 
                        options={[
                          { value: "08:00 AM (Local Time)", label: "08:00 AM (Local Time)" },
                          { value: "09:00 AM (Local Time)", label: "09:00 AM (Local Time)" },
                          { value: "10:00 AM (Local Time)", label: "10:00 AM (Local Time)" }
                        ]}
                      />`
);

content = content.replace(
/<select[\s\S]*?value=\{newCampaign\.endTime\}[\s\S]*?onChange=\{\(e\) => setNewCampaign\(\{ \.\.\.newCampaign, endTime: e\.target\.value \}\)\}[\s\S]*?>\s*<option value="05:00 PM \(Local Time\)">05:00 PM \(Local Time\)<\/option>\s*<option value="07:00 PM \(Local Time\)">07:00 PM \(Local Time\)<\/option>\s*<option value="09:00 PM \(Local Time\)">09:00 PM \(Local Time\)<\/option>\s*<option value="10:00 PM \(Restricted\)" disabled>10:00 PM \(Restricted\)<\/option>\s*<\/select>/m,
`<Select 
                        value={newCampaign.endTime} 
                        onChange={(val) => setNewCampaign({ ...newCampaign, endTime: val })} 
                        options={[
                          { value: "05:00 PM (Local Time)", label: "05:00 PM (Local Time)" },
                          { value: "07:00 PM (Local Time)", label: "07:00 PM (Local Time)" },
                          { value: "09:00 PM (Local Time)", label: "09:00 PM (Local Time)" },
                          { value: "10:00 PM (Restricted)", label: "10:00 PM (Restricted)" }
                        ]}
                      />`
);

fs.writeFileSync('app/campaigns/page.tsx', content, 'utf8');

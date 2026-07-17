const fs = require('fs');
let content = fs.readFileSync('app/automations/[id]/MailCraftBoard.tsx', 'utf8');

content = content.replace(/import \{ useState \} from "react";/, 'import { useState } from "react";\nimport { Select } from "@/components/ui/Select";');

content = content.replace(
/<select style=\{\{[^}]+\}\}\s*className="[^"]+"\s*>\s*<option>Book a Meeting<\/option>\s*<option>Share Content\/Value<\/option>\s*<option>Event Invitation<\/option>\s*<\/select>/m,
`<Select 
                 value="Book a Meeting"
                 onChange={() => {}}
                 options={[
                   { value: "Book a Meeting", label: "Book a Meeting" },
                   { value: "Share Content/Value", label: "Share Content/Value" },
                   { value: "Event Invitation", label: "Event Invitation" }
                 ]}
               />`
);

content = content.replace(
/<select style=\{\{[^}]+\}\}\s*className="[^"]+"\s*>\s*<option>Professional & Direct<\/option>\s*<option>Casual & Friendly<\/option>\s*<option>Data-Driven<\/option>\s*<\/select>/m,
`<Select 
                 value="Professional & Direct"
                 onChange={() => {}}
                 options={[
                   { value: "Professional & Direct", label: "Professional & Direct" },
                   { value: "Casual & Friendly", label: "Casual & Friendly" },
                   { value: "Data-Driven", label: "Data-Driven" }
                 ]}
               />`
);

fs.writeFileSync('app/automations/[id]/MailCraftBoard.tsx', content, 'utf8');

// Shared (client + server) DocuFlow helpers. No server-only imports here.

export const AUTO_FIELDS = [
  "client_name", "client_email", "client_company", "client_phone", "client_address", "business_name", "date",
] as const;

export type DocKind = "contract" | "proposal" | "report" | "other";
export const DOC_KINDS: DocKind[] = ["contract", "proposal", "report", "other"];

export function extractFields(body: string): string[] {
  const seen = new Set<string>();
  for (const m of String(body || "").matchAll(/\{\{\s*([a-z0-9_]{1,40})\s*\}\}/gi)) seen.add(m[1].toLowerCase());
  return [...seen];
}

export function renderTemplate(body: string, values: Record<string, string>): string {
  return String(body || "").replace(/\{\{\s*([a-z0-9_]{1,40})\s*\}\}/gi, (_, k) => (values[String(k).toLowerCase()] ?? "").trim());
}

export function fieldLabel(key: string): string {
  const s = key.replace(/_/g, " ");
  return s[0].toUpperCase() + s.slice(1);
}

export const STARTER_TEMPLATES: { name: string; kind: DocKind; body: string }[] = [
  {
    name: "Service agreement",
    kind: "contract",
    body: `# Service Agreement

This agreement is made on {{date}} between {{business_name}} ("the Provider") and {{client_name}} ({{client_company}}) ("the Client").

## 1. Services
The Provider will deliver the following services: {{services_description}}

## 2. Fees and payment
The Client will pay {{fee_amount}}, payable {{payment_terms}}.

## 3. Timeline
Work will begin on {{start_date}} and is expected to be completed by {{end_date}}.

## 4. Confidentiality
Both parties agree to keep confidential any non-public information shared during this engagement.

## 5. Termination
Either party may end this agreement with {{notice_period}} written notice. The Client will pay for work completed up to the termination date.

## 6. General
This agreement is the entire understanding between the parties and may only be changed in writing by both parties.

Provider: {{business_name}}
Client: {{client_name}}`,
  },
  {
    name: "Project proposal",
    kind: "proposal",
    body: `# Proposal for {{client_name}}

Prepared by {{business_name}} on {{date}}

## Overview
{{project_summary}}

## What we will deliver
{{deliverables}}

## Timeline
{{timeline}}

## Investment
{{price}}

## Next steps
If this proposal works for you, reply to this email and we will confirm the start date.`,
  },
  {
    name: "Status report",
    kind: "report",
    body: `# Status Report for {{client_name}}

Prepared by {{business_name}} on {{date}}

## Summary
{{summary}}

## Completed this period
{{completed}}

## Planned next
{{next_steps}}

## Issues or blockers
{{blockers}}`,
  },
];

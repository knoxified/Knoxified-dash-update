// Default 4-email sequence and placeholder handling. Shared by the campaign
// launcher (client) and the launch action (server) so what the user previews
// is exactly what gets rendered per recipient.

export type TemplateEmail = { subject: string; body: string };

// Mailboxes a sequence can send from. Must match the providers the auth
// service (oauth.knoxified.org) supports and campaigns.provider's CHECK.
export type MailProvider = "google" | "microsoft" | "zoho";
export const MAIL_PROVIDERS: MailProvider[] = ["google", "microsoft", "zoho"];
export const MAIL_PROVIDER_LABEL: Record<MailProvider, string> = {
  google: "Google (Gmail)",
  microsoft: "Microsoft 365 (Outlook)",
  zoho: "Zoho Mail",
};

export const ALLOWED_TOKENS = ["first_name", "company", "sender_name"] as const;

// Deliberately free of made-up statistics or claims: the customer must be able
// to send these as-is without misrepresenting anything.
export const DEFAULT_SEQUENCE: TemplateEmail[] = [
  {
    subject: "Quick question, {{first_name}}",
    body:
      "Hi {{first_name}},\n\nI'm reaching out from {{sender_name}}. We help businesses like {{company}} keep on top of customer calls and follow-ups without adding to the workload.\n\nWould a short conversation be worthwhile to see if we can help?\n\nBest regards,\n{{sender_name}}",
  },
  {
    subject: "Following up, {{first_name}}",
    body:
      "Hi {{first_name}},\n\nJust following up on my note from a few days ago. If now isn't the right time, no problem at all. If you'd like to hear how we could help {{company}}, reply to this email and we'll find a time that suits you.\n\nBest regards,\n{{sender_name}}",
  },
  {
    subject: "An unanswered call costs more than it seems",
    body:
      "Hi {{first_name}},\n\nUnanswered calls and slow follow-ups are one of the most common ways businesses lose customers. We help make sure that doesn't happen.\n\nIf that sounds familiar, I'd be glad to show you how it works. Just reply and let me know.\n\nBest regards,\n{{sender_name}}",
  },
  {
    subject: "Closing the loop",
    body:
      "Hi {{first_name}},\n\nI haven't heard back, so I'll assume this isn't a priority right now and won't email again. If that changes, you're welcome to reply any time.\n\nWishing you and {{company}} all the best,\n{{sender_name}}",
  },
];

// Returns every {{token}} in the text that isn't one we can fill in.
export function findUnknownTokens(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/\{\{\s*([^{}]*?)\s*\}\}/g)) {
    if (!(ALLOWED_TOKENS as readonly string[]).includes(m[1])) found.add(m[0]);
  }
  return [...found];
}

export function renderTemplate(
  text: string,
  vars: { first_name?: string | null; company?: string | null; sender_name?: string | null }
): string {
  const values: Record<string, string> = {
    first_name: vars.first_name?.trim() || "there",
    company: vars.company?.trim() || "your business",
    sender_name: vars.sender_name?.trim() || "",
  };
  return text.replace(/\{\{\s*([^{}]*?)\s*\}\}/g, (whole, key: string) => (key in values ? values[key] : whole));
}

export function firstNameOf(fullName: string | null | undefined): string {
  return (fullName || "").trim().split(/\s+/)[0] || "";
}

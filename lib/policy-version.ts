// Bump this whenever any of the seven linked policy documents materially
// change -- re-prompts everyone to accept again (see settings/page.tsx),
// and any account still on an older version gets blocked from outbound-
// capable automations (see the compliance gate in the API routes) until
// they re-accept. Keep this as the single source of truth; both the UI
// and the server-side gate import from here so they can't drift apart.
export const CURRENT_POLICY_VERSION = "2026-09-17";

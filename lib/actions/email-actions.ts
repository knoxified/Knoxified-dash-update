"use server";

import { createClient } from "@/lib/supabase/server";
import { requireComplianceAcknowledged, logAuditEvent } from "@/lib/actions/compliance-actions";
import { findUnknownTokens, renderTemplate, firstNameOf, MAIL_PROVIDERS, type MailProvider, type TemplateEmail } from "@/lib/email-templates";

const FOLLOWFLOW_KEY = "email_sequence_send";
const MAX_RECIPIENTS_PER_LAUNCH = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---------- Types ----------

export type EmailStatus = "draft" | "scheduled" | "sent" | "failed" | "cancelled";

export type EmailRow = {
  id: string;
  status: EmailStatus;
  source: "mailcraft" | "template" | "manual";
  step: number;
  to_email: string;
  to_name: string | null;
  subject: string;
  body: string;
  sequence_id: string | null;
  campaign_id: string | null;
  lead_id: string | null;
  sent_at: string | null;
  created_at: string;
  error: string | null;
};

export type CampaignSummary = {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "completed";
  gapDays: number;
  createdAt: string;
  totalRecipients: number;
  active: number;
  completed: number;
  replied: number;
  unsubscribed: number;
  failed: number;
  emailsSent: number;
  emailsPlanned: number;
};

export type RecipientRow = {
  id: string;
  email: string;
  status: string;
  current_step: number;
  total_steps: number;
  next_send_at: string | null;
  last_error: string | null;
};

const EMAIL_COLUMNS =
  "id, status, source, step, to_email, to_name, subject, body, sequence_id, campaign_id, lead_id, sent_at, created_at, error";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

// ---------- Sender readiness ----------

export async function getSenderInfo(): Promise<{
  connectedProviders: MailProvider[];
  followFlowSetUp: boolean;
  followFlowEnabled: boolean;
  defaultSenderName: string;
}> {
  const { supabase, user } = await requireUser();

  // Connections live in oauth_connections (written by the auth service), the
  // same table the Integrations page reads.
  const [{ data: conns }, { data: profile }, { data: catalog }] = await Promise.all([
    supabase.from("oauth_connections").select("provider, status").eq("user_id", user.id).in("provider", MAIL_PROVIDERS),
    supabase.from("user_profiles").select("organization_name, full_name").eq("user_id", user.id).maybeSingle(),
    supabase.from("automation_catalog").select("id").eq("key", FOLLOWFLOW_KEY).maybeSingle(),
  ]);

  let enabled = false;
  if (catalog?.id) {
    const { data: ua } = await supabase
      .from("user_automations")
      .select("is_enabled")
      .eq("user_id", user.id)
      .eq("automation_id", catalog.id)
      .maybeSingle();
    enabled = !!ua?.is_enabled;
  }

  return {
    connectedProviders: MAIL_PROVIDERS.filter((p) =>
      (conns || []).some((c) => c.provider === p && (!c.status || c.status === "active"))
    ),
    followFlowSetUp: !!catalog?.id,
    followFlowEnabled: enabled,
    defaultSenderName: profile?.organization_name || profile?.full_name || "",
  };
}

// ---------- Emails page + MailCraft drafts ----------

export async function getEmails(): Promise<{ emails: EmailRow[]; error: string | null }> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("emails")
    .select(EMAIL_COLUMNS)
    .eq("user_id", user.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(800);
  if (error) return { emails: [], error: error.message };
  return { emails: (data || []) as EmailRow[], error: null };
}

type MailCraftItem = {
  email: string;
  firstName?: string;
  companyName?: string;
  sequence?: Record<string, string>;
};

// Every MailCraft generation is stored as drafts so it shows up on the Emails
// page instead of vanishing when the tab closes. One sequence_id groups the 4
// emails written for one person.
export async function saveMailCraftDrafts(items: MailCraftItem[]): Promise<{ saved: number; error?: string }> {
  const { supabase, user } = await requireUser();

  const usable = (items || []).filter((i) => i?.email && EMAIL_RE.test(i.email.trim()) && i.sequence);
  if (usable.length === 0) return { saved: 0 };

  const emails = usable.map((i) => i.email.trim().toLowerCase());
  const { data: leadMatches } = await supabase.from("leads").select("id, email").eq("user_id", user.id).in("email", emails);
  const leadByEmail = new Map((leadMatches || []).map((l) => [String(l.email).toLowerCase(), l.id as string]));

  const rows: Record<string, unknown>[] = [];
  let saved = 0;
  for (const item of usable) {
    const seq = item.sequence || {};
    const sequenceId = crypto.randomUUID();
    const to = item.email.trim().toLowerCase();
    let any = false;
    for (let step = 1; step <= 4; step++) {
      const subject = (seq[`subjectLine${step}`] || "").trim();
      const body = (seq[`emailBody${step}`] || "").trim();
      if (!subject || !body) continue;
      any = true;
      rows.push({
        user_id: user.id,
        lead_id: leadByEmail.get(to) || null,
        sequence_id: sequenceId,
        step,
        to_email: to,
        to_name: item.firstName?.trim() || null,
        subject,
        body,
        status: "draft",
        source: "mailcraft",
      });
    }
    if (any) saved++;
  }
  if (rows.length === 0) return { saved: 0 };

  const { error } = await supabase.from("emails").insert(rows);
  if (error) return { saved: 0, error: error.message };
  return { saved };
}

export async function deleteDraftSequences(sequenceIds: string[]): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireUser();
  if (!sequenceIds?.length) return { ok: false, error: "Nothing selected." };
  const { error } = await supabase
    .from("emails")
    .delete()
    .eq("user_id", user.id)
    .eq("status", "draft")
    .in("sequence_id", sequenceIds);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function updateDraftEmail(emailId: string, subject: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireUser();
  if (!subject.trim() || !body.trim()) return { ok: false, error: "Subject and body can't be empty." };
  const { error } = await supabase
    .from("emails")
    .update({ subject: subject.trim(), body: body.trim() })
    .eq("id", emailId)
    .eq("user_id", user.id)
    .eq("status", "draft");
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ---------- Launching a campaign ----------

export type LaunchInput = {
  name: string;
  gapDays: number;
  consentSource: string;
  mailingAddress: string;
  senderName: string;
  provider: MailProvider;
  mode: "leads" | "sequences";
  leadIds?: string[];
  sequenceIds?: string[];
  template?: TemplateEmail[];
};

export async function launchCampaign(
  input: LaunchInput
): Promise<{ ok: boolean; campaignId?: string; recipients?: number; skipped?: { noEmail: number; suppressed: number; duplicate: number }; error?: string }> {
  const { supabase, user } = await requireUser();

  // 1. Same server-side policy gate MailCraft/LeadReach use.
  const compliance = await requireComplianceAcknowledged(user.id);
  if (!compliance.ok) return { ok: false, error: compliance.error };

  // 2. Basic validation.
  const name = input.name?.trim();
  const consentSource = input.consentSource?.trim();
  const mailingAddress = input.mailingAddress?.trim();
  const senderName = input.senderName?.trim();
  const gapDays = Math.round(Number(input.gapDays));
  if (!name || !consentSource || !senderName) return { ok: false, error: "Name, sender name and consent source are required." };
  if (!mailingAddress || mailingAddress.length < 8) {
    return { ok: false, error: "A business mailing address is required. It appears in every email's footer, as anti-spam law requires." };
  }
  if (!Number.isInteger(gapDays) || gapDays < 1 || gapDays > 14) return { ok: false, error: "Days between emails must be between 1 and 14." };

  // 3. FollowFlow must be set up and switched on, and a mailbox connected.
  const sender = await getSenderInfo();
  if (!sender.followFlowSetUp) return { ok: false, error: "FollowFlow isn't set up on this account yet." };
  if (!sender.followFlowEnabled) return { ok: false, error: "Turn on the FollowFlow automation first (Automations page)." };
  if (!MAIL_PROVIDERS.includes(input.provider)) return { ok: false, error: "Choose which mailbox to send from." };
  if (!sender.connectedProviders.includes(input.provider)) {
    return { ok: false, error: "That mailbox isn't connected. Connect it in Integrations first. Emails send from your own mailbox." };
  }

  // 4. Work out who gets what.
  type Plan = { email: string; leadId: string | null; emails: TemplateEmail[]; draftIds?: string[]; toName: string | null; sequenceId: string | null };
  const plans: Plan[] = [];
  const skipped = { noEmail: 0, suppressed: 0, duplicate: 0 };

  if (input.mode === "leads") {
    const tpl = input.template || [];
    if (tpl.length !== 4 || tpl.some((t) => !t.subject?.trim() || !t.body?.trim())) {
      return { ok: false, error: "All 4 emails need a subject and a body." };
    }
    const unknown = tpl.flatMap((t) => [...findUnknownTokens(t.subject), ...findUnknownTokens(t.body)]);
    if (unknown.length > 0) {
      return { ok: false, error: `Unknown placeholder ${unknown[0]}. You can use {{first_name}}, {{company}} and {{sender_name}}.` };
    }
    const ids = [...new Set(input.leadIds || [])];
    if (ids.length === 0) return { ok: false, error: "Choose who should receive this." };

    const { data: leads, error } = await supabase.from("leads").select("id, name, email, company, consent_source").eq("user_id", user.id).in("id", ids);
    if (error) return { ok: false, error: error.message };

    const seen = new Set<string>();
    for (const l of leads || []) {
      const email = l.email?.trim().toLowerCase();
      if (!email || !EMAIL_RE.test(email)) {
        skipped.noEmail++;
        continue;
      }
      if (seen.has(email)) {
        skipped.duplicate++;
        continue;
      }
      seen.add(email);
      const vars = { first_name: firstNameOf(l.name), company: l.company, sender_name: senderName };
      plans.push({
        email,
        leadId: l.id,
        toName: firstNameOf(l.name) || null,
        sequenceId: null,
        emails: tpl.map((t) => ({ subject: renderTemplate(t.subject, vars), body: renderTemplate(t.body, vars) })),
      });
    }
  } else {
    const seqIds = [...new Set(input.sequenceIds || [])];
    if (seqIds.length === 0) return { ok: false, error: "Choose which drafted sequences to send." };

    const { data: drafts, error } = await supabase
      .from("emails")
      .select("id, sequence_id, step, to_email, to_name, subject, body")
      .eq("user_id", user.id)
      .eq("status", "draft")
      .in("sequence_id", seqIds)
      .order("step");
    if (error) return { ok: false, error: error.message };

    const bySeq = new Map<string, typeof drafts>();
    for (const d of drafts || []) {
      const list = bySeq.get(d.sequence_id as string) || [];
      list.push(d);
      bySeq.set(d.sequence_id as string, list);
    }

    const emailsToCheck = [...bySeq.values()].map((g) => g![0].to_email.toLowerCase());
    const { data: leadMatches } = await supabase.from("leads").select("id, email").eq("user_id", user.id).in("email", emailsToCheck);
    const leadByEmail = new Map((leadMatches || []).map((l) => [String(l.email).toLowerCase(), l.id as string]));

    const seen = new Set<string>();
    for (const [seqId, group] of bySeq) {
      const g = group!;
      const contiguous = g.every((d, i) => d.step === i + 1);
      const email = g[0].to_email.trim().toLowerCase();
      if (!contiguous || !EMAIL_RE.test(email)) {
        skipped.noEmail++;
        continue;
      }
      if (seen.has(email)) {
        skipped.duplicate++;
        continue;
      }
      seen.add(email);
      plans.push({
        email,
        leadId: leadByEmail.get(email) || null,
        toName: g[0].to_name,
        sequenceId: seqId,
        draftIds: g.map((d) => d.id),
        emails: g.map((d) => ({ subject: d.subject, body: d.body })),
      });
    }
  }

  // 5. Never email anyone who has unsubscribed from this account.
  if (plans.length > 0) {
    const { data: suppressed } = await supabase.from("email_suppressions").select("email").eq("user_id", user.id).in("email", plans.map((p) => p.email));
    const blocked = new Set((suppressed || []).map((s) => String(s.email).toLowerCase()));
    if (blocked.size > 0) {
      const before = plans.length;
      for (let i = plans.length - 1; i >= 0; i--) if (blocked.has(plans[i].email)) plans.splice(i, 1);
      skipped.suppressed = before - plans.length;
    }
  }

  if (plans.length === 0) {
    return { ok: false, skipped, error: "Nobody to send to. Everyone selected is missing an email address or has unsubscribed." };
  }
  if (plans.length > MAX_RECIPIENTS_PER_LAUNCH) {
    return { ok: false, skipped, error: `Send to up to ${MAX_RECIPIENTS_PER_LAUNCH} people per campaign (you selected ${plans.length}). Split it into batches.` };
  }

  // 6. Create the campaign, its recipients, then every scheduled email.
  const { data: campaign, error: campErr } = await supabase
    .from("campaigns")
    .insert({
      user_id: user.id,
      name,
      status: "active",
      gap_days: gapDays,
      consent_source: consentSource,
      mailing_address: mailingAddress,
      sender_name: senderName,
      provider: input.provider,
      source: input.mode === "sequences" ? "mailcraft" : "leads",
      launched_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (campErr || !campaign) return { ok: false, error: campErr?.message || "Couldn't create the campaign." };

  const rollback = async (message: string) => {
    await supabase.from("campaigns").delete().eq("id", campaign.id); // cascades to recipients + emails
    return { ok: false as const, error: message };
  };

  const nowIso = new Date().toISOString();
  const { data: recipients, error: recErr } = await supabase
    .from("campaign_recipients")
    .insert(
      plans.map((p) => ({
        campaign_id: campaign.id,
        user_id: user.id,
        lead_id: p.leadId,
        email: p.email,
        total_steps: p.emails.length,
        next_send_at: nowIso,
      }))
    )
    .select("id, email");
  if (recErr || !recipients) return rollback(recErr?.message || "Couldn't add recipients.");

  const recipientByEmail = new Map(recipients.map((r) => [String(r.email).toLowerCase(), r.id as string]));
  const emailRows = plans.flatMap((p) =>
    p.emails.map((e, i) => ({
      user_id: user.id,
      campaign_id: campaign.id,
      recipient_id: recipientByEmail.get(p.email),
      lead_id: p.leadId,
      sequence_id: p.sequenceId,
      step: i + 1,
      to_email: p.email,
      to_name: p.toName,
      subject: e.subject,
      body: e.body,
      status: "scheduled",
      source: input.mode === "sequences" ? "mailcraft" : "template",
    }))
  );
  for (let i = 0; i < emailRows.length; i += 200) {
    const { error: mailErr } = await supabase.from("emails").insert(emailRows.slice(i, i + 200));
    if (mailErr) return rollback(mailErr.message);
  }

  // 7. Drafts have been copied into scheduled emails; remove the originals.
  const draftIds = plans.flatMap((p) => p.draftIds || []);
  if (draftIds.length > 0) {
    await supabase.from("emails").delete().eq("user_id", user.id).eq("status", "draft").in("id", draftIds);
  }

  // 8. The user attested a lawful basis for this audience: record it on any
  //    lead that didn't have one, and write the audit trail.
  const leadIdsUsed = plans.map((p) => p.leadId).filter(Boolean) as string[];
  if (leadIdsUsed.length > 0) {
    await supabase.from("leads").update({ consent_source: consentSource }).eq("user_id", user.id).in("id", leadIdsUsed).is("consent_source", null);
  }
  try {
    await logAuditEvent(
      "Email Campaign Launched",
      `"${name}" to ${plans.length} recipients, ${gapDays} days apart. Consent basis: ${consentSource}.`
    );
  } catch {
    // Audit logging must never undo a launched campaign.
  }

  return { ok: true, campaignId: campaign.id, recipients: plans.length, skipped };
}

// ---------- Tracking ----------

export async function getCampaigns(): Promise<{ campaigns: CampaignSummary[]; error: string | null }> {
  const { supabase, user } = await requireUser();

  const { data: camps, error } = await supabase
    .from("campaigns")
    .select("id, name, status, gap_days, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return { campaigns: [], error: error.message };
  if (!camps || camps.length === 0) return { campaigns: [], error: null };

  const ids = camps.map((c) => c.id);
  const [{ data: recs }, { data: sent }] = await Promise.all([
    supabase.from("campaign_recipients").select("campaign_id, status, total_steps").in("campaign_id", ids).limit(20000),
    supabase.from("emails").select("campaign_id").in("campaign_id", ids).eq("status", "sent").limit(50000),
  ]);

  const summary = new Map<string, CampaignSummary>();
  for (const c of camps) {
    summary.set(c.id, {
      id: c.id,
      name: c.name,
      status: c.status,
      gapDays: c.gap_days,
      createdAt: c.created_at,
      totalRecipients: 0,
      active: 0,
      completed: 0,
      replied: 0,
      unsubscribed: 0,
      failed: 0,
      emailsSent: 0,
      emailsPlanned: 0,
    });
  }
  for (const r of recs || []) {
    const s = summary.get(r.campaign_id);
    if (!s) continue;
    s.totalRecipients++;
    s.emailsPlanned += r.total_steps;
    if (r.status === "active" || r.status === "paused") s.active++;
    else if (r.status === "completed") s.completed++;
    else if (r.status === "replied") s.replied++;
    else if (r.status === "unsubscribed") s.unsubscribed++;
    else if (r.status === "failed") s.failed++;
  }
  for (const e of sent || []) {
    const s = summary.get(e.campaign_id as string);
    if (s) s.emailsSent++;
  }
  return { campaigns: camps.map((c) => summary.get(c.id)!), error: null };
}

export async function getCampaignRecipients(campaignId: string): Promise<{ recipients: RecipientRow[]; error: string | null }> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("campaign_recipients")
    .select("id, email, status, current_step, total_steps, next_send_at, last_error")
    .eq("user_id", user.id)
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) return { recipients: [], error: error.message };
  return { recipients: (data || []) as RecipientRow[], error: null };
}

export async function setCampaignStatus(campaignId: string, status: "active" | "paused"): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireUser();
  const from = status === "paused" ? "active" : "paused";
  const { error } = await supabase.from("campaigns").update({ status }).eq("id", campaignId).eq("user_id", user.id).eq("status", from);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// Reply detection would need read access to the customer's inbox, which is a
// much heavier Google permission. Until then the customer marks replies by
// hand, which stops the rest of that person's sequence.
export async function markRecipientReplied(recipientId: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  const { data: rec, error } = await supabase
    .from("campaign_recipients")
    .update({ status: "replied", next_send_at: null, updated_at: new Date().toISOString() })
    .eq("id", recipientId)
    .eq("user_id", user.id)
    .in("status", ["active", "paused"])
    .select("campaign_id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!rec) return { ok: false, error: "That person isn't in an active sequence." };

  await supabase.from("emails").update({ status: "cancelled" }).eq("recipient_id", recipientId).eq("user_id", user.id).eq("status", "scheduled");

  const { count } = await supabase
    .from("campaign_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", rec.campaign_id)
    .in("status", ["active", "paused"]);
  if (!count) {
    await supabase.from("campaigns").update({ status: "completed" }).eq("id", rec.campaign_id).eq("user_id", user.id).eq("status", "active");
  }
  return { ok: true };
}

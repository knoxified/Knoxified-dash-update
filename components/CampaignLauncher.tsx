"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Select } from "@/components/ui/Select";
import { launchCampaign, getSenderInfo } from "@/lib/actions/email-actions";
import { getComplianceAcknowledgment, submitComplianceAcknowledgment } from "@/lib/actions/compliance-actions";
import { CURRENT_POLICY_VERSION } from "@/lib/policy-version";
import { DEFAULT_SEQUENCE, type TemplateEmail } from "@/lib/email-templates";

type Props = {
  open: boolean;
  onClose: () => void;
  mode: "leads" | "sequences";
  leadIds?: string[];
  sequenceIds?: string[];
  audienceLabel: string;
  onLaunched: (result: { campaignId: string; recipients: number }) => void;
};

const CONSENT_OPTIONS = [
  "Existing Customers (Implied Consent)",
  "Inbound Inquiry / Web Form",
  "Explicit Opt-In List",
].map((v) => ({ value: v, label: v }));

const GAP_OPTIONS = [2, 3, 4, 5].map((d) => ({ value: String(d), label: `${d} days` }));

const inputCls =
  "w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00E5FF]";

type Readiness = {
  googleConnected: boolean;
  followFlowSetUp: boolean;
  followFlowEnabled: boolean;
  defaultSenderName: string;
};

export default function CampaignLauncher({ open, onClose, mode, leadIds, sequenceIds, audienceLabel, onLaunched }: Props) {
  const [loading, setLoading] = useState(true);
  const [needsAck, setNeedsAck] = useState(false);
  const [ackChecked, setAckChecked] = useState(false);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [launching, setLaunching] = useState(false);

  const [name, setName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [mailingAddress, setMailingAddress] = useState("");
  const [gapDays, setGapDays] = useState("3");
  const [consentSource, setConsentSource] = useState("");
  const [template, setTemplate] = useState<TemplateEmail[]>(DEFAULT_SEQUENCE);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([getSenderInfo(), getComplianceAcknowledgment()])
      .then(([info, ack]) => {
        if (cancelled) return;
        setReadiness(info);
        setSenderName((prev) => prev || info.defaultSenderName);
        setNeedsAck(!(ack.acknowledgedAt && ack.agreedVersion === CURRENT_POLICY_VERSION));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error("Couldn't load your account details. Please try again.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const blocker =
    readiness && !readiness.followFlowSetUp
      ? { text: "FollowFlow isn't set up on this account yet.", href: null as string | null, cta: "" }
      : readiness && !readiness.followFlowEnabled
        ? { text: "Turn on the FollowFlow automation to send sequences.", href: "/automations", cta: "Open Automations" }
        : readiness && !readiness.googleConnected
          ? { text: "Connect your Google account so emails send from your own mailbox.", href: "/integrations", cta: "Open Integrations" }
          : null;

  const handleAcknowledge = async () => {
    try {
      await submitComplianceAcknowledgment(CURRENT_POLICY_VERSION);
      setNeedsAck(false);
      toast.success("Thanks. You can launch campaigns now.");
    } catch {
      toast.error("Couldn't save your acknowledgment. Please try again.");
    }
  };

  const handleLaunch = async () => {
    if (!name.trim() || !senderName.trim() || !mailingAddress.trim() || !consentSource) {
      toast.error("Please fill out every required field.");
      return;
    }
    if (!reviewed) {
      toast.error("Please confirm you've reviewed the emails.");
      return;
    }
    setLaunching(true);
    const res = await launchCampaign({
      name,
      gapDays: Number(gapDays),
      consentSource,
      mailingAddress,
      senderName,
      mode,
      leadIds,
      sequenceIds,
      template: mode === "leads" ? template : undefined,
    });
    setLaunching(false);
    if (!res.ok || !res.campaignId) {
      toast.error(res.error || "Couldn't launch the campaign.");
      return;
    }
    const s = res.skipped;
    const skippedTotal = s ? s.noEmail + s.suppressed + s.duplicate : 0;
    toast.success(
      `Campaign launched to ${res.recipients} ${res.recipients === 1 ? "person" : "people"}${skippedTotal > 0 ? ` (${skippedTotal} skipped: no email, unsubscribed or duplicate)` : ""}.`
    );
    onLaunched({ campaignId: res.campaignId, recipients: res.recipients || 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Start a 4-email sequence</h2>
            <p className="text-xs text-slate-500 dark:text-[#888] mt-0.5">To: {audienceLabel}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-[#888]">Checking your account...</p>
          ) : needsAck ? (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">One quick agreement first</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>You have a <strong>lawful basis</strong> for contacting every recipient.</li>
                <li>You hold the <strong>consent documentation</strong> your country and campaign type require.</li>
                <li>You&apos;ll honor unsubscribes and do-not-contact obligations.</li>
              </ul>
              <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={ackChecked} onChange={(e) => setAckChecked(e.target.checked)} className="mt-1" />
                I understand and agree.
              </label>
              <button
                onClick={handleAcknowledge}
                disabled={!ackChecked}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Agree and continue
              </button>
            </div>
          ) : blocker ? (
            <div className="space-y-3">
              <div className="w-12 h-12 bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center">
                <Mail size={22} />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{blocker.text}</p>
              {blocker.href && (
                <Link href={blocker.href} className="inline-block px-4 py-2 text-sm font-medium bg-[color:var(--accent)] text-slate-900 rounded-lg hover:opacity-90">
                  {blocker.cta}
                </Link>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Campaign name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. October follow-up" className={inputCls} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sender name</label>
                  <input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Your business name" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Days between emails</label>
                  <Select value={gapDays} onChange={setGapDays} options={GAP_OPTIONS} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Business mailing address <span className="text-rose-500">*</span>
                </label>
                <input value={mailingAddress} onChange={(e) => setMailingAddress(e.target.value)} placeholder="Street, city, country" className={inputCls} />
                <p className="text-[11px] text-slate-500 dark:text-[#888] mt-1">Shown in every email&apos;s footer, along with an unsubscribe link. Anti-spam law requires both.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Consent source <span className="text-rose-500">*</span>
                </label>
                <Select value={consentSource} onChange={setConsentSource} options={CONSENT_OPTIONS} placeholder="How do these people know you?" />
                <p className="text-[11px] text-slate-500 dark:text-[#888] mt-1">Documents your lawful basis for contacting this audience.</p>
              </div>

              {mode === "leads" ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Your 4 emails</h3>
                    <p className="text-[11px] text-slate-500 dark:text-[#888]">
                      Ready to send as written. Use {"{{first_name}}"}, {"{{company}}"} and {"{{sender_name}}"} to personalize.
                    </p>
                  </div>
                  {template.map((t, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#020617]/50 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-[#888]">
                        Email {i + 1}{i === 0 ? " · sent right away" : ` · ${gapDays} days after the previous`}
                      </p>
                      <input
                        value={t.subject}
                        onChange={(e) => setTemplate(template.map((x, j) => (j === i ? { ...x, subject: e.target.value } : x)))}
                        className={inputCls}
                      />
                      <textarea
                        value={t.body}
                        rows={5}
                        onChange={(e) => setTemplate(template.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#020617]/50 text-sm text-slate-700 dark:text-slate-300">
                  Each person gets the 4 personalized emails MailCraft wrote for them. You can read and edit them on the Emails page before launching.
                </div>
              )}

              <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} className="mt-1" />
                I&apos;ve read these emails and they&apos;re accurate for my business.
              </label>
            </>
          )}
        </div>

        {!loading && !needsAck && !blocker && (
          <div className="p-5 border-t border-slate-200 dark:border-white/5 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#888] hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleLaunch}
              disabled={launching}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[color:var(--accent)] text-slate-900 rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              <CheckCircle2 size={16} />
              {launching ? "Launching..." : "Launch campaign"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

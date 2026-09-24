"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Users, Mail, Megaphone } from "lucide-react";
import { getSenderInfo, getCampaigns } from "@/lib/actions/email-actions";
import { getComplianceAcknowledgment } from "@/lib/actions/compliance-actions";
import { CURRENT_POLICY_VERSION } from "@/lib/policy-version";

type State = {
  enabled: boolean;
  mailboxConnected: boolean;
  policiesAccepted: boolean;
  activeCampaigns: number;
};

// FollowFlow has no "run" button on purpose: sequences are launched from the
// people you want to reach (Leads, Emails or Campaigns) and this automation is
// the switch that lets them send. The board shows what's ready and what isn't.
export default function FollowFlowBoard() {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getSenderInfo(), getComplianceAcknowledgment(), getCampaigns()])
      .then(([info, ack, camps]) => {
        if (cancelled) return;
        setState({
          enabled: info.followFlowEnabled,
          mailboxConnected: info.connectedProviders.length > 0,
          policiesAccepted: !!(ack.acknowledgedAt && ack.agreedVersion === CURRENT_POLICY_VERSION),
          activeCampaigns: camps.campaigns.filter((c) => c.status === "active").length,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ enabled: false, mailboxConnected: false, policiesAccepted: false, activeCampaigns: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const steps = [
    { done: state?.enabled, label: "Switch FollowFlow on", hint: "Use the toggle on the Automations page.", href: "/automations", cta: "Automations" },
    { done: state?.mailboxConnected, label: "Connect your email account", hint: "Google, Microsoft 365 or Zoho Mail. Emails send from your own mailbox, so replies come straight to you.", href: "/integrations", cta: "Integrations" },
    { done: state?.policiesAccepted, label: "Accept the outreach policies", hint: "A one-time agreement before your first campaign.", href: "/settings", cta: "Settings" },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Get ready to send</h2>
        <ul className="space-y-3">
          {steps.map((s) => (
            <li key={s.label} className="flex items-start gap-3">
              {state === null ? (
                <Circle size={18} className="text-slate-300 mt-0.5 shrink-0" />
              ) : s.done ? (
                <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <Circle size={18} className="text-slate-300 dark:text-slate-600 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{s.label}</p>
                <p className="text-xs text-slate-500 dark:text-[#888]">{s.hint}</p>
              </div>
              {state !== null && !s.done && (
                <Link href={s.href} className="text-xs font-medium text-[color:var(--accent)] hover:underline shrink-0">
                  {s.cta}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/leads" className="glass-card card-hover rounded-xl p-5 block">
          <Users size={20} className="text-[color:var(--accent)] mb-3" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">From your leads</p>
          <p className="text-xs text-slate-500 dark:text-[#888]">Select people on the Leads page and start their sequence.</p>
        </Link>
        <Link href="/emails" className="glass-card card-hover rounded-xl p-5 block">
          <Mail size={20} className="text-[color:var(--accent)] mb-3" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">From MailCraft drafts</p>
          <p className="text-xs text-slate-500 dark:text-[#888]">Review the personalized emails MailCraft wrote and send them.</p>
        </Link>
        <Link href="/campaigns" className="glass-card card-hover rounded-xl p-5 block">
          <Megaphone size={20} className="text-[color:var(--accent)] mb-3" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Track campaigns</p>
          <p className="text-xs text-slate-500 dark:text-[#888]">
            {state === null ? "Loading..." : `${state.activeCampaigns} running now. See who is still in a sequence, who replied and who opted out.`}
          </p>
        </Link>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">How it works</h2>
        <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
          <li>Email 1 goes out right away; emails 2, 3 and 4 follow a few days apart (you choose 2 to 5).</li>
          <li>Every email carries an unsubscribe link and your business address. Anyone who unsubscribes stops immediately, across all your campaigns.</li>
          <li>Mark someone as replied and the rest of their sequence stops.</li>
          <li>To keep your mailbox healthy, sending is capped per day, and your plan&apos;s monthly email limit applies.</li>
        </ol>
      </div>
    </div>
  );
}

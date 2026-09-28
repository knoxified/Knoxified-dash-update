"use client";

import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { PhoneForwarded, Plus, Trash2, Save } from "lucide-react";
import { getCallRouting, saveCallRouting, type RoutingRule } from "@/lib/actions/call-routing-actions";

type Draft = { label: string; keywords: string; action: "transfer" | "reply"; reply: string };

const toDraft = (r: RoutingRule): Draft => ({
  label: r.label || "",
  keywords: (r.keywords || []).join(", "),
  action: r.action,
  reply: r.reply || "",
});

const inputCls =
  "w-full rounded-lg bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition-colors";

export function CallRoutingEditor() {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<Draft[]>([]);
  const [businessPhone, setBusinessPhone] = useState("");

  useEffect(() => {
    getCallRouting().then((res) => {
      if ("error" in res && res.error) toast.error(`Could not load call routing: ${res.error}`);
      else if ("rules" in res) {
        setRules((res.rules || []).map(toDraft));
        setBusinessPhone(res.businessPhone || "");
      }
      setLoading(false);
    });
  }, []);

  const update = (i: number, patch: Partial<Draft>) =>
    setRules((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const handleSave = () => {
    startTransition(async () => {
      const payload = rules.map((r) => ({
        label: r.label,
        keywords: r.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        action: r.action,
        reply: r.action === "reply" ? r.reply : undefined,
      })) as RoutingRule[];
      const res = await saveCallRouting({ rules: payload, businessPhone });
      if ("error" in res && res.error) toast.error(res.error);
      else toast.success("Call routing saved");
    });
  };

  return (
    <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <PhoneForwarded size={16} className="text-sky-500" /> Call Routing
        </h2>
        <p className="text-sm text-slate-500 dark:text-[#888] mt-1">
          When a caller says one of your keywords, the agent either transfers them to your team or gives a fixed answer.
          Rules are checked in order, and they take priority over booking and the agent&apos;s normal replies.
        </p>
        <p className="text-xs text-slate-400 dark:text-white/30 mt-2">
          Live transfers currently work on Telnyx phone calls only. On other call types a transfer rule is skipped and the agent answers normally.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-[13px] font-medium text-slate-500 dark:text-[#888]">
          Transfer number (where transferred calls ring)
        </label>
        <input
          type="tel"
          value={businessPhone}
          onChange={(e) => setBusinessPhone(e.target.value)}
          placeholder="+12125551234"
          disabled={loading}
          className={inputCls + " max-w-xs"}
        />
        <p className="text-xs text-slate-400 dark:text-white/30">
          International format. This is the only number the agent can transfer to. Use a line your business owns.
        </p>
      </div>

      {rules.map((r, i) => (
        <div key={i} className="rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <input
              value={r.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Rule name, e.g. Billing questions"
              maxLength={60}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setRules((rs) => rs.filter((_, idx) => idx !== i))}
              className="text-slate-400 hover:text-rose-500 transition-colors shrink-0"
              aria-label="Remove rule"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-[#888] mb-1">
              When the caller says (comma-separated, up to 10)
            </label>
            <input
              value={r.keywords}
              onChange={(e) => update(i, { keywords: e.target.value })}
              placeholder="billing, invoice, payment"
              className={inputCls}
            />
          </div>
          <div className="flex gap-2">
            {(["transfer", "reply"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => update(i, { action: a })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
                  r.action === a
                    ? "bg-sky-600 text-white border-sky-600"
                    : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
                }`}
              >
                {a === "transfer" ? "Transfer the call" : "Say this instead"}
              </button>
            ))}
          </div>
          {r.action === "reply" && (
            <textarea
              value={r.reply}
              onChange={(e) => update(i, { reply: e.target.value })}
              placeholder="e.g. Our billing team is available by email at billing@yourbusiness.com."
              maxLength={300}
              rows={2}
              className={inputCls}
            />
          )}
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setRules((rs) => [...rs, { label: "", keywords: "", action: "transfer", reply: "" }])}
          disabled={rules.length >= 10 || loading}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
        >
          <Plus size={16} /> Add rule
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || loading}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 transition-colors"
        >
          <Save size={16} /> Save routing
        </button>
      </div>
    </div>
  );
}

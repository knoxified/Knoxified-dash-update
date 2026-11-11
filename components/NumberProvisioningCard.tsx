"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Lock, Phone, Check } from "lucide-react";
import {
  getNumberProvisioningState,
  searchAvailableNumbers,
  claimNumber,
  retryPausedPurchase,
} from "@/lib/actions/number-provisioning-actions";

type Country = { country_code: string; name: string; dial_code: string; number_mode: string };
type Found = { phone_number: string; friendly_name: string; region: string | null };

export function NumberProvisioningCard({
  onState,
}: {
  onState?: (s: { isPaid: boolean; hasProvisioned: boolean }) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [provisioned, setProvisioned] = useState<{ phone_number: string } | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [country, setCountry] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [found, setFound] = useState<Found[]>([]);
  const [picked, setPicked] = useState("");
  const [busy, startBusy] = useTransition();

  const load = async () => {
    const s = await getNumberProvisioningState();
    if ("error" in s) {
      setLoading(false);
      return;
    }
    const dedicated = (s.countries as Country[]).filter((c) => c.number_mode === "dedicated");
    setIsPaid(s.isPaid);
    setCountries(dedicated);
    setProvisioned(s.provisioned);
    setPreparing(s.preparing);
    setCountry((c) => c || dedicated[0]?.country_code || "");
    onState?.({ isPaid: s.isPaid, hasProvisioned: Boolean(s.provisioned) });
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = () =>
    startBusy(async () => {
      setFound([]);
      setPicked("");
      const r = await searchAvailableNumbers(country, areaCode);
      if (r.error) toast.error(r.error);
      else setFound(r.numbers || []);
    });

  const claim = () =>
    startBusy(async () => {
      const r = await claimNumber(country, picked);
      if (r.error) return void toast.error(r.error);
      if (r.preparing) {
        toast.message(r.message || "Your number is being prepared.");
      } else {
        toast.success("Your number is ready.");
      }
      setFound([]);
      await load();
    });

  const recheck = () =>
    startBusy(async () => {
      const r = await retryPausedPurchase();
      if (r.success) toast.success("Your number is ready.");
      else if (r.stillPreparing) toast.message("Still being prepared. Check back soon.");
      else if (r.error) toast.error(r.error);
      await load();
    });

  const box = "bg-sky-50 dark:bg-sky-500/5 border border-sky-100 dark:border-sky-500/10 rounded-lg p-4";

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 size={18} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (provisioned) {
    return (
      <div className={box}>
        <p className="text-xs font-medium text-slate-500 dark:text-[#888] uppercase tracking-wider mb-1">Your Knoxified number</p>
        <p className="text-lg font-semibold text-slate-900 dark:text-white font-mono flex items-center gap-2">
          {provisioned.phone_number}
          <Check size={16} className="text-emerald-500" />
        </p>
        <p className="text-xs text-slate-500 dark:text-[#888] mt-3">
          Give this number out directly, or forward your business line to it so the agent answers when you can't.
        </p>
        <p className="text-xs text-slate-400 dark:text-[#666] mt-2">
          Forward when unanswered: on most mobile carriers dial <span className="font-mono">**61*{provisioned.phone_number}#</span>.
          Forward when busy: <span className="font-mono">**67*{provisioned.phone_number}#</span>. To turn off: <span className="font-mono">##61#</span>.
          Landlines and office phone systems have a "forward on no answer" setting. Steps vary by carrier.
        </p>
      </div>
    );
  }

  if (!isPaid) {
    return (
      <div className={box}>
        <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Lock size={15} /> Get your own Knoxified number
        </p>
        <p className="text-sm text-slate-500 dark:text-[#888] mt-2">
          Paid plans include a dedicated phone number your agent answers. Upgrade to choose yours.
        </p>
        <Link href="/billing" className="inline-block mt-3 text-sm font-medium text-sky-600 dark:text-sky-400 hover:underline">
          View plans
        </Link>
      </div>
    );
  }

  if (preparing) {
    return (
      <div className={box}>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Your number is being prepared</p>
        <p className="text-sm text-slate-500 dark:text-[#888] mt-2">It will be ready shortly. You don't need to do anything.</p>
        <button
          type="button"
          onClick={recheck}
          disabled={busy}
          className="mt-3 text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg disabled:opacity-50"
        >
          {busy ? "Checking…" : "Check again"}
        </button>
      </div>
    );
  }

  const needsArea = country === "US" || country === "CA";

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
        <Phone size={15} /> Get your Knoxified number
      </p>
      <div className="flex gap-3 flex-wrap">
        <select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setFound([]);
          }}
          className="bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2.5"
        >
          {countries.map((c) => (
            <option key={c.country_code} value={c.country_code}>
              {c.name} ({c.dial_code})
            </option>
          ))}
        </select>
        {needsArea && (
          <input
            value={areaCode}
            onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="Area code (optional)"
            className="w-44 bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2.5"
          />
        )}
        <button
          type="button"
          onClick={search}
          disabled={busy || !country}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {busy && found.length === 0 ? "Searching…" : "Find numbers"}
        </button>
      </div>

      {found.length > 0 && (
        <div className="space-y-2">
          {found.map((n) => (
            <label
              key={n.phone_number}
              className={`flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer text-sm font-mono ${
                picked === n.phone_number
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10"
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#020617]"
              } text-slate-800 dark:text-slate-200`}
            >
              <span>
                {n.friendly_name}
                {n.region ? <span className="font-sans text-xs text-slate-400 ml-2">{n.region}</span> : null}
              </span>
              <input type="radio" name="num" checked={picked === n.phone_number} onChange={() => setPicked(n.phone_number)} />
            </label>
          ))}
          <button
            type="button"
            onClick={claim}
            disabled={busy || !picked}
            className="bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {busy ? "Setting up…" : "Get this number"}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { X, Zap } from "lucide-react";
import { getDiscountOfferStatus, getFoundingRatePlan } from "@/lib/actions/discount-actions";

function formatCountdown(ms: number) {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function DiscountOfferBanner() {
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [showModal, setShowModal] = useState(false);
  const [dismissedModal, setDismissedModal] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    getDiscountOfferStatus().then((status) => {
      if (status.active && status.expiresAt) {
        setExpiresAt(status.expiresAt);
        setShowModal(true); // first load with an active offer this session
      }
    });
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const startCheckout = useCallback(() => {
    setIsCheckingOut(true);
    const checkoutTab = window.open("", "_blank");
    if (checkoutTab) checkoutTab.opener = null;

    getFoundingRatePlan().then(async (plan) => {
      if (!plan) {
        toast.error("This offer isn't available right now.");
        setIsCheckingOut(false);
        checkoutTab?.close();
        return;
      }
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: plan.id }),
        });
        const data = await res.json();
        setIsCheckingOut(false);
        if (!res.ok || !data.url) {
          toast.error(data.error || "Couldn't start checkout. Please try again.");
          checkoutTab?.close();
          return;
        }
        if (checkoutTab && !checkoutTab.closed) {
          checkoutTab.location.href = data.url;
        } else {
          window.location.href = data.url;
        }
      } catch {
        setIsCheckingOut(false);
        toast.error("Couldn't reach checkout. Please try again.");
        checkoutTab?.close();
      }
    });
  }, []);

  if (!expiresAt) return null;

  const remainingMs = new Date(expiresAt).getTime() - now;
  if (remainingMs <= 0) return null; // expired mid-session -- just disappears, no dead countdown

  const countdown = formatCountdown(remainingMs);

  return (
    <>
      <AnimatePresence>
        {showModal && !dismissedModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-[#0F172A] rounded-2xl w-full max-w-md p-8 relative shadow-2xl shadow-black/40 border border-orange-500/20"
            >
              <button
                onClick={() => setDismissedModal(true)}
                className="absolute top-4 right-4 text-slate-400 dark:text-[#666] hover:text-slate-700 dark:hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="w-14 h-14 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mb-5 shadow-[0_0_18px_rgba(249,115,22,0.3)]">
                <Zap size={26} />
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                Your Pro rate is ready
              </h2>
              <p className="text-[14px] text-slate-500 dark:text-[#888] leading-relaxed mb-5">
                For a limited time, get Pro at a reduced rate. After the next 48 hours, this offer is gone for good.
              </p>

              <div className="flex items-end gap-3 mb-6">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">$397</span>
                <span className="text-lg text-slate-400 dark:text-[#666] line-through mb-1">$697</span>
                <span className="text-[13px] text-emerald-600 dark:text-emerald-400 font-semibold mb-1.5">Save $300/mo</span>
              </div>

              <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-lg px-4 py-3 mb-6">
                <span className="text-[13px] text-orange-700 dark:text-orange-400 font-medium">Offer ends in</span>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400 tabular-nums">{countdown}</span>
              </div>

              <button
                onClick={startCheckout}
                disabled={isCheckingOut}
                className="w-full bg-orange-500 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-all shadow-[0_0_20px_rgba(249,115,22,0.35)] disabled:opacity-50"
              >
                {isCheckingOut ? "Starting checkout..." : "Lock in my rate"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {(!showModal || dismissedModal) && (
        <div className="bg-orange-500 px-5 md:px-8 py-2 flex items-center justify-center gap-3 text-center flex-wrap">
          <p className="text-[13px] text-white font-medium">
            Pro's reduced rate ($397/mo, was $697) expires in{" "}
            <span className="font-bold tabular-nums">{countdown}</span>
          </p>
          <button
            onClick={startCheckout}
            disabled={isCheckingOut}
            className="text-[12px] font-bold bg-white text-orange-600 px-3 py-1 rounded-md hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isCheckingOut ? "Starting..." : "Lock it in"}
          </button>
        </div>
      )}
    </>
  );
}

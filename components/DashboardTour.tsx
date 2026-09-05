"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { getTourStatus, completeDashboardTour } from "@/lib/actions/onboarding-tour-actions";

interface Step {
  tourId: string; // matches data-tour on the Sidebar nav item
  href: string;
  title: string;
  body: string;
}

// Order matters -- each step spotlights exactly one sidebar item and
// navigates to its real page, so the person sees both the nav link and
// the actual page at once instead of a generic popup floating on top.
const STEPS: Step[] = [
  { tourId: "overview", href: "/", title: "Overview", body: "Your at-a-glance dashboard -- usage, active systems, and recent activity." },
  { tourId: "systems", href: "/systems", title: "Systems", body: "Activate the industry systems that match your business. Each one teaches your voice agent that industry's language and priorities." },
  { tourId: "agent-config", href: "/agent-config", title: "Agent Config", body: "Set your agent's voice, greeting, and business memory -- what it knows about your business." },
  { tourId: "automations", href: "/automations", title: "Automations", body: "Workflows that run alongside your voice agent -- follow-ups and reminders, without you lifting a finger." },
  { tourId: "leads", href: "/leads", title: "Leads", body: "Every lead your agent captures lands here, ready to follow up on." },
  { tourId: "campaigns", href: "/campaigns", title: "Campaigns", body: "Track outreach and follow-up campaigns tied to your leads." },
  { tourId: "conversations", href: "/conversations", title: "Inbox", body: "Full call transcripts from every conversation your agent has." },
  { tourId: "billing", href: "/billing", title: "Billing", body: "Manage your plan and usage any time." },
  { tourId: "settings", href: "/settings", title: "Settings", body: "Account, theme, and accent color live here. That's the full tour -- you're set." },
];

interface Rect { top: number; left: number; width: number; height: number; }

export function DashboardTour() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    getTourStatus().then(({ completed }) => {
      if (!completed) setActive(true);
    });
  }, []);

  const measure = useCallback(() => {
    const step = STEPS[stepIndex];
    const el = document.querySelector(`[data-tour="${step.tourId}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    } else {
      setRect(null);
    }
  }, [stepIndex]);

  useEffect(() => {
    if (!active) return;
    router.push(STEPS[stepIndex].href);
    // Sidebar is already mounted (layout persists across route changes) so
    // the target element exists immediately -- but give the route change a
    // tick to settle/re-render before measuring.
    const t = setTimeout(measure, 60);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, active]);

  const finish = () => {
    setActive(false);
    completeDashboardTour();
  };

  if (!active) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  // Tooltip position: to the right of the sidebar item, clamped so it never
  // runs off the bottom of the viewport.
  const tooltipTop = rect ? Math.min(rect.top, window.innerHeight - 220) : 100;
  const tooltipLeft = rect ? rect.left + rect.width + 24 : 280;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]">
        {/* Click-blocking scrim -- forces attention to the highlighted item
            instead of letting the rest of the dashboard be interacted with */}
        <div className="absolute inset-0" style={{ pointerEvents: "auto" }} onClick={(e) => e.preventDefault()} />

        {/* Spotlight: a box positioned exactly over the target nav item,
            using a huge box-shadow to darken everything else -- the
            standard CSS spotlight trick, no clip-path math needed */}
        {rect && (
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="absolute rounded-xl pointer-events-none"
            style={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
            }}
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{ boxShadow: "0 0 0 9999px rgba(2,6,23,0.78), 0 0 20px var(--accent-glow)", border: "2px solid var(--accent)" }}
            />
          </motion.div>
        )}
        {!rect && <div className="absolute inset-0 bg-slate-900/78" />}

        {/* Tooltip callout */}
        <motion.div
          key={"tooltip-" + stepIndex}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="absolute glass-card rounded-xl p-5 w-72 shadow-2xl shadow-black/40 pointer-events-auto"
          style={{ top: tooltipTop, left: Math.min(tooltipLeft, (typeof window !== "undefined" ? window.innerWidth : 1200) - 300) }}
        >
          <button
            onClick={finish}
            className="absolute top-3 right-3 text-slate-400 dark:text-[#666] hover:text-slate-700 dark:hover:text-white transition-colors"
            aria-label="Skip tour"
          >
            <X size={16} />
          </button>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--accent)] mb-1">
            {stepIndex + 1} / {STEPS.length}
          </p>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{step.title}</h3>
          <p className="text-[13px] text-slate-500 dark:text-[#888] leading-relaxed mb-4">{step.body}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === stepIndex ? "w-4 bg-[color:var(--accent)]" : "w-1.5 bg-slate-200 dark:bg-white/10"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => (isLast ? finish() : setStepIndex((i) => i + 1))}
              className="flex items-center gap-1.5 bg-[color:var(--accent)] text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-all shadow-[0_0_12px_rgba(0,229,255,0.3)]"
            >
              {isLast ? "Done" : "Next"}
              {!isLast && <ArrowRight size={13} />}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

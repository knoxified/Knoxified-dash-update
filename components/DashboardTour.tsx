"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Server, Zap, Settings, Users, CreditCard, X, ArrowRight, ArrowLeft } from "lucide-react";
import { getTourStatus, completeDashboardTour } from "@/lib/actions/onboarding-tour-actions";

interface Step {
  icon: React.ElementType;
  title: string;
  body: string;
  href?: string;
  cta?: string;
}

const STEPS: Step[] = [
  {
    icon: LayoutDashboard,
    title: "Welcome to Knoxified",
    body: "This is your command center for everything your AI voice agent does. Quick tour of the main sections -- takes about 30 seconds.",
  },
  {
    icon: Server,
    title: "Systems",
    body: "Activate the industry systems that match your business -- plumbing, dental, real estate, and more. Each one teaches your voice agent that industry's language and priorities.",
    href: "/systems",
    cta: "View Systems",
  },
  {
    icon: Settings,
    title: "Agent Config",
    body: "Set your agent's voice, greeting, and business memory here -- what it knows about your business, written by you or pulled from your website.",
    href: "/agent-config",
    cta: "Open Agent Config",
  },
  {
    icon: Zap,
    title: "Automations",
    body: "Automated workflows that run alongside your voice agent -- follow-ups, reminders, and more, without you lifting a finger.",
    href: "/automations",
    cta: "View Automations",
  },
  {
    icon: Users,
    title: "Leads, Campaigns & Inbox",
    body: "Every caller and lead lands here. Inbox holds full call transcripts; Leads and Campaigns help you track and follow up.",
    href: "/leads",
    cta: "View Leads",
  },
  {
    icon: CreditCard,
    title: "Billing & Settings",
    body: "Manage your plan, connected integrations, and compliance settings any time from the sidebar. That's the full tour -- you're set.",
  },
];

export function DashboardTour() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    getTourStatus().then(({ completed }) => {
      if (!completed) setVisible(true);
    });
  }, []);

  const finish = () => {
    setVisible(false);
    completeDashboardTour();
  };

  if (!visible) return null;

  const step = STEPS[stepIndex];
  const Icon = step.icon;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="glass-card rounded-2xl w-full max-w-md p-8 relative shadow-2xl shadow-black/40"
        >
          <button
            onClick={finish}
            className="absolute top-4 right-4 text-slate-400 dark:text-[#666] hover:text-slate-700 dark:hover:text-white transition-colors"
            aria-label="Skip tour"
          >
            <X size={18} />
          </button>

          <div className="w-14 h-14 rounded-full bg-[color:var(--accent)]/10 text-[color:var(--accent)] flex items-center justify-center mb-6 shadow-[0_0_18px_rgba(0,229,255,0.3)]">
            <Icon size={26} />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">{step.title}</h2>
          <p className="text-[14px] text-slate-500 dark:text-[#888] leading-relaxed mb-8">{step.body}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === stepIndex ? "w-5 bg-[color:var(--accent)]" : "w-1.5 bg-slate-200 dark:bg-white/10"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <button
                  onClick={() => setStepIndex((i) => i - 1)}
                  className="text-slate-400 dark:text-[#666] hover:text-slate-700 dark:hover:text-white transition-colors p-2"
                  aria-label="Previous"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              {step.href && (
                <button
                  onClick={() => {
                    router.push(step.href!);
                    if (isLast) finish();
                    else setStepIndex((i) => i + 1);
                  }}
                  className="text-[13px] font-medium text-[color:var(--accent)] hover:opacity-80 transition-opacity px-2"
                >
                  {step.cta}
                </button>
              )}
              <button
                onClick={() => (isLast ? finish() : setStepIndex((i) => i + 1))}
                className="flex items-center gap-1.5 bg-[color:var(--accent)] text-slate-900 text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)]"
              >
                {isLast ? "Done" : "Next"}
                {!isLast && <ArrowRight size={14} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

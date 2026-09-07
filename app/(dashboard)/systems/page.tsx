"use client";

import { Select } from "@/components/ui/Select";
import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Cpu, Play, Home, Building, HeartPulse, Users, Shield, Truck, ShoppingCart, Video, Scale, Hammer, Sun, ShoppingBag, Stethoscope, Briefcase, Droplet, Thermometer, Utensils, Dumbbell, Car, RefreshCcw, ArrowRight, Search } from "lucide-react";
import { useSystems } from "@/lib/services/hooks";
import { toggleSystemActivation } from "@/lib/actions/dashboard-actions";
import { useRouter } from "next/navigation";

const getIcon = (name?: string) => {
  switch (name) {
    case "Home": return <Home size={20} />;
    case "Building": return <Building size={20} />;
    case "HeartPulse": return <HeartPulse size={20} />;
    case "Users": return <Users size={20} />;
    case "Shield": return <Shield size={20} />;
    case "Truck": return <Truck size={20} />;
    case "ShoppingCart": return <ShoppingCart size={20} />;
    case "Video": return <Video size={20} />;
    case "Scale": return <Scale size={20} />;
    case "Hammer": return <Hammer size={20} />;
    case "Sun": return <Sun size={20} />;
    case "ShoppingBag": return <ShoppingBag size={20} />;
    case "Stethoscope": return <Stethoscope size={20} />;
    case "Briefcase": return <Briefcase size={20} />;
    case "Droplet": return <Droplet size={20} />;
    case "Thermometer": return <Thermometer size={20} />;
    case "Utensils": return <Utensils size={20} />;
    case "Dumbbell": return <Dumbbell size={20} />;
    case "Car": return <Car size={20} />;
    default: return <Cpu size={20} />;
  }
};

const TIER_LABELS: Record<string, string> = { pro: "Pro Tier", enterprise: "Enterprise Tier", custom: "Custom" };

// Color psychology, matching the marketing site: cyan reads as trust/tech
// (Pro, the everyday workhorse tier), indigo/violet reads as premium and
// sophisticated (Enterprise, the bigger commitment), amber reads as
// exclusive/high-value (Custom, the bespoke tier). One flat hue for every
// system regardless of tier is what made this page feel monotone.
const TIER_THEME: Record<string, {
  activeBg: string; activeBorder: string; activeShadow: string; hoverBorder: string; hoverShadow: string;
  glowBg: string; iconBg: string; iconText: string; iconHoverBg: string; iconHoverShadow: string;
  badgeBg: string; badgeText: string; badgeBorder: string; buttonBg: string; buttonShadow: string; linkText: string;
}> = {
  pro: {
    activeBg: "bg-gradient-to-br from-white to-sky-50 dark:from-[#0F172A] dark:via-[#0F172A] dark:to-cyan-950/30",
    activeBorder: "border-sky-200 dark:border-[color:var(--accent)]/30",
    activeShadow: "shadow-[0_0_25px_rgba(0,229,255,0.08)]",
    hoverBorder: "hover:border-sky-400 dark:hover:border-[color:var(--accent)]/60",
    hoverShadow: "hover:shadow-[0_0_35px_rgba(0,229,255,0.18)]",
    glowBg: "bg-[color:var(--accent)]/10",
    iconBg: "bg-[color:var(--accent)]/10 text-[color:var(--accent)]",
    iconText: "text-[color:var(--accent)]",
    iconHoverBg: "group-hover:bg-[color:var(--accent)] group-hover:text-slate-900",
    iconHoverShadow: "group-hover:shadow-[0_0_18px_rgba(0,229,255,0.5)]",
    badgeBg: "bg-sky-100 dark:bg-[color:var(--accent)]/10", badgeText: "text-sky-700 dark:text-[color:var(--accent)]", badgeBorder: "border-sky-300 dark:border-[color:var(--accent)]/20",
    buttonBg: "bg-[color:var(--accent)] text-slate-900", buttonShadow: "shadow-[0_0_15px_rgba(0,229,255,0.3)]",
    linkText: "text-[color:var(--accent)]",
  },
  enterprise: {
    activeBg: "bg-gradient-to-br from-white to-indigo-50 dark:from-[#0F172A] dark:via-[#0F172A] dark:to-indigo-950/40",
    activeBorder: "border-indigo-200 dark:border-indigo-500/30",
    activeShadow: "shadow-[0_0_25px_rgba(99,102,241,0.1)]",
    hoverBorder: "hover:border-indigo-400 dark:hover:border-indigo-400/60",
    hoverShadow: "hover:shadow-[0_0_35px_rgba(99,102,241,0.22)]",
    glowBg: "bg-indigo-500/10",
    iconBg: "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400",
    iconText: "text-indigo-500 dark:text-indigo-400",
    iconHoverBg: "group-hover:bg-indigo-500 group-hover:text-white",
    iconHoverShadow: "group-hover:shadow-[0_0_18px_rgba(99,102,241,0.5)]",
    badgeBg: "bg-indigo-100 dark:bg-indigo-500/10", badgeText: "text-indigo-700 dark:text-indigo-300", badgeBorder: "border-indigo-300 dark:border-indigo-500/30",
    buttonBg: "bg-indigo-500 text-white", buttonShadow: "shadow-[0_0_15px_rgba(99,102,241,0.35)]",
    linkText: "text-indigo-500 dark:text-indigo-400",
  },
  custom: {
    activeBg: "bg-gradient-to-br from-white to-amber-50 dark:from-slate-900 dark:to-amber-950/20",
    activeBorder: "border-amber-300 dark:border-amber-500/40",
    activeShadow: "shadow-[0_0_25px_rgba(245,158,11,0.12)]",
    hoverBorder: "hover:border-amber-400 dark:hover:border-amber-400/70",
    hoverShadow: "hover:shadow-[0_0_35px_rgba(245,158,11,0.28)]",
    glowBg: "bg-amber-500/10",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    iconText: "text-amber-600 dark:text-amber-400",
    iconHoverBg: "group-hover:bg-amber-500 group-hover:text-slate-900",
    iconHoverShadow: "group-hover:shadow-[0_0_18px_rgba(245,158,11,0.5)]",
    badgeBg: "bg-amber-100 dark:bg-amber-500/10", badgeText: "text-amber-700 dark:text-amber-400", badgeBorder: "border-amber-300 dark:border-amber-500/30",
    buttonBg: "bg-amber-500 text-slate-900", buttonShadow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
    linkText: "text-amber-600 dark:text-amber-400",
  },
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

export default function SystemsPage() {
  const { data: systems, loading, setData } = useSystems();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sortBy, setSortBy] = useState<"tier" | "name" | "active">("tier");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  if (loading) {
    return <div className="animate-pulse glass-card rounded-xl h-64 w-full"></div>;
  }

  const handleToggle = (e: React.MouseEvent, id: string, currentlyEnabled: boolean) => {
    e.stopPropagation();
    setPendingId(id);
    startTransition(async () => {
      const result = await toggleSystemActivation(id, !currentlyEnabled);
      setPendingId(null);
      if (result?.error === "locked") {
        toast.error("This account is locked to browsing only. Upgrade to a paid plan to activate systems.");
        return;
      }
      if (result?.error) {
        toast.error("Couldn't update that system: " + result.error);
        return;
      }
      setData((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, isEnabled: !currentlyEnabled, activatedAt: !currentlyEnabled ? new Date().toISOString() : null }
            : s
        )
      );
    });
  };

  const filteredSystems = systems.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const tierOrder: Record<string, number> = { pro: 0, enterprise: 1, custom: 2 };
  const sortedSystems = [...filteredSystems].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "active": {
        const aActive = a.isEnabled ? 1 : 0;
        const bActive = b.isEnabled ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;
        return a.name.localeCompare(b.name);
      }
      case "tier":
      default:
        return (tierOrder[a.tier] ?? 9) - (tierOrder[b.tier] ?? 9);
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
            Systems Portfolio
          </h1>
          <p className="text-slate-500 dark:text-[#888] text-sm">
            Activate the industry systems that match your business. Each one gives your voice agent industry-specific knowledge and tone.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search systems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 text-sm text-slate-900 dark:text-white rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-[color:var(--accent)] transition-colors shadow-sm placeholder:text-slate-400 dark:placeholder:text-[#666]"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto z-10">
            <span className="text-slate-500 dark:text-[#888] text-xs font-medium whitespace-nowrap">Sort by:</span>
            <div className="w-40">
              <Select
                value={sortBy}
                onChange={(val) => setSortBy(val as "tier" | "name" | "active")}
                options={[
                  { value: "tier", label: "Tier" },
                  { value: "name", label: "Name (A-Z)" },
                  { value: "active", label: "Active First" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedSystems.map((sys, idx) => {
          const isActive = sys.isEnabled;
          const isRowPending = isPending && pendingId === sys.id;
          const isCustom = sys.tier === "custom";
          const theme = TIER_THEME[sys.tier] || TIER_THEME.pro;

          return (
            <motion.div
              key={sys.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: (idx % 6) * 0.06 }}
              onClick={() => router.push(`/systems/${sys.id}`)}
              className={`relative overflow-hidden rounded-2xl p-8 flex flex-col group backdrop-blur-md border transition-all duration-300 cursor-pointer transform-gpu hover:-translate-y-1 ${
                isActive
                  ? `${theme.activeBg} ${theme.activeBorder} ${theme.activeShadow} ${theme.hoverBorder} ${theme.hoverShadow}`
                  : "bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
              }`}
            >
              {isActive && (
                <div className={`absolute top-0 right-0 w-64 h-64 ${theme.glowBg} rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity duration-500 opacity-60 group-hover:opacity-100`}></div>
              )}
              <div className="flex items-start justify-between mb-5 relative z-10">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? `${theme.iconBg} ${theme.iconHoverBg} ${theme.iconHoverShadow}`
                        : "bg-slate-100 dark:bg-[#020617] text-slate-400 dark:text-[#666] border border-slate-200 dark:border-white/5"
                    }`}
                  >
                    {getIcon(sys.iconName)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{sys.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                      >
                        {TIER_LABELS[sys.tier] || sys.tier}
                      </span>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[12px] font-medium text-emerald-600 dark:text-[#10B981]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.7)]"></span>
                          Active{sys.activatedAt ? ` since ${timeAgo(sys.activatedAt)}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-slate-500 dark:text-[#888] text-[14px] mb-6 flex-1 leading-relaxed">
                {sys.description}
              </p>

              <div className="flex items-center justify-between pt-5 border-t border-slate-200 dark:border-white/5">
                {isCustom ? (
                  <a
                    href="mailto:hello@knoxified.org?subject=Custom%20Agent%20System"
                    onClick={(e) => e.stopPropagation()}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md ${theme.buttonBg} hover:opacity-90 transition-all ${theme.buttonShadow}`}
                  >
                    Talk to Us
                  </a>
                ) : sys.tier === "pro" ? (
                  // Pro-tier "active" is derived from its automations (see
                  // the system detail page) -- no direct toggle here.
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md border ${
                      isActive
                        ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20"
                        : `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`
                    }`}
                  >
                    {isActive ? "All automations active" : "Manage automations \u2192"}
                  </span>
                ) : (
                  <button
                    onClick={(e) => handleToggle(e, sys.id, isActive)}
                    disabled={isRowPending}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md transition-all ${
                      isActive
                        ? "bg-transparent text-red-500 dark:text-[#EF4444] hover:bg-red-100 dark:bg-[#EF4444]/10 border border-[#EF4444]"
                        : isRowPending
                        ? "bg-amber-100 dark:bg-[#F59E0B]/10 text-amber-500 dark:text-[#F59E0B] border border-[#F59E0B]/20 opacity-80 cursor-not-allowed"
                        : `${theme.buttonBg} hover:opacity-90 ${theme.buttonShadow} border border-transparent`
                    }`}
                  >
                    {isActive ? (
                      <>Deactivate System</>
                    ) : isRowPending ? (
                      <>
                        <RefreshCcw size={14} className="animate-spin" /> Activating...
                      </>
                    ) : (
                      <>
                        <Play size={14} /> Activate System
                      </>
                    )}
                  </button>
                )}
                <div className={`flex items-center gap-1 text-[13px] ${theme.linkText} font-medium opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Learn more <ArrowRight size={14} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

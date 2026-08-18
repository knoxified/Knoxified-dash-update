"use client";

import { Bell, Search, Plus, Wifi } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/services/hooks";

export function Header() {
  const { data: workspace, loading: workspaceLoading } = useWorkspace();

  const planName = workspace?.plan?.name || "—";
  const creditsUsed = workspace?.workspace?.usage?.credits ?? 0;
  const creditsLimit = workspace?.plan?.limit_credits;
  const isUnlimited = creditsLimit === 0;
  const creditsRemaining = creditsLimit && creditsLimit > 0 ? Math.max(creditsLimit - creditsUsed, 0) : null;

  return (
    <header className="hidden md:flex h-[60px] items-center px-6 border-b border-slate-200/60 dark:border-white/[0.04] sticky top-0 z-30 transition-all"
      style={{ background: 'light-dark(rgba(255,255,255,0.85), rgba(6,13,25,0.85))', backdropFilter: 'blur(24px) saturate(180%)' }}
    >
      {/* Left: Systems online indicator */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.8)' }}></span>
          </span>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide">All Systems Online</span>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Search */}
        <button 
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'k', 'metaKey': true}))} 
          className="flex items-center gap-2.5 text-xs text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-all bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200/60 dark:hover:bg-white/[0.07] px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300/80 dark:hover:border-white/10 group"
        >
          <Search size={13} className="group-hover:text-slate-500 dark:group-hover:text-white/50 transition-colors" style={{ color: 'var(--accent)' }} />
          <span className="font-medium hidden lg:inline-block pr-2">Quick search...</span>
          <kbd className="hidden lg:inline-block font-mono text-[9px] font-bold bg-white dark:bg-black/40 px-1.5 py-0.5 rounded-md text-slate-400 dark:text-white/20 border border-slate-200 dark:border-white/10">⌘K</kbd>
        </button>

        {/* Divider */}
        <div className="h-4 w-[1px] bg-slate-200/80 dark:bg-white/[0.06] mx-1" />

        {/* Plan badge */}
        {!workspaceLoading && (
          <Link
            href="/billing"
            className="flex items-center gap-2 text-[11px] font-semibold bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200/60 dark:hover:bg-white/[0.07] px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/10 transition-all"
          >
            <span className="font-bold" style={{ color: 'var(--accent)' }}>{planName}</span>
            <span className="text-slate-300 dark:text-white/15">·</span>
            <span className="text-slate-500 dark:text-white/35">
              {isUnlimited
                ? "Unlimited"
                : creditsRemaining !== null
                ? `${creditsRemaining.toLocaleString()} left`
                : `${creditsUsed.toLocaleString()} used`}
            </span>
          </Link>
        )}

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/70 transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-xl group">
          <Bell size={16} className="group-hover:drop-shadow-sm transition-all" />
          <span 
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full border border-white dark:border-[#060d19]"
            style={{ background: '#f43f5e', boxShadow: '0 0 6px rgba(244,63,94,0.7)' }}
          />
        </button>

        {/* Create new */}
        <button 
          onClick={() => toast.info('New entity creation menu opened.')} 
          className="relative flex items-center justify-center w-8 h-8 rounded-xl text-white transition-all duration-200 hover:scale-105 active:scale-95 group overflow-hidden"
          style={{ 
            background: 'var(--accent)', 
            boxShadow: '0 0 16px var(--accent-glow)' 
          }}
        >
          <span className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-all duration-200" />
          <Plus size={15} className="relative z-10 text-slate-900" strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}

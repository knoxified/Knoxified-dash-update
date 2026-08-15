"use client";

import { Bell, Search, Plus } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "sonner";

export function Header() {
  return (
    <header className="hidden md:flex h-16 items-center px-8 border-b border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-[#020617]/40 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex-1"></div>
      <div className="flex items-center gap-4">
        <button onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'k', 'metaKey': true}))} className="flex items-center gap-2 text-sm text-slate-500 dark:text-[#888] hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-white/5 group">
          <Search size={14} className="text-slate-400 group-hover:text-sky-500 transition-colors" />
          <span className="pr-2">Quick Search...</span>
          <kbd className="hidden lg:inline-block font-mono text-[10px] font-semibold bg-white dark:bg-[#020617] px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-white/10 text-slate-400">⌘K</kbd>
        </button>
        <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-1"></div>
        <button className="relative p-2 text-slate-500 dark:text-[#888] hover:text-slate-900 dark:hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 group hover:bg-slate-100 dark:hover:bg-white/5 rounded-full">
          <Bell size={18} className="group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] transition-all" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 dark:bg-[#FF2E93] border-2 border-white dark:border-[#020617] shadow-[0_0_8px_rgba(255,46,147,0.6)]"></span>
        </button>
        <button onClick={() => toast.info('New entity creation menu opened.')} className="relative flex items-center justify-center p-2 rounded-full bg-slate-900 dark:bg-[#00E5FF] text-white dark:text-slate-900 hover:opacity-90 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,229,255,0.4)] group overflow-hidden">
          <span className="absolute inset-0 bg-white/20 dark:bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
          <Plus size={16} className="relative z-10" />
        </button>
      </div>
    </header>
  );
}

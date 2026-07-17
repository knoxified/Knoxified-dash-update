"use client";

import { Bell, Search, Plus } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "sonner";

export function Header() {
  return (
    <header className="hidden md:flex h-16 items-center px-8 border-b border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-[#020617]/40 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex-1"></div>
      <div className="flex items-center gap-4">
        <button onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'k', 'metaKey': true}))} className="flex items-center gap-2 text-sm text-slate-500 dark:text-[#888] hover:text-slate-900 dark:hover:text-white transition-colors">
          <Search size={16} />
          <span>Search...</span>
          <kbd className="hidden lg:inline-block font-mono text-[10px] font-semibold bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">⌘K</kbd>
        </button>
        <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10"></div>
        <button className="relative p-2 text-slate-500 dark:text-[#888] hover:text-slate-900 dark:hover:text-white transition-transform active:scale-95 group">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 dark:bg-[#EF4444] border-2 border-white dark:border-[#020617]"></span>
        </button>
        <button onClick={() => toast.info('New entity creation menu opened.')} className="flex items-center justify-center p-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-transform active:scale-95 shadow-sm">
          <Plus size={16} />
        </button>
      </div>
    </header>
  );
}

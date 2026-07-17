"use client";

import { useEffect, useState } from "react";
import { Search, Monitor, Zap, Phone, Mail, Settings, Activity, ArrowRight, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  const links = [
    { name: "Overview", href: "/", icon: Activity },
    { name: "Systems Portfolio", href: "/systems", icon: Monitor },
    { name: "Automation Flows", href: "/automations", icon: Zap },
    { name: "Global Metrics", href: "/metrics", icon: Activity },
    { name: "Phone Agents", href: "/campaigns", icon: Phone },
    { name: "Email Sequences", href: "/campaigns", icon: Mail },
    { name: "Knowledge Base", href: "/knowledge", icon: BookOpen },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Integrations & APIs", href: "/integrations", icon: Settings },
  ];

  const filtered = links.filter(link => link.name.toLowerCase().includes(search.toLowerCase()));

  const handleNavigate = (href: string) => {
    router.push(href);
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/50 dark:bg-[#020617]/80 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={() => setOpen(false)}
      />
      <div className="fixed left-1/2 top-[15%] -translate-x-1/2 w-full max-w-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-white/5">
          <Search className="w-5 h-5 text-slate-400 dark:text-[#888] mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Search commands, navigate... (Esc to close)"
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#666]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-center text-slate-500 dark:text-[#888]">No results found.</p>
          ) : (
            <div className="space-y-1">
              <p className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-[#666] uppercase tracking-wider">Navigation</p>
              {filtered.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavigate(link.href)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-[#888] group-hover:text-sky-600 dark:group-hover:text-[#00E5FF] transition-colors">
                      <link.icon size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-[#EDEDED] group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{link.name}</span>
                  </div>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-sky-600 dark:text-[#00E5FF]" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#020617]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-[#888]">Navigate with</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-white/10 text-[10px] text-slate-600 dark:text-[#888] font-mono border border-slate-300 dark:border-white/5">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-white/10 text-[10px] text-slate-600 dark:text-[#888] font-mono border border-slate-300 dark:border-white/5">↓</kbd>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-[#666]">Press Enter to select</span>
        </div>
      </div>
    </>
  );
}

"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-full rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />;
  }

  const options = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  return (
    <div className="flex items-center bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] rounded-xl p-1 gap-0.5">
      {options.map(({ value, icon: Icon, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
              active
                ? 'text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-400 dark:text-white/25 hover:text-slate-600 dark:hover:text-white/50'
            }`}
            style={active ? {
              background: 'var(--surface-1)',
              color: 'var(--accent)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            } : {}}
            aria-label={`Switch to ${label} mode`}
            title={`${label} mode`}
          >
            <Icon size={12} strokeWidth={active ? 2.5 : 2} style={active ? { filter: 'drop-shadow(0 0 3px var(--accent-glow))' } : {}} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

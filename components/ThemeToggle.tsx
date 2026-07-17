"use client";

import { Moon, Sun } from "lucide-react";
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
    return <div className="w-8 h-8 rounded-md bg-white/5 animate-pulse"></div>;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center gap-2 p-2 w-full rounded-md hover:bg-slate-200 dark:hover:bg-white/5 transition-colors text-slate-500 dark:text-[#888] hover:text-slate-900 dark:hover:text-white"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun size={16} className="text-slate-400 dark:text-[#888] group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
      ) : (
        <Moon size={16} className="text-slate-400 dark:text-[#888] group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
      )}
      <span className="text-[13px] font-medium hidden md:inline">
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}

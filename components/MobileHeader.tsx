import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function MobileHeader() {
  return (
    <header className="h-14 flex md:hidden items-center justify-between px-4 bg-slate-100/60 dark:bg-[#12161B]/60 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.9999 5.83331L13.3333 19.1666L19.9999 32.5L26.6666 19.1666L19.9999 5.83331Z" fill="#00E5FF"/>
          <path d="M5.83337 20L19.1667 13.3333L32.5 20L19.1667 26.6667L5.83337 20Z" fill="#00E5FF" opacity="0.8"/>
          <circle cx="20" cy="20" r="4" fill="#020617"/>
        </svg>
        <span className="text-slate-900 dark:text-white font-medium text-sm tracking-wide">Knoxified</span>
      </div>
      {/* Mobile nav placeholder - full implementation would use a drawer */}
      <div className="flex items-center gap-3 text-slate-500 dark:text-[#888] text-[13px] font-medium">
        <Link href="/" className="hover:text-slate-900 dark:text-white">Overview</Link>
        <Link href="/deployments" className="hover:text-slate-900 dark:text-white">Deploy</Link>
        <Link href="/automations" className="hover:text-slate-900 dark:text-white">Automations</Link>
        <div className="w-8">
           <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

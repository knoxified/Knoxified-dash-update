import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { logout } from "@/lib/actions/auth-actions";

export function MobileHeader() {
  return (
    <header className="h-14 flex md:hidden items-center justify-between px-4 bg-slate-100/60 dark:bg-[#12161B]/60 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 flex items-center justify-center overflow-hidden">
          <img src="/logo.png" alt="Knoxified" className="w-full h-full object-contain" />
        </div>
        <span className="text-slate-900 dark:text-white font-medium text-sm tracking-wide">Knoxified</span>
      </div>
      {/* Mobile nav placeholder - full implementation would use a drawer */}
      <div className="flex items-center gap-3 text-slate-500 dark:text-[#888] text-[13px] font-medium">
        <Link href="/" className="hover:text-slate-900 dark:text-white">Overview</Link>
        <Link href="/deployments" className="hover:text-slate-900 dark:text-white">Deploy</Link>
        <div className="w-8">
           <ThemeToggle />
        </div>
        <form action={logout}>
          <button type="submit" className="text-red-500 font-medium ml-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </form>
      </div>
    </header>
  );
}

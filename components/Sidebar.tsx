"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Server, Zap, BarChart3, Settings, 
  CreditCard, Users, Megaphone, MessageSquare, BookOpen, Layers, Plug, ShieldCheck
} from "lucide-react";
import { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { logout } from "@/lib/actions/auth-actions";
import { useWorkspace } from "@/lib/services/hooks";

export function Sidebar() {
  const pathname = usePathname();
  const { data: workspace, loading: workspaceLoading } = useWorkspace();

  const planName = workspace?.plan?.name || "—";
  const creditsUsed = workspace?.workspace?.usage?.credits ?? 0;
  const creditsLimit = workspace?.plan?.limit_credits;
  // Convention used elsewhere in this app (e.g. voice minute quota checks): 0 = unlimited.
  const isUnlimited = creditsLimit === 0;
  const creditsRemaining = creditsLimit && creditsLimit > 0 ? Math.max(creditsLimit - creditsUsed, 0) : null;
  const creditsPct = creditsLimit && creditsLimit > 0 ? Math.min((creditsUsed / creditsLimit) * 100, 100) : 0;

  const userEmail = workspace?.workspace?.name || "";
  const userInitials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "—";

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-slate-100/60 dark:bg-[#12161B]/60 backdrop-blur-xl border-r border-slate-200/50 dark:border-white/5 hidden md:flex flex-col h-screen overflow-y-auto z-40">
      <div className="flex items-center px-4 h-16 shrink-0 mt-2 mb-2">
        <button className="flex items-center w-full gap-3 bg-transparent hover:bg-slate-200/50 dark:hover:bg-white/5 p-2 rounded-lg transition-colors group text-left">
          <div className="w-8 h-8 rounded-md bg-sky-600/10 dark:bg-[#00E5FF]/10 border border-sky-600/20 dark:border-[#00E5FF]/20 flex items-center justify-center shrink-0 overflow-hidden p-1">
             <img src="/logo.png" alt="Knoxified" className="w-full h-full object-contain drop-shadow-[0_0_5px_rgba(0,229,255,0.3)]" />
          </div>
          <div className="flex-1 overflow-hidden">
             <p className="font-bold text-sm truncate tracking-wide text-gradient-ai drop-shadow-sm">Knoxified OS</p>
             <p className="text-slate-500 dark:text-[#888] text-[10px] font-bold uppercase tracking-wider truncate">Enterprise</p>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors shrink-0"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>

      <div className="px-5 mb-2">
         <button onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'k', 'metaKey': true}))} className="w-full flex items-center justify-between bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md px-3 py-1.5 text-xs text-slate-500 dark:text-[#888] hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-left group">
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              Search
            </span>
            <kbd className="font-mono text-[9px] font-semibold bg-slate-300/50 dark:bg-black/30 px-1 py-0.5 rounded text-slate-500 border border-slate-300 dark:border-white/10">⌘K</kbd>
         </button>
      </div>

      <div className="flex-1 py-4 px-3 flex flex-col gap-6">
        <div>
          <div className="flex flex-col gap-[2px]">
            <NavItem href="/" icon={<LayoutDashboard size={15} />} label="Overview" pathname={pathname} />
            <NavItem href="/metrics" icon={<BarChart3 size={15} />} label="Analytics" pathname={pathname} />
          </div>
        </div>

        <div>
          <p className="px-2 text-[11px] font-medium text-slate-500 dark:text-[#888] mb-1">Intelligence</p>
          <div className="flex flex-col gap-[2px]">
            <NavItem href="/systems" icon={<Server size={15} />} label="Systems" pathname={pathname} />
            <NavItem href="/automations" icon={<Zap size={15} />} label="Automations" pathname={pathname} />
            <NavItem href="/agent-config" icon={<Settings size={15} />} label="Agent Config" pathname={pathname} />
          </div>
        </div>

        <div>
          <p className="px-2 text-[11px] font-medium text-slate-500 dark:text-[#888] mb-1">Operations</p>
          <div className="flex flex-col gap-[2px]">
            <NavItem href="/leads" icon={<Users size={15} />} label="Leads" pathname={pathname} />
            <NavItem href="/campaigns" icon={<Megaphone size={15} />} label="Campaigns" pathname={pathname} />
            <NavItem href="/conversations" icon={<MessageSquare size={15} />} label="Inbox" pathname={pathname} />
          </div>
        </div>

        <div>
          <p className="px-2 text-[11px] font-medium text-slate-500 dark:text-[#888] mb-1">Infrastructure</p>
          <div className="flex flex-col gap-[2px]">
            <NavItem href="/deployments" icon={<Layers size={15} />} label="Deployments" pathname={pathname} />
            <NavItem href="/billing" icon={<CreditCard size={15} />} label="Billing" pathname={pathname} />
            <NavItem href="/integrations" icon={<Plug size={15} />} label="Integrations" pathname={pathname} />
            <NavItem href="/compliance" icon={<ShieldCheck size={15} />} label="Compliance" pathname={pathname} />
            <NavItem href="/settings" icon={<Settings size={15} />} label="Settings" pathname={pathname} />
          </div>
        </div>
      </div>

      <div className="px-3 pb-3">
        <ThemeToggle />
      </div>

      <div className="px-3 pb-2">
        {workspaceLoading ? (
          <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 animate-pulse">
            <div className="h-3 w-16 bg-slate-200 dark:bg-white/10 rounded mb-2"></div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full"></div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-[#888] uppercase tracking-wider">Plan</span>
              <Link href="/billing" className="text-[11px] font-semibold text-sky-600 dark:text-[#00E5FF] hover:underline">
                {planName}
              </Link>
            </div>
            {isUnlimited ? (
              <p className="text-[11px] text-slate-500 dark:text-[#888]">{creditsUsed} credits used (unlimited plan)</p>
            ) : creditsRemaining !== null ? (
              <>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mb-1">
                  <div
                    className="bg-sky-500 dark:bg-[#00E5FF] h-full rounded-full transition-all"
                    style={{ width: `${creditsPct}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#888]">
                  {creditsRemaining.toLocaleString()} / {creditsLimit?.toLocaleString()} credits left
                </p>
              </>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-[#888]">{creditsUsed} credits used</p>
            )}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-200 dark:hover:bg-white/5 transition-colors cursor-pointer text-left w-full group">
          <div className="w-8 h-8 rounded-full bg-[#00E5FF] flex items-center justify-center text-slate-900 dark:text-slate-900 text-[11px] font-bold shrink-0 shadow-[0_0_10px_rgba(79,140,255,0.3)]">
            {userInitials}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-[#00E5FF] transition-colors">{userEmail || "Loading..."}</p>
            <p className="text-[11px] text-slate-500 dark:text-[#888] truncate">{planName}</p>
          </div>
          <Settings size={14} className="text-slate-400 dark:text-[#666] group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
        </div>
        
        <form action={logout} className="mt-2">
          <button type="submit" className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-red-500 hover:bg-red-500/10 transition-colors font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Log Out
          </button>
        </form>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, pathname }: { href: string; icon: ReactNode; label: string; pathname: string }) {
  const active = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex items-center group gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-300 text-[13px] ${
        active 
          ? "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-[#00E5FF] font-semibold shadow-sm translate-x-1 relative overflow-hidden border border-sky-100/50 dark:border-[#00E5FF]/20" 
          : "text-slate-500 dark:text-[#888] hover:text-slate-700 dark:hover:text-[#EDEDED] hover:bg-slate-200/50 dark:hover:bg-white/5 font-medium hover:translate-x-1"
      }`}
    >
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] bg-sky-500 dark:bg-[#00E5FF] rounded-r-full shadow-[0_0_8px_rgba(0,229,255,0.8)]" />}
      <span className={`transition-transform duration-300 z-10 ${active ? "scale-110 drop-shadow-[0_0_5px_rgba(0,229,255,0.4)]" : "group-hover:scale-110"}`}>{icon}</span>
      <span className="tracking-wide z-10">{label}</span>
    </Link>
  );
}


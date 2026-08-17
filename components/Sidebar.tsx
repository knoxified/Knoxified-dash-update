"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Server, Zap, BarChart3, Settings, 
  CreditCard, Users, Megaphone, MessageSquare, BookOpen, Layers, Plug, ShieldCheck,
  ChevronRight
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
  const isUnlimited = creditsLimit === 0;
  const creditsRemaining = creditsLimit && creditsLimit > 0 ? Math.max(creditsLimit - creditsUsed, 0) : null;
  const creditsPct = creditsLimit && creditsLimit > 0 ? Math.min((creditsUsed / creditsLimit) * 100, 100) : 0;
  const isNearLimit = creditsPct > 80;

  const userEmail = workspace?.workspace?.name || "";
  const userInitials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "—";

  return (
    <aside className="fixed inset-y-0 left-0 w-60 hidden md:flex flex-col h-screen overflow-y-auto z-40 border-r border-slate-200/60 dark:border-white/[0.04]"
      style={{ background: 'light-dark(rgba(255,255,255,0.85), rgba(9,13,22,0.92))', backdropFilter: 'blur(24px) saturate(180%)' }}
    >
      {/* Subtle decorative vertical data-line */}
      <div className="absolute right-0 top-0 bottom-0 w-[1px] overflow-hidden pointer-events-none opacity-0 dark:opacity-100">
        <div className="data-line w-full h-full" />
      </div>

      {/* Logo / Workspace Switcher */}
      <div className="flex items-center px-3 h-[60px] shrink-0 mt-2">
        <button className="flex items-center w-full gap-2.5 bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04] p-2 rounded-xl transition-all group text-left">
          <div className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden p-1 transition-all"
            style={{ 
              background: 'var(--accent-muted)', 
              borderColor: 'var(--accent-dim)',
              boxShadow: '0 0 12px var(--accent-dim)'
            }}
          >
            <img src="/logo.png" alt="Knoxified" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 0 4px var(--accent-glow))' }} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-bold text-[13px] truncate tracking-wide text-gradient-ai">Knoxified OS</p>
            <p className="text-slate-400 dark:text-[#6e7681] text-[10px] font-semibold uppercase tracking-widest truncate">Enterprise</p>
          </div>
          <ChevronRight size={12} className="text-slate-300 dark:text-white/20 group-hover:text-slate-500 dark:group-hover:text-white/40 transition-colors shrink-0 rotate-90" />
        </button>
      </div>

      {/* Search trigger */}
      <div className="px-3 mb-3">
        <button 
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'k', 'metaKey': true}))} 
          className="w-full flex items-center justify-between bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-slate-400 dark:text-[#6e7681] hover:bg-slate-200/60 dark:hover:bg-white/[0.07] hover:border-slate-300 dark:hover:border-white/10 transition-all text-left group"
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-white/25 group-hover:text-slate-500 dark:group-hover:text-white/40 transition-colors"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span className="font-medium">Quick search...</span>
          </span>
          <kbd className="font-mono text-[9px] font-bold bg-white dark:bg-black/40 px-1.5 py-0.5 rounded-md text-slate-400 dark:text-white/20 border border-slate-200 dark:border-white/10">⌘K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-2 px-2.5 flex flex-col gap-5 overflow-y-auto">
        <div>
          <div className="flex flex-col gap-0.5">
            <NavItem href="/" icon={<LayoutDashboard size={14} />} label="Overview" pathname={pathname} />
            <NavItem href="/metrics" icon={<BarChart3 size={14} />} label="Analytics" pathname={pathname} />
          </div>
        </div>

        <div>
          <p className="px-2.5 text-[10px] font-bold text-slate-400/60 dark:text-white/20 mb-1.5 uppercase tracking-[0.1em]">Intelligence</p>
          <div className="flex flex-col gap-0.5">
            <NavItem href="/systems" icon={<Server size={14} />} label="Systems" pathname={pathname} />
            <NavItem href="/automations" icon={<Zap size={14} />} label="Automations" pathname={pathname} />
            <NavItem href="/agent-config" icon={<Settings size={14} />} label="Agent Config" pathname={pathname} />
          </div>
        </div>

        <div>
          <p className="px-2.5 text-[10px] font-bold text-slate-400/60 dark:text-white/20 mb-1.5 uppercase tracking-[0.1em]">Operations</p>
          <div className="flex flex-col gap-0.5">
            <NavItem href="/leads" icon={<Users size={14} />} label="Leads" pathname={pathname} />
            <NavItem href="/campaigns" icon={<Megaphone size={14} />} label="Campaigns" pathname={pathname} />
            <NavItem href="/conversations" icon={<MessageSquare size={14} />} label="Inbox" pathname={pathname} />
          </div>
        </div>

        <div>
          <p className="px-2.5 text-[10px] font-bold text-slate-400/60 dark:text-white/20 mb-1.5 uppercase tracking-[0.1em]">Infrastructure</p>
          <div className="flex flex-col gap-0.5">
            <NavItem href="/deployments" icon={<Layers size={14} />} label="Deployments" pathname={pathname} />
            <NavItem href="/billing" icon={<CreditCard size={14} />} label="Billing" pathname={pathname} />
            <NavItem href="/integrations" icon={<Plug size={14} />} label="Integrations" pathname={pathname} />
            <NavItem href="/compliance" icon={<ShieldCheck size={14} />} label="Compliance" pathname={pathname} />
            <NavItem href="/settings" icon={<Settings size={14} />} label="Settings" pathname={pathname} />
          </div>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="px-2.5 pb-2">
        <ThemeToggle />
      </div>

      {/* Credits / Plan Usage */}
      <div className="px-2.5 pb-2">
        {workspaceLoading ? (
          <div className="rounded-xl border border-slate-200/60 dark:border-white/[0.05] bg-slate-50 dark:bg-white/[0.03] p-3 animate-pulse">
            <div className="h-2.5 w-16 bg-slate-200 dark:bg-white/10 rounded mb-3"></div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full"></div>
          </div>
        ) : (
          <div className="rounded-xl border bg-slate-50/80 dark:bg-white/[0.03] p-3 transition-all"
            style={{ borderColor: isNearLimit ? 'rgba(239,68,68,0.2)' : 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-white/25 uppercase tracking-wider">Credits</span>
              <Link href="/billing" className="text-[10px] font-bold hover:opacity-80 transition-opacity" style={{ color: 'var(--accent)' }}>
                {planName}
              </Link>
            </div>
            {isUnlimited ? (
              <p className="text-[11px] text-slate-400 dark:text-white/30">{creditsUsed.toLocaleString()} used · Unlimited</p>
            ) : creditsRemaining !== null ? (
              <>
                <div className="w-full h-1 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ 
                      width: `${creditsPct}%`,
                      background: isNearLimit ? '#ef4444' : 'var(--accent)',
                      boxShadow: isNearLimit ? 'none' : '0 0 6px var(--accent-glow)'
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-white/30">
                  <span className={isNearLimit ? 'text-red-500' : ''}>{creditsRemaining.toLocaleString()}</span> / {creditsLimit?.toLocaleString()} left
                </p>
              </>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-white/30">{creditsUsed.toLocaleString()} used</p>
            )}
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-2.5 border-t border-slate-200/60 dark:border-white/[0.04]">
        <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all cursor-pointer group">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-900 text-[10px] font-extrabold shrink-0 transition-all"
            style={{ background: 'var(--accent)', boxShadow: '0 0 12px var(--accent-glow)' }}
          >
            {userInitials}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[12px] font-semibold text-slate-700 dark:text-white/80 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{userEmail || "Loading..."}</p>
            <p className="text-[10px] text-slate-400 dark:text-white/25 truncate">{planName}</p>
          </div>
          <Settings size={12} className="text-slate-300 dark:text-white/20 group-hover:text-slate-500 dark:group-hover:text-white/50 transition-colors" />
        </div>
        
        <form action={logout} className="mt-1">
          <button type="submit" className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Sign Out
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
      className={`relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg transition-all duration-200 text-[13px] font-medium ${
        active
          ? "text-white"
          : "text-slate-500 dark:text-white/35 hover:text-slate-700 dark:hover:text-white/70 hover:bg-slate-100/80 dark:hover:bg-white/[0.04]"
      }`}
      style={active ? {
        background: 'linear-gradient(135deg, var(--accent-dim) 0%, var(--accent-muted) 100%)',
        color: 'var(--accent)',
        border: '1px solid var(--accent-dim)',
        boxShadow: '0 2px 8px var(--accent-muted), inset 0 0 8px var(--accent-muted)'
      } : {}}
    >
      {active && (
        <span 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full" 
          style={{ background: 'var(--accent)', boxShadow: '0 0 10px var(--accent-glow)' }} 
        />
      )}
      <span className={`transition-all duration-200 z-10 ${active ? "scale-110" : "group-hover:scale-110"}`}
        style={active ? { filter: 'drop-shadow(0 0 4px var(--accent-glow))' } : {}}
      >
        {icon}
      </span>
      <span className="tracking-wide z-10">{label}</span>
    </Link>
  );
}

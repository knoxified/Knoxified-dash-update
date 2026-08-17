"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { logout } from "@/lib/actions/auth-actions";
import { useState } from "react";
import { LayoutDashboard, Server, Zap, BarChart3, Settings, CreditCard, Users, Megaphone, MessageSquare, Layers, Plug, ShieldCheck, X, Menu } from "lucide-react";

const navLinks = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/metrics", label: "Analytics", icon: BarChart3 },
  { href: "/systems", label: "Systems", icon: Server },
  { href: "/automations", label: "Automations", icon: Zap },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/conversations", label: "Inbox", icon: MessageSquare },
  { href: "/deployments", label: "Deployments", icon: Layers },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="h-14 flex md:hidden items-center justify-between px-4 sticky top-0 z-50 border-b border-slate-200/60 dark:border-white/[0.04]"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden p-0.5"
            style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-dim)' }}
          >
            <img src="/logo.png" alt="Knoxified" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-sm text-gradient-ai">Knoxified</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-24">
            <ThemeToggle />
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-slate-600 dark:text-white/60"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* Overlay */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setDrawerOpen(false)}
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Slide-in Drawer */}
      <div className={`fixed top-0 left-0 h-full w-[280px] z-[60] md:hidden flex flex-col transform transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-slate-200/60 dark:border-white/[0.04]`}
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)' }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/[0.05]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden p-1"
              style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-dim)' }}
            >
              <img src="/logo.png" alt="Knoxified" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-sm text-gradient-ai">Knoxified OS</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/40 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all"
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-white/[0.05] space-y-2">
          <form action={logout}>
            <button type="submit" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

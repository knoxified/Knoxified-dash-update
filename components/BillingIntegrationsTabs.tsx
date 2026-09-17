"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/billing", label: "Billing & Plan" },
  { href: "/integrations", label: "Integrations" },
];

// Billing and Integrations stay separate routes (Integrations handles the
// OAuth redirect callback from oauth.knoxified.org -- moving that route
// risks silently breaking a live OAuth flow whose redirect URL is
// configured outside this repo). This tab strip gets the "one unified
// section" feel Knox wants without that risk.
export function BillingIntegrationsTabs() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1 mb-6 border-b border-slate-200/70 dark:border-white/[0.06]">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              active
                ? "text-[color:var(--accent)] border-[color:var(--accent)]"
                : "text-slate-500 dark:text-white/40 border-transparent hover:text-slate-700 dark:hover:text-white/70"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

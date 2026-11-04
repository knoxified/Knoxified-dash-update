"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const OPERATIONS_TABS = [
  { href: "/leads", label: "Leads" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/emails", label: "Emails" },
  { href: "/conversations", label: "Inbox" },
  { href: "/questions", label: "Questions" },
];

// Operations pages sit side by side under one sidebar entry, the same way
// Billing and Integrations do. Routes stay separate so existing links,
// bookmarks and the command menu keep working.
export function OperationsTabs() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1 mb-6 border-b border-slate-200/70 dark:border-white/[0.06] overflow-x-auto">
      {OPERATIONS_TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${
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

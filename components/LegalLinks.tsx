// Links to the legal pages hosted on the marketing site (knoxified-saas).
const LINKS = [
  { label: "Terms of Service", href: "https://knoxified.org/legal/terms" },
  { label: "Privacy Policy", href: "https://knoxified.org/legal/privacy" },
  { label: "Acceptable Use Policy", href: "https://knoxified.org/legal/acceptable-use" },
];

export function LegalLinks({ tone = "app", className = "" }: { tone?: "app" | "dark"; className?: string }) {
  const color =
    tone === "dark"
      ? "text-white/30 hover:text-white/70"
      : "text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/70";
  return (
    <nav aria-label="Legal" className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs ${className}`}>
      {LINKS.map((l) => (
        <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className={`${color} transition-colors`}>
          {l.label}
        </a>
      ))}
    </nav>
  );
}

const STYLE: Record<string, string> = {
  emergency: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  normal: "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-[#aaa]",
  low: "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-[#777]",
};

export function UrgencyBadge({ urgency }: { urgency?: string | null }) {
  if (!urgency || !STYLE[urgency]) return <span className="text-slate-400">—</span>;
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STYLE[urgency]}`}>
      {urgency}
    </span>
  );
}

// Color psychology per industry, same principle already applied on the
// Automations page (Sales=emerald, Marketing=violet, etc.) -- grounded in
// real industry-branding research rather than picked arbitrarily: trust
// industries (healthcare, dental, insurance, legal) cluster to the blue
// family, since that's the near-universal convention for competence and
// trustworthiness; hospitality/food lean warm (orange/red) for comfort and
// appetite; wellness/luxury (med-spa) leans purple for calm and
// exclusivity; sustainability (solar) leans green; home-care gets the same
// rose used for "HR/human warmth" on the Automations page, since that's
// exactly the register a family calling about a loved one needs.
//
// Single source of truth -- used by both the systems index page (grid of
// cards) and the systems detail page, so an industry's color can never
// drift out of sync between the two views.
export const SYSTEM_THEME: Record<string, { iconBg: string; iconText: string }> = {
  legal: { iconBg: "bg-indigo-500/10", iconText: "text-indigo-600 dark:text-indigo-400" },
  healthcare: { iconBg: "bg-blue-500/10", iconText: "text-blue-600 dark:text-blue-400" },
  dental: { iconBg: "bg-sky-500/10", iconText: "text-sky-600 dark:text-sky-400" },
  plumbing: { iconBg: "bg-cyan-500/10", iconText: "text-cyan-600 dark:text-cyan-400" },
  insurance: { iconBg: "bg-teal-500/10", iconText: "text-teal-600 dark:text-teal-400" },
  "real-estate": { iconBg: "bg-emerald-500/10", iconText: "text-emerald-600 dark:text-emerald-400" },
  solar: { iconBg: "bg-green-500/10", iconText: "text-green-600 dark:text-green-400" },
  property: { iconBg: "bg-lime-500/10", iconText: "text-lime-600 dark:text-lime-400" },
  hotel: { iconBg: "bg-orange-500/10", iconText: "text-orange-600 dark:text-orange-400" },
  restaurant: { iconBg: "bg-red-500/10", iconText: "text-red-600 dark:text-red-400" },
  fitness: { iconBg: "bg-amber-500/10", iconText: "text-amber-600 dark:text-amber-400" },
  hvac: { iconBg: "bg-yellow-500/10", iconText: "text-yellow-600 dark:text-yellow-500" },
  "home-care": { iconBg: "bg-rose-500/10", iconText: "text-rose-600 dark:text-rose-400" },
  recruitment: { iconBg: "bg-violet-500/10", iconText: "text-violet-600 dark:text-violet-400" },
  "med-spa": { iconBg: "bg-purple-500/10", iconText: "text-purple-600 dark:text-purple-400" },
  ecommerce: { iconBg: "bg-fuchsia-500/10", iconText: "text-fuchsia-600 dark:text-fuchsia-400" },
  retail: { iconBg: "bg-pink-500/10", iconText: "text-pink-600 dark:text-pink-400" },
  corporate: { iconBg: "bg-slate-500/10", iconText: "text-slate-600 dark:text-slate-400" },
  logistics: { iconBg: "bg-gray-500/10", iconText: "text-gray-600 dark:text-gray-400" },
  roofing: { iconBg: "bg-zinc-500/10", iconText: "text-zinc-600 dark:text-zinc-400" },
  construction: { iconBg: "bg-stone-500/10", iconText: "text-stone-600 dark:text-stone-400" },
  automotive: { iconBg: "bg-neutral-500/10", iconText: "text-neutral-600 dark:text-neutral-400" },
};

export const DEFAULT_SYSTEM_THEME = { iconBg: "bg-slate-500/10", iconText: "text-slate-500 dark:text-slate-400" };

export function getSystemTheme(systemId: string) {
  return SYSTEM_THEME[systemId] || DEFAULT_SYSTEM_THEME;
}

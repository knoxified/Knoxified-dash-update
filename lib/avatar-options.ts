// Curated avatar identities for the voice agent -- not custom illustrated
// art (that's a real asset-production job, not something to fake), but a
// real, deliberate set of icon+color identities so the agent has a
// consistent visual presence across Agent Config and every System page,
// instead of no identity at all. Keep in sync with the same list in
// knoxified-saas/app/onboarding/page.tsx.
export interface AvatarOption {
  key: string;
  label: string;
  colorClass: string; // bg + text, e.g. "bg-sky-500/10 text-sky-500"
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { key: "bot", label: "Bot", colorClass: "bg-[color:var(--accent)]/10 text-[color:var(--accent)]" },
  { key: "headset", label: "Headset", colorClass: "bg-indigo-500/10 text-indigo-500" },
  { key: "sparkles", label: "Sparkles", colorClass: "bg-violet-500/10 text-violet-500" },
  { key: "user-circle", label: "Classic", colorClass: "bg-slate-500/10 text-slate-500" },
  { key: "smile", label: "Friendly", colorClass: "bg-amber-500/10 text-amber-500" },
  { key: "shield", label: "Trusted", colorClass: "bg-emerald-500/10 text-emerald-500" },
  { key: "star", label: "Star", colorClass: "bg-rose-500/10 text-rose-500" },
  { key: "zap", label: "Energetic", colorClass: "bg-sky-500/10 text-sky-500" },
];

export function getAvatarOption(key: string | null | undefined): AvatarOption {
  return AVATAR_OPTIONS.find((a) => a.key === key) || AVATAR_OPTIONS[0];
}

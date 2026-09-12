import { createAvatar } from "@dicebear/core";
import { notionists } from "@dicebear/collection";

// Switched from avataaars (round cartoon/sticker look) to notionists --
// DiceBear's hand-drawn, half-body, candid-pose style built specifically for
// productivity/workspace tools. Not photos of real people (that would be
// both a copyright problem and a deceptive one for an AI agent's identity),
// but a real illustrated-person look, less flat/generic than a round
// cartoon face. Seed-only variation (no manual prop overrides) so every
// avatar renders correctly regardless of exactly which options notionists
// exposes internally. Keep this list in sync with
// knoxified-saas/app/onboarding/page.tsx's AVATAR_CHOICES -- same keys AND
// same seeds, so a choice made during onboarding renders identically here.
export interface AvatarOption {
  key: string;
  label: string;
  seed: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { key: "avatar1", label: "Avatar 1", seed: "knx-notion-1" },
  { key: "avatar2", label: "Avatar 2", seed: "knx-notion-2" },
  { key: "avatar3", label: "Avatar 3", seed: "knx-notion-3" },
  { key: "avatar4", label: "Avatar 4", seed: "knx-notion-4" },
  { key: "avatar5", label: "Avatar 5", seed: "knx-notion-5" },
  { key: "avatar6", label: "Avatar 6", seed: "knx-notion-6" },
  { key: "avatar7", label: "Avatar 7", seed: "knx-notion-7" },
  { key: "avatar8", label: "Avatar 8", seed: "knx-notion-8" },
  { key: "avatar9", label: "Avatar 9", seed: "knx-notion-9" },
  { key: "avatar10", label: "Avatar 10", seed: "knx-notion-10" },
];

export function getAvatarOption(key: string | null | undefined): AvatarOption {
  return AVATAR_OPTIONS.find((a) => a.key === key) || AVATAR_OPTIONS[0];
}

export function renderAvatarSvg(key: string | null | undefined, size = 64): string {
  const opt = getAvatarOption(key);
  const avatar = createAvatar(notionists, {
    seed: opt.seed,
    size,
    backgroundColor: ["transparent"],
  } as any);
  return avatar.toString();
}

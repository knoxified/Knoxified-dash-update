import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";

// Curated, deliberately diverse set of human-illustrated avatars (DiceBear's
// "avataaars" style) -- not photos of real people (that would be both a
// copyright problem and a deceptive one for an AI agent's identity), but a
// real illustrated-person look instead of generic icons. Each preset pins
// hairstyle/clothing/facial-hair for intentional variety; skin tone and
// hair color vary naturally per seed. Keep this list in sync with
// knoxified-saas/app/onboarding/page.tsx's AVATAR_PRESETS.
export interface AvatarOption {
  key: string;
  label: string;
  seed: string;
  top: string;
  clothing: string;
  facialHair?: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { key: "avatar1", label: "Avatar 1", seed: "knx-avatar-1", top: "shortFlat", clothing: "blazerAndShirt" },
  { key: "avatar2", label: "Avatar 2", seed: "knx-avatar-2", top: "bob", clothing: "blazerAndSweater" },
  { key: "avatar3", label: "Avatar 3", seed: "knx-avatar-3", top: "curly", clothing: "shirtCrewNeck" },
  { key: "avatar4", label: "Avatar 4", seed: "knx-avatar-4", top: "shortWaved", clothing: "collarAndSweater", facialHair: "beardLight" },
  { key: "avatar5", label: "Avatar 5", seed: "knx-avatar-5", top: "bun", clothing: "blazerAndSweater" },
  { key: "avatar6", label: "Avatar 6", seed: "knx-avatar-6", top: "shortRound", clothing: "hoodie" },
  { key: "avatar7", label: "Avatar 7", seed: "knx-avatar-7", top: "straight02", clothing: "shirtScoopNeck" },
  { key: "avatar8", label: "Avatar 8", seed: "knx-avatar-8", top: "fro", clothing: "blazerAndShirt" },
  { key: "avatar9", label: "Avatar 9", seed: "knx-avatar-9", top: "theCaesar", clothing: "shirtVNeck", facialHair: "moustacheFancy" },
  { key: "avatar10", label: "Avatar 10", seed: "knx-avatar-10", top: "dreads01", clothing: "blazerAndSweater" },
];

export function getAvatarOption(key: string | null | undefined): AvatarOption {
  return AVATAR_OPTIONS.find((a) => a.key === key) || AVATAR_OPTIONS[0];
}

export function renderAvatarSvg(key: string | null | undefined, size = 64): string {
  const opt = getAvatarOption(key);
  const avatar = createAvatar(avataaars, {
    seed: opt.seed,
    size,
    top: [opt.top],
    clothing: [opt.clothing],
    ...(opt.facialHair ? { facialHair: [opt.facialHair], facialHairProbability: 100 } : { facialHairProbability: 0 }),
  } as any);
  return avatar.toString();
}

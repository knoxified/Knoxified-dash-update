import { createAvatar } from "@dicebear/core";
import { lorelei } from "@dicebear/collection";

// Lorelei (DiceBear, CC0 1.0 -- free for commercial use, no attribution needed):
// illustrated people with real skin tones, hair, eyes, brows, nose and lips. They are
// invented faces, not photos or likenesses of anyone (an AI agent must not pose as a real person).
// Every feature below is hand-picked rather than seeded, so every avatar is friendly and
// well-proportioned. Keep this list in sync with knoxified-saas/app/onboarding/page.tsx.

export type AvatarOption = AvatarDef;
interface AvatarDef {
  key: string; label: string; seed: string; skin: string; hair: string; hairColor: string;
  eyes: string; brows: string; mouth: string; nose: string; head: string; bg: string; earrings?: string;
}

// Order matters: AVATAR_OPTIONS[0] is the fallback for accounts with no avatar set. Keys never change,
// so an avatar chosen earlier keeps its slot (and now shows its new face).
export const AVATAR_OPTIONS: AvatarOption[] = [
  { key: 'avatar1', label: 'Avatar 1', seed: 'knx-lorelei-1', skin: 'e8b996', hair: 'variant13', hairColor: '4a2c1a', eyes: 'variant04', brows: 'variant05', mouth: 'happy01', nose: 'variant02', head: 'variant01', bg: 'd7f3f7', earrings: 'variant01' },
  { key: 'avatar2', label: 'Avatar 2', seed: 'knx-lorelei-2', skin: 'b07a52', hair: 'variant03', hairColor: '1a1410', eyes: 'variant10', brows: 'variant03', mouth: 'happy02', nose: 'variant03', head: 'variant02', bg: 'e4defa' },
  { key: 'avatar3', label: 'Avatar 3', seed: 'knx-lorelei-3', skin: 'f3d2b9', hair: 'variant18', hairColor: '8b5a2b', eyes: 'variant06', brows: 'variant07', mouth: 'happy03', nose: 'variant01', head: 'variant03', bg: 'fde2e4', earrings: 'variant02' },
  { key: 'avatar4', label: 'Avatar 4', seed: 'knx-lorelei-4', skin: '8a5a3c', hair: 'variant12', hairColor: '1a1410', eyes: 'variant14', brows: 'variant09', mouth: 'happy02', nose: 'variant04', head: 'variant01', bg: 'fff1d0' },
  { key: 'avatar5', label: 'Avatar 5', seed: 'knx-lorelei-5', skin: 'd39b73', hair: 'variant35', hairColor: '2a1a12', eyes: 'variant02', brows: 'variant09', mouth: 'happy04', nose: 'variant05', head: 'variant04', bg: 'dcfce7', earrings: 'variant03' },
  { key: 'avatar6', label: 'Avatar 6', seed: 'knx-lorelei-6', skin: 'f6dcc8', hair: 'variant08', hairColor: 'b5651d', eyes: 'variant16', brows: 'variant04', mouth: 'happy05', nose: 'variant02', head: 'variant02', bg: 'dbeafe' },
  { key: 'avatar7', label: 'Avatar 7', seed: 'knx-lorelei-7', skin: '6b4429', hair: 'variant24', hairColor: '140d0a', eyes: 'variant04', brows: 'variant05', mouth: 'happy02', nose: 'variant06', head: 'variant03', bg: 'fce7f3', earrings: 'variant01' },
  { key: 'avatar8', label: 'Avatar 8', seed: 'knx-lorelei-8', skin: 'e8b996', hair: 'variant01', hairColor: '4a2c1a', eyes: 'variant06', brows: 'variant03', mouth: 'happy03', nose: 'variant03', head: 'variant01', bg: 'e0f2fe' },
  { key: 'avatar9', label: 'Avatar 9', seed: 'knx-lorelei-9', skin: 'c68863', hair: 'variant26', hairColor: '2a1a12', eyes: 'variant02', brows: 'variant09', mouth: 'happy01', nose: 'variant01', head: 'variant04', bg: 'ede9fe', earrings: 'variant02' },
  { key: 'avatar10', label: 'Avatar 10', seed: 'knx-lorelei-10', skin: 'd39b73', hair: 'variant39', hairColor: '1a1410', eyes: 'variant04', brows: 'variant09', mouth: 'happy05', nose: 'variant04', head: 'variant02', bg: 'fef3c7' },
  { key: 'calista', label: 'Calista', seed: 'calista', skin: 'f3d2b9', hair: 'variant16', hairColor: 'c9a15f', eyes: 'variant04', brows: 'variant07', mouth: 'happy03', nose: 'variant02', head: 'variant03', bg: 'ffe4e6', earrings: 'variant03' },
];

// Colour helper: scale a hex colour toward black (used for brows / nose lines).
function shade(hex: string, k: number) {
  return [0, 2, 4].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
}

function avatarOptions(d: AvatarDef, size: number) {
  const deep = parseInt(d.skin, 16) < 0x9a0000;
  return {
    seed: d.seed,
    size,
    skinColor: [d.skin],
    hairColor: [d.hairColor],
    eyesColor: ['2b1d16'],
    eyebrowsColor: [shade(d.hairColor, 0.85)],
    noseColor: [shade(d.skin, 0.72)],
    mouthColor: [deep ? 'd98a8a' : 'c2566b'],
    eyes: [d.eyes],
    eyebrows: [d.brows],
    mouth: [d.mouth],
    nose: [d.nose],
    hair: [d.hair],
    head: [d.head],
    // Fixed, hand-picked features: nothing is random, so no avatar can come out odd-looking.
    glassesProbability: 0,
    beardProbability: 0,
    frecklesProbability: 0,
    hairAccessoriesProbability: 0,
    earringsProbability: d.earrings ? 100 : 0,
    earrings: [d.earrings || 'variant01'],
    earringsColor: ['d4a017'],
    backgroundColor: [d.bg],
  };
}

export function getAvatarOption(key: string | null | undefined): AvatarOption {
  return AVATAR_OPTIONS.find((a) => a.key === key) || AVATAR_OPTIONS[0];
}

export function renderAvatarSvg(key: string | null | undefined, size = 64): string {
  return createAvatar(lorelei, avatarOptions(getAvatarOption(key), size) as any).toString();
}

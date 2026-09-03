// Voice options offered in the Agent Configuration "Voice" dropdown.
//
// IMPORTANT: only the first two entries are IDs Claude could verify against
// Cartesia's own docs during this session (network access here can't reach
// api.cartesia.ai to call List Voices live, and Cartesia's public voice
// library page isn't scrapeable from docs alone). Fabricating additional
// UUIDs would risk silently breaking TTS in production, so this list is
// deliberately short rather than guessed.
//
// To add more (2 minutes, no code changes needed elsewhere):
//   1. Go to https://play.cartesia.ai (Voice Library)
//   2. Pick a voice, copy its ID from the voice detail panel
//   3. Add a row below with a friendly name your clients will recognize
//
// Every id here must exist in your Cartesia account/org, since sonic-3
// will 404 on an id it doesn't recognize.
export interface VoiceOption {
  id: string;
  name: string;
  description: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "e07c00bc-4134-4eae-9ea4-1a55fb45746b",
    name: "Default",
    description: "The voice already in production today.",
  },
  {
    id: "78ab82d5-25be-4f7d-82b3-7ad64e5b85b2",
    name: "Alternate",
    description: "A second confirmed-working Cartesia voice.",
  },
  // Add more real voice IDs from play.cartesia.ai here, e.g.:
  // { id: "PASTE-REAL-UUID-HERE", name: "Warm Female (US)", description: "..." },
];

export function getVoiceOption(id: string | null | undefined): VoiceOption {
  return VOICE_OPTIONS.find((v) => v.id === id) || VOICE_OPTIONS[0];
}

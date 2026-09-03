// Voice options offered in the Agent Configuration "Voice" dropdown.
//
// IDs below Default/Alternate were picked by Knox directly from Cartesia's
// voice library (play.cartesia.ai), so they're confirmed real. To add more
// later (2 minutes, no code changes needed elsewhere):
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
  {
    id: "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4",
    name: "Skylar",
    description: "Cartesia voice.",
  },
  {
    id: "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
    name: "Jacqueline",
    description: "Cartesia voice.",
  },
  {
    id: "ef191366-f52f-447a-a398-ed8c0f2943a1",
    name: "Archie",
    description: "Cartesia voice.",
  },
  {
    id: "30894953-bcce-41fe-892c-15ce19c843ff",
    name: "Parker",
    description: "Cartesia voice.",
  },
  {
    id: "47c38ca4-5f35-497b-b1a3-415245fb35e1",
    name: "Daniel",
    description: "Cartesia voice.",
  },
  {
    id: "f6ff7c0c-e396-40a9-a70b-f7607edb6937",
    name: "Emma",
    description: "Cartesia voice.",
  },
  {
    id: "a5136bf9-224c-4d76-b823-52bd5efcffcc",
    name: "Jameson",
    description: "Cartesia voice.",
  },
];

export function getVoiceOption(id: string | null | undefined): VoiceOption {
  return VOICE_OPTIONS.find((v) => v.id === id) || VOICE_OPTIONS[0];
}

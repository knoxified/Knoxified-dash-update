import "server-only";
import { signalwireProvider } from "./signalwire";
import { telnyxProvider } from "./telnyx";
import type { TelephonyProvider } from "./types";

const providers: Record<string, TelephonyProvider> = {
  signalwire: signalwireProvider,
  telnyx: telnyxProvider,
};

export function getProvider(name: string): TelephonyProvider | null {
  return providers[name] ?? null;
}

export { TelephonyError } from "./types";
export type { AvailableNumber } from "./types";

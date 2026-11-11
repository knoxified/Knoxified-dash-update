import "server-only";

// SignalWire adapter (Compatibility / LaML REST API). Secrets live in the
// dashboard Worker: SIGNALWIRE_SPACE_URL (e.g. yourspace.signalwire.com),
// SIGNALWIRE_PROJECT_ID, SIGNALWIRE_API_TOKEN. Never put them in wrangler vars.

import { TelephonyError, type AvailableNumber, type PurchasedNumber, type TelephonyProvider } from "./types";

function base() {
  const space = (process.env.SIGNALWIRE_SPACE_URL || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const project = process.env.SIGNALWIRE_PROJECT_ID;
  const token = process.env.SIGNALWIRE_API_TOKEN;
  if (!space || !project || !token) throw new TelephonyError("Telephony provider is not configured", 500);
  return {
    url: `https://${space}/api/laml/2010-04-01/Accounts/${project}`,
    auth: "Basic " + btoa(`${project}:${token}`),
  };
}

// Heuristic: provider rejects the purchase because the account has no funds.
function looksLikeLowBalance(status: number, body: string) {
  return status === 402 || status === 403 || /insufficient|balance|funds|payment required|trial|verif/i.test(body);
}

export async function searchNumbers(countryCode: string, areaCode?: string): Promise<AvailableNumber[]> {
  const { url, auth } = base();
  const params = new URLSearchParams();
  if (areaCode && /^\d{2,4}$/.test(areaCode) && (countryCode === "US" || countryCode === "CA")) {
    params.set("AreaCode", areaCode);
  }
  const res = await fetch(`${url}/AvailablePhoneNumbers/${countryCode}/Local.json?${params}`, {
    headers: { Authorization: auth },
  });
  const text = await res.text();
  if (!res.ok) throw new TelephonyError(`Number search failed (${res.status})`, res.status, looksLikeLowBalance(res.status, text));
  const data = JSON.parse(text);
  const list = Array.isArray(data.available_phone_numbers) ? data.available_phone_numbers : [];
  return list
    .filter((n: any) => n?.phone_number && (n.capabilities?.voice ?? true))
    .slice(0, 5)
    .map((n: any) => ({ phone_number: n.phone_number, friendly_name: n.friendly_name || n.phone_number, region: n.region || n.locality || null }));
}

export async function buyNumber(phoneNumber: string, voiceUrl: string, label: string): Promise<PurchasedNumber> {
  const { url, auth } = base();
  const body = new URLSearchParams({
    PhoneNumber: phoneNumber,
    VoiceUrl: voiceUrl,
    VoiceMethod: "POST",
    FriendlyName: label.slice(0, 64),
  });
  const res = await fetch(`${url}/IncomingPhoneNumbers.json`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new TelephonyError(`Number purchase failed (${res.status}): ${text.slice(0, 300)}`, res.status, looksLikeLowBalance(res.status, text));
  const data = JSON.parse(text);
  if (!data.sid || !data.phone_number) throw new TelephonyError("Provider returned an unexpected response", 502);
  return { sid: data.sid, phone_number: data.phone_number };
}

export const signalwireProvider: TelephonyProvider = {
  name: "signalwire",
  search: searchNumbers,
  buy: (phoneNumber, label) =>
    buyNumber(phoneNumber, process.env.VOICE_INBOUND_URL || "https://voice.knoxified.org/voice/inbound", label),
};

import "server-only";
import { TelephonyError, type AvailableNumber, type PurchasedNumber, type TelephonyProvider } from "./types";

// Telnyx adapter. Secrets on the DASHBOARD Worker:
//   TELNYX_API_KEY        - same key the voice agent uses
//   TELNYX_CONNECTION_ID  - the Call Control Application whose webhook already points at the voice agent
// Optional: TELNYX_MIN_BALANCE (USD, default 5) - purchases pause below this.

const API = "https://api.telnyx.com/v2";

function headers() {
  const key = process.env.TELNYX_API_KEY;
  if (!key) throw new TelephonyError("Telephony provider is not configured", 500);
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

function lowBalanceLike(status: number, body: string) {
  // Also treats "account not verified / still on trial" as not-ready, so a purchase waits instead of failing.
  return status === 402 || status === 403 || /insufficient|balance|funds|payment|credit|verif|kyc|identity|upgrade|account level|trial|not (permitted|allowed)/i.test(body);
}

async function search(countryCode: string, areaCode?: string): Promise<AvailableNumber[]> {
  const p = new URLSearchParams({
    "filter[country_code]": countryCode,
    "filter[phone_number_type]": "local",
    "filter[features][]": "voice",
    "filter[limit]": "5",
  });
  if (areaCode && /^\d{2,4}$/.test(areaCode) && (countryCode === "US" || countryCode === "CA")) {
    p.set("filter[national_destination_code]", areaCode);
  }
  const res = await fetch(`${API}/available_phone_numbers?${p}`, { headers: headers() });
  const text = await res.text();
  if (!res.ok) throw new TelephonyError(`Number search failed (${res.status})`, res.status, lowBalanceLike(res.status, text));
  const list = JSON.parse(text).data || [];
  return list.slice(0, 5).map((n: any) => ({
    phone_number: n.phone_number,
    friendly_name: n.phone_number,
    region: n.region_information?.find((r: any) => r.region_type === "location")?.region_name || null,
  }));
}

async function checkFunds() {
  const min = Number(process.env.TELNYX_MIN_BALANCE || 5);
  let available: number | null = null;
  try {
    const res = await fetch(`${API}/balance`, { headers: headers() });
    if (res.ok) available = Number((await res.json()).data?.available_credit);
  } catch {
    return; // balance lookup is best-effort; the order itself is still guarded
  }
  if (available !== null && Number.isFinite(available) && available < min) {
    throw new TelephonyError(`Telnyx balance too low (${available})`, 402, true);
  }
}

async function buy(phoneNumber: string, _label: string): Promise<PurchasedNumber> {
  const connection = process.env.TELNYX_CONNECTION_ID;
  if (!connection) throw new TelephonyError("Telnyx connection is not configured", 500);

  const res = await fetch(`${API}/number_orders`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ phone_numbers: [{ phone_number: phoneNumber }], connection_id: connection }),
  });
  const text = await res.text();
  if (!res.ok) throw new TelephonyError(`Number order failed (${res.status}): ${text.slice(0, 300)}`, res.status, lowBalanceLike(res.status, text));

  let order = JSON.parse(text).data;
  // Orders for US/CA local numbers are normally instant; poll briefly otherwise.
  for (let i = 0; i < 4 && order?.status === "pending"; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(`${API}/number_orders/${order.id}`, { headers: headers() });
    if (poll.ok) order = (await poll.json()).data;
  }
  if (order?.status !== "success") {
    throw new TelephonyError(`Number order did not complete (status: ${order?.status || "unknown"})`, 502, lowBalanceLike(0, JSON.stringify(order || {})));
  }
  const got = order.phone_numbers?.[0];
  if (!got?.phone_number) throw new TelephonyError("Provider returned an unexpected response", 502);
  return { sid: got.id || order.id, phone_number: got.phone_number };
}

// The id stored at purchase is the order item id, so the live number resource is looked up by number.
async function release(phoneNumber: string, _id: string | null) {
  const find = await fetch(`${API}/phone_numbers?filter[phone_number]=${encodeURIComponent(phoneNumber)}`, { headers: headers() });
  if (!find.ok) throw new TelephonyError(`Release lookup failed (${find.status})`, find.status);
  const id = (await find.json()).data?.[0]?.id;
  if (!id) return; // not found: already released
  const del = await fetch(`${API}/phone_numbers/${id}`, { method: "DELETE", headers: headers() });
  if (!del.ok && del.status !== 404) throw new TelephonyError(`Release failed (${del.status})`, del.status);
}

export const telnyxProvider: TelephonyProvider = { name: "telnyx", search, buy, release, checkFunds };

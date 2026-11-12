import "server-only";

export type AvailableNumber = { phone_number: string; friendly_name: string; region: string | null };
export type PurchasedNumber = { sid: string; phone_number: string };

export class TelephonyError extends Error {
  status: number;
  lowBalance: boolean;
  constructor(message: string, status: number, lowBalance = false) {
    super(message);
    this.status = status;
    this.lowBalance = lowBalance;
  }
}

// Every provider implements this. Adding one = new file + one line in index.ts.
export interface TelephonyProvider {
  name: "signalwire" | "telnyx";
  search(countryCode: string, areaCode?: string): Promise<AvailableNumber[]>;
  buy(phoneNumber: string, label: string): Promise<PurchasedNumber>;
  // Give the number back to the provider so it stops billing. Must treat "already gone" as success.
  release(phoneNumber: string, providerNumberId: string | null): Promise<void>;
  // Optional pre-flight: throw TelephonyError(lowBalance=true) if the account can't afford a purchase.
  checkFunds?(): Promise<void>;
}

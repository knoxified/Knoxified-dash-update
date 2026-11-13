import {
  ANNUAL_FIRST_PAYMENT_DISCOUNT_PERCENT,
  MONTHLY_FIRST_PAYMENT_DISCOUNT_PERCENT,
} from "@/lib/constants/discount";

// Pure helpers shared by the checkout route, the Flutterwave webhook and the UI.

export function isAnnualInterval(interval?: string | null): boolean {
  const v = (interval ?? "").toLowerCase();
  return v === "annual" || v === "year" || v === "yearly";
}

export function isMonthlyInterval(interval?: string | null): boolean {
  const v = (interval ?? "").toLowerCase();
  return v === "monthly" || v === "month";
}

// Paid, self-serve plans only (never the trial or a custom plan).
export function isOfferEligiblePlan(plan: { name?: string | null; price?: number | string | null }): boolean {
  return Number(plan.price) > 0 && !/trial|custom/i.test(plan.name ?? "");
}

// The amount of the first payment while the offer is open.
export function discountedPrice(plan: { price: number | string; billing_interval?: string | null }): number {
  const percent = isAnnualInterval(plan.billing_interval)
    ? ANNUAL_FIRST_PAYMENT_DISCOUNT_PERCENT
    : MONTHLY_FIRST_PAYMENT_DISCOUNT_PERCENT;
  return Math.round(Number(plan.price) * (100 - percent)) / 100;
}

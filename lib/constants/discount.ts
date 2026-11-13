// Partner-referral sign-up offer: a ONE-TIME discount on the customer's FIRST payment.
// Renewals are always charged at the plan's normal Flutterwave amount, so the Flutterwave
// payment plan for every paid plan must have its full price set as the plan amount.
//
// The offer can be used once per account (users.discount_offer_claimed_at): whichever
// plan the customer pays for first, monthly or annual, uses it up.
//
// Customer-facing copy deliberately avoids "new"/"founding" language; the banner names the
// referring partner instead.

// Monthly plans: percent off the first payment.
export const MONTHLY_FIRST_PAYMENT_DISCOUNT_PERCENT = 50;

// Annual plans: list price is 10x monthly (2 months free). 10% off the first year
// makes it 9x monthly, i.e. 3 months free.
export const ANNUAL_FIRST_PAYMENT_DISCOUNT_PERCENT = 10;

// Master switch. false = only partner-referred signups get the offer window.
// Flip to true to offer it to every account again (no other change needed).
export const ORGANIC_DISCOUNT_ENABLED = false;

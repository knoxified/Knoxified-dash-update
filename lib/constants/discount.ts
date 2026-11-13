// The 48-hour discount is offered through "Affiliate Discount Rate" plans:
// one hidden plan row per paid plan, linked to its base plan through
// plans.affiliate_rate_of. These rows are internal only; customer-facing copy
// (see DiscountOfferBanner.tsx) deliberately avoids "new"/"founding"/"affiliate"
// language because surfacing "you're an early customer" works against conversion.

// Master switch. false = only partner-referred signups get the 48-hour window.
// Flip to true to offer it to every account again (no other change needed).
export const ORGANIC_DISCOUNT_ENABLED = false;

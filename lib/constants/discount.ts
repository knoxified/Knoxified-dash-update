// Internal-only label -- this is the plans.name value used to identify
// the discount plan row in the database and in Flutterwave's dashboard.
// Never shown to customers (see DiscountOfferBanner.tsx for the actual
// customer-facing copy, which deliberately avoids "new"/"founding"
// language -- see the Nielsen brand-familiarity research this was based
// on: 60% of consumers prefer a familiar brand over a new one, so surfacing
// "you're an early customer" works against conversion, not for it).
export const FOUNDING_RATE_PLAN_NAME = "Pro Founding Rate";

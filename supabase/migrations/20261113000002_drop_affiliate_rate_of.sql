-- The affiliate offer is now a one-time discount on the first payment, not separate plan
-- rows, so the variant link column is no longer used. Optional cleanup; safe to re-run.
drop index if exists public.plans_affiliate_rate_of_idx;
alter table public.plans drop column if exists affiliate_rate_of;

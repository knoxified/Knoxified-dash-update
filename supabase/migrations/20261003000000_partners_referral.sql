-- Partner (referral) program, step 1: who the partners are and which
-- customer came from which partner. Idempotent -- safe to re-run.
-- The commission ledger is deliberately NOT here yet; build it when the
-- first partner actually brings a client.

CREATE TABLE IF NOT EXISTS public.partners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  email text NOT NULL,
  -- Value used in knoxified.org/?ref=<ref_code>. Lowercase, URL-safe.
  ref_code text NOT NULL,
  -- Percent of net cash collected. Stored per partner so a rate change
  -- needs no code change; the ledger must snapshot it per payment later.
  commission_rate numeric(5,2) NOT NULL DEFAULT 30.00
    CHECK (commission_rate >= 0 AND commission_rate <= 100),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'terminated')),
  agreement_signed_at timestamp with time zone,
  payout_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT partners_pkey PRIMARY KEY (id),
  CONSTRAINT partners_ref_code_format CHECK (ref_code ~ '^[a-z0-9_-]{3,40}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS partners_ref_code_unique
  ON public.partners USING btree (ref_code);
CREATE UNIQUE INDEX IF NOT EXISTS partners_email_unique
  ON public.partners USING btree (lower(email));

-- RLS on with no policies = service-role only. Partner emails and payout
-- notes must never be readable through the public anon/authenticated API.
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Which partner referred this customer. Set once at signup (or manually for
-- warm introductions); NULL = direct signup.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referred_by_partner_id uuid
  REFERENCES public.partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_referred_by_partner_idx
  ON public.users USING btree (referred_by_partner_id)
  WHERE referred_by_partner_id IS NOT NULL;

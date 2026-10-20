-- What the owner sees per caller on the Leads table: why they called, how
-- urgent, their tone, whether an appointment was booked. Written by the voice
-- agent (service role) after each call. Idempotent; safe to re-run.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS urgency text
    CHECK (urgency IS NULL OR urgency IN ('low', 'normal', 'high', 'emergency')),
  ADD COLUMN IF NOT EXISTS caller_tone text,
  ADD COLUMN IF NOT EXISTS appointment_booked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_call_summary text;

-- Adds the tracking columns the automations page needs to enforce a 24h
-- swap cooldown: disabling an automation is always instant, but enabling a
-- DIFFERENT automation into a slot that was only freed by a recent disable
-- locks that new pick in for 24h before it can be swapped again. Re-enabling
-- the exact automation that was disabled is always instant (undo).

ALTER TABLE public.user_automations
  ADD COLUMN IF NOT EXISTS disabled_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS locked_until timestamp with time zone;

COMMENT ON COLUMN public.user_automations.disabled_at IS
  'Set whenever is_enabled flips to false. Used to detect whether a slot was freed recently (within 24h) for swap-cooldown purposes.';
COMMENT ON COLUMN public.user_automations.locked_until IS
  'Set when this automation was enabled as a genuine swap-in (using a slot freed by a recent disable). While in the future, a DIFFERENT automation cannot be enabled into a freed slot until this passes -- re-enabling this same automation is always allowed and clears it.';

-- Speeds up the "is anything currently locked for this user" check the
-- automations page runs on every enable attempt.
CREATE INDEX IF NOT EXISTS idx_user_automations_locked
  ON public.user_automations (user_id)
  WHERE locked_until IS NOT NULL;

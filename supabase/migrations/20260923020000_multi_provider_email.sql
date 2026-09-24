-- Multi-provider sending (Google, Microsoft 365 / Outlook, Zoho Mail).
-- Run AFTER 20260923010000_email_campaigns.sql. Idempotent.
--
--   campaigns.provider          which connected mailbox a campaign sends from
--   oauth_connections.metadata  provider extras; Zoho's data-center host lives
--                               here (written by the auth service)
--   claim_due_recipients        now also returns each campaign's provider so the
--                               sender knows which mailbox API to use

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'google';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_provider_check' AND conrelid = 'public.campaigns'::regclass
  ) THEN
    ALTER TABLE public.campaigns
      ADD CONSTRAINT campaigns_provider_check CHECK (provider IN ('google', 'microsoft', 'zoho'));
  END IF;
END $$;

ALTER TABLE public.oauth_connections
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- The output columns change, so the old function must be dropped first.
DROP FUNCTION IF EXISTS public.claim_due_recipients(integer, integer);

CREATE FUNCTION public.claim_due_recipients(p_limit integer DEFAULT 15, p_daily_cap integer DEFAULT 40)
RETURNS TABLE (
  recipient_id uuid,
  campaign_id uuid,
  user_id uuid,
  email_id uuid,
  to_email text,
  subject text,
  body text,
  step smallint,
  unsubscribe_token uuid,
  mailing_address text,
  sender_name text,
  provider text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT r.id, r.user_id AS uid, r.next_send_at
    FROM public.campaign_recipients r
    JOIN public.campaigns c ON c.id = r.campaign_id
    WHERE r.status = 'active' AND c.status = 'active' AND r.next_send_at <= now()
    ORDER BY r.next_send_at
    LIMIT p_limit * 5
    FOR UPDATE OF r SKIP LOCKED
  ),
  ranked AS (
    SELECT d.id, d.uid, row_number() OVER (PARTITION BY d.uid ORDER BY d.next_send_at) AS rn
    FROM due d
  ),
  allowed AS (
    SELECT rk.id
    FROM ranked rk
    JOIN public.users u ON u.id = rk.uid
    JOIN public.plans p ON p.id = u.plan_id
    WHERE rk.rn <= GREATEST(0, p_daily_cap - (
            SELECT count(*) FROM public.emails e
            WHERE e.user_id = rk.uid AND e.status = 'sent' AND e.sent_at >= date_trunc('day', now())))
      AND (p.limit_email_sent IS NULL OR rk.rn + (
            SELECT COALESCE(sum(x.used_quantity), 0) FROM public.usage x
            WHERE x.user_id = rk.uid AND x.feature_key = 'email_sent'
              AND x.created_at >= date_trunc('month', now())) <= p.limit_email_sent)
    LIMIT p_limit
  ),
  leased AS (
    UPDATE public.campaign_recipients r
    SET next_send_at = now() + interval '30 minutes', updated_at = now()
    FROM allowed a
    WHERE r.id = a.id
    RETURNING r.id, r.campaign_id, r.user_id, r.current_step, r.unsubscribe_token
  )
  SELECT l.id, l.campaign_id, l.user_id, e.id, e.to_email, e.subject, e.body, e.step,
         l.unsubscribe_token, c.mailing_address, c.sender_name, c.provider
  FROM leased l
  JOIN public.campaigns c ON c.id = l.campaign_id
  JOIN public.emails e ON e.recipient_id = l.id AND e.step = l.current_step AND e.status = 'scheduled';
END;
$$;

REVOKE ALL ON FUNCTION public.claim_due_recipients(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_due_recipients(integer, integer) TO service_role;

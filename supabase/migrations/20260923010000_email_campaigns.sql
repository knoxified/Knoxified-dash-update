-- Email campaigns: 4-email sequences sent 1 every N days from the customer's
-- own mailbox. Depends on 20260923000000_leads.sql (leads table). Idempotent.
--
-- Model:
--   campaigns            one row per launched sequence campaign
--   campaign_recipients  one row per person in a campaign; tracks which step
--                        is next and when it is due
--   emails               EVERY email: MailCraft drafts (no campaign yet),
--                        scheduled steps, sent, failed. Powers the Emails page
--                        and each lead's timeline.
--   email_suppressions   per-account do-not-email list (unsubscribes)
--
-- The Worker's cron (service role) claims due recipients via
-- claim_due_recipients(), sends, then reports back through
-- complete_recipient_send() / fail_recipient_send(). Unsubscribe links call
-- unsubscribe_recipient(). Users can never call those (service_role only).

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  gap_days smallint NOT NULL DEFAULT 3 CHECK (gap_days BETWEEN 1 AND 14),
  consent_source text NOT NULL,
  -- Required by CAN-SPAM-style rules and appended to every email footer.
  mailing_address text NOT NULL,
  sender_name text NOT NULL,
  source text NOT NULL DEFAULT 'leads' CHECK (source IN ('leads', 'mailcraft')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  launched_at timestamp with time zone,
  CONSTRAINT campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT campaigns_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  user_id uuid NOT NULL,
  lead_id uuid,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'replied', 'unsubscribed', 'failed', 'paused')),
  current_step smallint NOT NULL DEFAULT 1,
  total_steps smallint NOT NULL DEFAULT 4,
  next_send_at timestamp with time zone,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  attempts smallint NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campaign_recipients_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_recipients_campaign_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE,
  CONSTRAINT campaign_recipients_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT campaign_recipients_lead_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL,
  CONSTRAINT campaign_recipients_token_unique UNIQUE (unsubscribe_token)
);
CREATE UNIQUE INDEX IF NOT EXISTS campaign_recipients_campaign_email_unique
  ON public.campaign_recipients (campaign_id, lower(email));
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_due
  ON public.campaign_recipients (next_send_at) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.emails (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid,
  recipient_id uuid,
  lead_id uuid,
  -- Groups the 4 drafts MailCraft wrote for one person.
  sequence_id uuid,
  step smallint NOT NULL DEFAULT 1,
  to_email text NOT NULL,
  to_name text,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sent', 'failed', 'cancelled')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('mailcraft', 'template', 'manual')),
  provider_message_id text,
  sent_at timestamp with time zone,
  error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT emails_pkey PRIMARY KEY (id),
  CONSTRAINT emails_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT emails_campaign_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE,
  CONSTRAINT emails_recipient_fkey FOREIGN KEY (recipient_id) REFERENCES public.campaign_recipients(id) ON DELETE CASCADE,
  CONSTRAINT emails_lead_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_emails_user_created ON public.emails (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_recipient_step ON public.emails (recipient_id, step);
CREATE INDEX IF NOT EXISTS idx_emails_lead ON public.emails (lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_user_sent_at ON public.emails (user_id, sent_at) WHERE status = 'sent';

CREATE TABLE IF NOT EXISTS public.email_suppressions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  reason text NOT NULL DEFAULT 'unsubscribed',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT email_suppressions_pkey PRIMARY KEY (id),
  CONSTRAINT email_suppressions_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS email_suppressions_user_email_unique
  ON public.email_suppressions (user_id, lower(email));

-- ---------- RLS: users see and manage only their own rows ----------
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.campaign_recipients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emails TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.email_suppressions TO authenticated;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['campaigns', 'campaign_recipients', 'emails', 'email_suppressions'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select_own', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()))', t || '_select_own', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert_own', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()))', t || '_insert_own', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['campaigns', 'campaign_recipients', 'emails'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update_own', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()))', t || '_update_own', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['campaigns', 'emails', 'email_suppressions'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete_own', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()))', t || '_delete_own', t);
  END LOOP;
END $$;

-- ---------- Send-state functions (service role only) ----------

-- Marks a campaign completed once nobody in it can still receive an email.
CREATE OR REPLACE FUNCTION public.refresh_campaign_status(p_campaign_id uuid)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE public.campaigns c
  SET status = 'completed'
  WHERE c.id = p_campaign_id
    AND c.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM public.campaign_recipients r
      WHERE r.campaign_id = c.id AND r.status IN ('active', 'paused')
    );
$$;

-- Claims up to p_limit due emails. A claimed recipient is "leased" (pushed 30
-- minutes ahead) so overlapping cron runs can't double-send and a crashed run
-- retries automatically. Enforces, per user: a daily send cap and the plan's
-- monthly limit_email_sent (NULL = unlimited).
CREATE OR REPLACE FUNCTION public.claim_due_recipients(p_limit integer DEFAULT 15, p_daily_cap integer DEFAULT 40)
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
  sender_name text
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
         l.unsubscribe_token, c.mailing_address, c.sender_name
  FROM leased l
  JOIN public.campaigns c ON c.id = l.campaign_id
  JOIN public.emails e ON e.recipient_id = l.id AND e.step = l.current_step AND e.status = 'scheduled';
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_recipient_send(p_recipient_id uuid, p_email_id uuid, p_message_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_campaign uuid;
  v_marked integer;
BEGIN
  UPDATE public.emails
  SET status = 'sent', sent_at = now(), provider_message_id = p_message_id, error = NULL
  WHERE id = p_email_id AND status = 'scheduled'
  RETURNING user_id, campaign_id INTO v_user, v_campaign;

  GET DIAGNOSTICS v_marked = ROW_COUNT;
  IF v_marked = 0 THEN
    RETURN; -- already recorded; safe to call twice
  END IF;

  INSERT INTO public.usage (user_id, feature_key, used_quantity) VALUES (v_user, 'email_sent', 1);

  UPDATE public.campaign_recipients r
  SET current_step = CASE WHEN r.current_step >= r.total_steps THEN r.current_step ELSE r.current_step + 1 END,
      status = CASE WHEN r.current_step >= r.total_steps THEN 'completed' ELSE r.status END,
      next_send_at = CASE WHEN r.current_step >= r.total_steps THEN NULL
                          ELSE now() + (SELECT c.gap_days FROM public.campaigns c WHERE c.id = r.campaign_id) * interval '1 day' END,
      attempts = 0,
      last_error = NULL,
      updated_at = now()
  WHERE r.id = p_recipient_id AND r.status = 'active';

  PERFORM public.refresh_campaign_status(v_campaign);
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_recipient_send(p_recipient_id uuid, p_email_id uuid, p_error text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts smallint;
  v_campaign uuid;
BEGIN
  UPDATE public.campaign_recipients r
  SET attempts = r.attempts + 1,
      last_error = left(p_error, 500),
      status = CASE WHEN r.attempts + 1 >= 3 THEN 'failed' ELSE r.status END,
      next_send_at = CASE WHEN r.attempts + 1 >= 3 THEN NULL
                          ELSE now() + (r.attempts + 1) * interval '1 hour' END,
      updated_at = now()
  WHERE r.id = p_recipient_id AND r.status = 'active'
  RETURNING r.attempts, r.campaign_id INTO v_attempts, v_campaign;

  IF v_attempts IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.emails
  SET error = left(p_error, 500),
      status = CASE WHEN v_attempts >= 3 THEN 'failed' ELSE status END
  WHERE id = p_email_id AND status = 'scheduled';

  PERFORM public.refresh_campaign_status(v_campaign);
END;
$$;

-- One click stops EVERY active sequence to that address for that account and
-- adds it to the do-not-email list.
CREATE OR REPLACE FUNCTION public.unsubscribe_recipient(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_email text;
  v_campaign uuid;
  v_ids uuid[];
BEGIN
  SELECT r.user_id, r.email INTO v_user, v_email
  FROM public.campaign_recipients r WHERE r.unsubscribe_token = p_token;
  IF v_user IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.email_suppressions (user_id, email, reason)
  VALUES (v_user, lower(v_email), 'unsubscribed')
  ON CONFLICT (user_id, lower(email)) DO NOTHING;

  SELECT array_agg(r.id) INTO v_ids
  FROM public.campaign_recipients r
  WHERE r.user_id = v_user AND lower(r.email) = lower(v_email) AND r.status IN ('active', 'paused');

  IF v_ids IS NOT NULL THEN
    UPDATE public.emails SET status = 'cancelled'
    WHERE recipient_id = ANY (v_ids) AND status IN ('scheduled', 'draft');

    UPDATE public.campaign_recipients
    SET status = 'unsubscribed', next_send_at = NULL, updated_at = now()
    WHERE id = ANY (v_ids);

    FOR v_campaign IN SELECT DISTINCT r.campaign_id FROM public.campaign_recipients r WHERE r.id = ANY (v_ids) LOOP
      PERFORM public.refresh_campaign_status(v_campaign);
    END LOOP;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_campaign_status(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_due_recipients(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_recipient_send(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_recipient_send(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.unsubscribe_recipient(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_campaign_status(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_due_recipients(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_recipient_send(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_recipient_send(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.unsubscribe_recipient(uuid) TO service_role;

-- ---------- The automation card ----------
-- Metered by the plan's limit_email_sent (one usage row per email), not credits.
INSERT INTO public.automation_catalog (key, name, description, credit_cost, slot_required, is_active, trial_eligible)
VALUES (
  'email_sequence_send',
  'FollowFlow',
  'Sends your 4-email sequences from your own connected mailbox, one every few days, and stops for anyone who unsubscribes.',
  0, 1, true, false
)
ON CONFLICT (key) DO NOTHING;

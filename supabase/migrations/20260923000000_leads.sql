-- Real leads table. Replaces the Leads page's hardcoded mock rows.
-- Three sources feed it: inbound callers (written by the voice agent's
-- service-role client at hangup), LeadReach results (pushed by the user with
-- one button), and manual adds. Idempotent -- safe to re-run.

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL CHECK (source IN ('inbound_call', 'leadreach', 'manual')),
  name text,
  phone text,
  email text,
  company text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'won', 'lost')),
  -- NULL = no consent on file. Outbound contact must stay blocked while NULL.
  consent_source text,
  -- Last call that touched this lead (call_transcripts.call_id). Also makes
  -- record_inbound_lead idempotent: the same call can never count twice.
  source_call_id text,
  call_count integer NOT NULL DEFAULT 0,
  last_contact_at timestamp with time zone,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- One lead per phone number per account: a repeat caller updates their row.
CREATE UNIQUE INDEX IF NOT EXISTS leads_user_phone_unique
  ON public.leads (user_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_user_created
  ON public.leads (user_id, created_at DESC);

-- rls_auto_enable turns RLS on with ZERO policies for new tables, which
-- would silently hide every row from real users -- so policies are explicit.
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

DROP POLICY IF EXISTS leads_select_own ON public.leads;
CREATE POLICY leads_select_own ON public.leads
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS leads_insert_own ON public.leads;
CREATE POLICY leads_insert_own ON public.leads
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS leads_update_own ON public.leads;
CREATE POLICY leads_update_own ON public.leads
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS leads_delete_own ON public.leads;
CREATE POLICY leads_delete_own ON public.leads
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- Called by the voice agent (service role) when a call ends with a real caller.
-- Insert-or-bump in one atomic statement; a repeat of the same call_id is a no-op.
-- A caller who phones in has given a documented reason to be called back, so an
-- existing lead with no consent on file gets 'Inbound call' (never overwritten
-- if a consent source is already set).
CREATE OR REPLACE FUNCTION public.record_inbound_lead(
  p_user_id uuid,
  p_phone text,
  p_call_id text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.leads
    (user_id, source, phone, consent_source, source_call_id, call_count, last_contact_at)
  VALUES
    (p_user_id, 'inbound_call', p_phone, 'Inbound call', p_call_id, 1, now())
  ON CONFLICT (user_id, phone) WHERE phone IS NOT NULL
  DO UPDATE SET
    call_count = public.leads.call_count + 1,
    last_contact_at = now(),
    source_call_id = EXCLUDED.source_call_id,
    consent_source = COALESCE(public.leads.consent_source, 'Inbound call'),
    updated_at = now()
  WHERE public.leads.source_call_id IS DISTINCT FROM EXCLUDED.source_call_id
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_inbound_lead(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_inbound_lead(uuid, text, text) TO service_role;

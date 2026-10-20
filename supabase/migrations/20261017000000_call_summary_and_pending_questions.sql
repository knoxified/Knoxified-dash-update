-- Call summary + outcome, and the "Questions waiting" queue.
-- Already run manually in Supabase on 2026-10-17; saved here so the repo matches the database.

ALTER TABLE public.call_transcripts
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS outcome text
    CHECK (outcome IN ('booked', 'answered', 'escalated', 'abandoned'));

CREATE INDEX IF NOT EXISTS idx_call_transcripts_user_outcome
  ON public.call_transcripts (user_id, outcome);

CREATE TABLE IF NOT EXISTS public.pending_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question text NOT NULL,
  question_key text NOT NULL,
  asked_count integer NOT NULL DEFAULT 1,
  last_call_id text,
  last_caller_number text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'answered', 'dismissed')),
  answer text,
  owner_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_asked_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz,
  CONSTRAINT pending_questions_pkey PRIMARY KEY (id),
  CONSTRAINT pending_questions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_questions_open
  ON public.pending_questions (user_id, question_key)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_pending_questions_user_status
  ON public.pending_questions (user_id, status, last_asked_at DESC);

ALTER TABLE public.pending_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own pending questions" ON public.pending_questions;
CREATE POLICY "Users can read their own pending questions"
  ON public.pending_questions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can answer their own pending questions" ON public.pending_questions;
CREATE POLICY "Users can answer their own pending questions"
  ON public.pending_questions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.log_pending_question(
  p_user_id uuid,
  p_question text,
  p_question_key text,
  p_call_id text,
  p_caller_number text
)
RETURNS TABLE (id uuid, is_new boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.pending_questions
    (user_id, question, question_key, last_call_id, last_caller_number)
  VALUES
    (p_user_id, p_question, p_question_key, p_call_id, p_caller_number)
  ON CONFLICT (user_id, question_key) WHERE status = 'open'
  DO UPDATE SET
    asked_count = public.pending_questions.asked_count + 1,
    last_call_id = EXCLUDED.last_call_id,
    last_caller_number = EXCLUDED.last_caller_number,
    last_asked_at = now()
  RETURNING public.pending_questions.id INTO v_id;

  RETURN QUERY
    SELECT v_id,
           (SELECT asked_count = 1 FROM public.pending_questions WHERE public.pending_questions.id = v_id);
END;
$$;

REVOKE ALL ON FUNCTION public.log_pending_question FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_pending_question TO service_role;

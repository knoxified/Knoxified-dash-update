-- Call transcript persistence
-- Stores the full conversation for each call handled by voice-agent-beta,
-- so the dashboard's Conversations Log can show real data instead of mock data.

CREATE TABLE public.call_transcripts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  call_id text NOT NULL,
  caller_number text,
  provider text,
  duration_secs integer NOT NULL DEFAULT 0,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT call_transcripts_pkey PRIMARY KEY (id),
  CONSTRAINT call_transcripts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE INDEX idx_call_transcripts_user_id ON public.call_transcripts (user_id);
CREATE INDEX idx_call_transcripts_created_at ON public.call_transcripts (created_at DESC);

-- This project's rls_auto_enable event trigger enables RLS on every new table
-- automatically, with zero policies by default (== deny all to non-bypassing
-- roles). voice-agent-beta writes with the service role key, which bypasses
-- RLS regardless — but the dashboard reads as the logged-in user via the anon
-- key, which does not. Without this policy, every read would silently return
-- zero rows instead of a user's actual transcripts.
ALTER TABLE public.call_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own call transcripts"
  ON public.call_transcripts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

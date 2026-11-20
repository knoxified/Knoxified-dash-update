-- AI disclosure toggle: owner-controlled, OFF by default (mirrors call_recording_enabled).
-- When on, the agent's opening line says it is an AI agent. Run this BEFORE deploying the
-- matching voice-agent-beta change (the worker tolerates the column being absent, but the
-- dashboard toggle will not save until it exists).
ALTER TABLE public.agent_configs
  ADD COLUMN IF NOT EXISTS ai_disclosure_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.agent_configs.ai_disclosure_enabled IS
  'When true the greeting tells callers they are speaking with an AI agent. Default false; the dashboard warns it should normally be on.';

-- Lets the OAuth callback redirect users back to whatever dashboard page they
-- started the connection from (e.g. /integrations, /calendar-settings),
-- instead of a single fixed destination.

ALTER TABLE public.oauth_sessions
  ADD COLUMN return_path text NOT NULL DEFAULT '/integrations';

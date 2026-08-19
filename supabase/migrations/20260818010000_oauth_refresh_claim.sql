-- A real, cross-instance-safe lock for Google token refresh, replacing
-- reliance on in-memory state (which only ever protected concurrent
-- requests landing on the exact same server process/isolate -- not
-- guaranteed on any serverless/edge platform, including Cloudflare
-- Workers, Vercel, or Netlify's default functions).
--
-- The pattern: an atomic conditional UPDATE claims the right to refresh.
-- Only one concurrent caller's UPDATE can match the WHERE clause, because
-- as soon as the first one commits, refresh_claimed_until is in the
-- future, so a second concurrent UPDATE's condition (claimed_until is
-- null OR in the past) no longer matches. This works correctly regardless
-- of how many separate processes/isolates/instances are making the
-- request -- the database is the single source of truth, not any one
-- server's memory.

ALTER TABLE public.oauth_connections
  ADD COLUMN refresh_claimed_until timestamptz;

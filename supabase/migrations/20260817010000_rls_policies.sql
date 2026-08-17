-- Fixes tables where RLS is enabled (automatically, via the rls_auto_enable
-- event trigger on every CREATE TABLE) but no policy was ever added.
-- RLS-enabled + zero policies means deny-all to any role that doesn't
-- bypass RLS -- which includes the dashboard's normal per-user session
-- (anon key + authenticated role). Every one of these tables was silently
-- returning zero rows / rejecting writes for real logged-in users, even
-- though the application code querying them was correct.
--
-- Policies below are scoped to exactly what the dashboard code actually
-- does against each table today (checked against lib/actions/*.ts and
-- app/(dashboard)/**/*.tsx) -- not blanket read/write access.
--
-- Intentionally NOT given a policy here:
--   provider_configs  - holds real OAuth client secrets; should only ever
--                        be reachable via the service role (which bypasses
--                        RLS), never a regular user's session.
--   oauth_connections - not referenced by any code yet; nothing to scope
--                        a policy to. Add one when this gets built.

-- audit_logs: users can view and append to their own audit trail
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- automation_catalog: shared reference data (no user_id column) -- every
-- authenticated user can read the full catalog. Managed by the backend,
-- so no write policy.
CREATE POLICY "Authenticated users can view the automation catalog"
  ON public.automation_catalog FOR SELECT TO authenticated
  USING (true);

-- automation_runs: users view their own run history. Runs are inserted by
-- the backend automation runner (service role), not the dashboard client.
CREATE POLICY "Users can view their own automation runs"
  ON public.automation_runs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- automation_schedules: users manage their own scheduled automations
CREATE POLICY "Users can view their own automation schedules"
  ON public.automation_schedules FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own automation schedules"
  ON public.automation_schedules FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own automation schedules"
  ON public.automation_schedules FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- call_schedules: same shape as automation_schedules
CREATE POLICY "Users can view their own call schedules"
  ON public.call_schedules FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own call schedules"
  ON public.call_schedules FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own call schedules"
  ON public.call_schedules FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- integrations: users view their own connected integrations. Dashboard
-- doesn't currently write to this table, only reads -- no write policy yet.
CREATE POLICY "Users can view their own integrations"
  ON public.integrations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- oauth_sessions: users create their own OAuth state token, then it gets
-- looked up and marked used() during the callback.
CREATE POLICY "Users can view their own oauth sessions"
  ON public.oauth_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own oauth sessions"
  ON public.oauth_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own oauth sessions"
  ON public.oauth_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- phone_number_mappings: users view their own assigned number. Numbers are
-- provisioned by the backend (service role), not inserted from the client.
CREATE POLICY "Users can view their own phone number mappings"
  ON public.phone_number_mappings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- suppression_list: users manage their own do-not-call list
CREATE POLICY "Users can view their own suppression list"
  ON public.suppression_list FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their own suppression list"
  ON public.suppression_list FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from their own suppression list"
  ON public.suppression_list FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- user_automations: users manage which automations they have enabled
CREATE POLICY "Users can view their own automations"
  ON public.user_automations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can enable automations for themselves"
  ON public.user_automations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own automation settings"
  ON public.user_automations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_voice_settings: users manage their own voice agent persona/greeting
CREATE POLICY "Users can view their own voice settings"
  ON public.user_voice_settings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own voice settings"
  ON public.user_voice_settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own voice settings"
  ON public.user_voice_settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- voice_usage: users view their own usage history. Writes only ever come
-- from voice-agent-beta via the service role (deduct_voice_minutes()),
-- which bypasses RLS -- no write policy needed here.
CREATE POLICY "Users can view their own voice usage"
  ON public.voice_usage FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

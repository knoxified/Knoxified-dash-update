-- Every call is logged on the Leads page, including web calls and dashboard previews
-- (they have no caller phone number, so they used to be skipped entirely).
-- Also stores time spent on the call and any follow-up the caller asked for.
-- Safe to re-run.

alter table public.leads
  add column if not exists last_call_seconds integer,
  add column if not exists total_call_seconds integer not null default 0,
  add column if not exists follow_up_requested boolean not null default false,
  add column if not exists follow_up_note text,
  add column if not exists callback_phone text;

-- Allow 'web_call' as a lead source, whatever the old check constraint was called.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.leads'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%inbound_call%'
  loop
    execute format('alter table public.leads drop constraint %I', c.conname);
  end loop;
  alter table public.leads add constraint leads_source_check
    check (source in ('inbound_call', 'leadreach', 'manual', 'web_call'));
end $$;

-- One lead row per web call, so the same call can never be logged twice.
create unique index if not exists leads_user_webcall_unique
  on public.leads (user_id, source_call_id) where source = 'web_call';

-- Called by the voice agent (service role) when any call ends with someone who spoke.
-- Phone calls: one lead per number, bumped on repeat calls (same as record_inbound_lead,
-- plus call time). Web calls (no phone): one new lead per call. Returns the lead id.
create or replace function public.record_call_lead(
  p_user_id uuid,
  p_phone text,
  p_call_id text,
  p_seconds integer,
  p_preview boolean default false,
  p_system text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_phone is not null then
    insert into public.leads
      (user_id, source, phone, consent_source, source_call_id, call_count, last_contact_at,
       last_call_seconds, total_call_seconds)
    values
      (p_user_id, 'inbound_call', p_phone, 'Inbound call', p_call_id, 1, now(),
       p_seconds, coalesce(p_seconds, 0))
    on conflict (user_id, phone) where phone is not null
    do update set
      call_count = public.leads.call_count + 1,
      last_contact_at = now(),
      source_call_id = excluded.source_call_id,
      last_call_seconds = excluded.last_call_seconds,
      total_call_seconds = public.leads.total_call_seconds + coalesce(excluded.last_call_seconds, 0),
      consent_source = coalesce(public.leads.consent_source, 'Inbound call'),
      updated_at = now()
    where public.leads.source_call_id is distinct from excluded.source_call_id
    returning id into v_id;

    if v_id is null then
      select id into v_id from public.leads where user_id = p_user_id and phone = p_phone;
    end if;
  else
    insert into public.leads
      (user_id, source, phone, consent_source, source_call_id, call_count, last_contact_at,
       last_call_seconds, total_call_seconds, raw)
    values
      (p_user_id, 'web_call', null, 'Web call', p_call_id, 1, now(),
       p_seconds, coalesce(p_seconds, 0),
       jsonb_build_object('preview', coalesce(p_preview, false), 'system', p_system))
    on conflict (user_id, source_call_id) where source = 'web_call'
    do nothing
    returning id into v_id;

    if v_id is null then
      select id into v_id from public.leads
      where user_id = p_user_id and source = 'web_call' and source_call_id = p_call_id;
    end if;
  end if;

  return v_id;
end;
$$;

revoke all on function public.record_call_lead(uuid, text, text, integer, boolean, text)
  from public, anon, authenticated;

-- Affiliate self-serve onboarding: invite codes, signed agreements (with independent timestamp),
-- email login codes, payout details, notifications. Safe to re-run. Service-role access only.

-- Extensions for automatic emails (database -> portal) and scheduled jobs. If either cannot be created here,
-- enable it in Supabase under Database > Extensions and run this file again.
do $$ begin create extension if not exists pg_net; exception when others then raise notice 'Enable pg_net in Database > Extensions'; end $$;
do $$ begin create extension if not exists pg_cron; exception when others then raise notice 'Enable pg_cron in Database > Extensions'; end $$;

create table if not exists public.portal_settings (
  key text primary key, value jsonb not null, updated_at timestamptz not null default now());

create table if not exists public.partner_invites (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  code_hint text,
  label text,
  commission_rate numeric not null default 30 check (commission_rate between 0 and 100),
  commission_rate_year2 numeric not null default 20 check (commission_rate_year2 between 0 and 100),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_partner_id uuid references public.partners(id),
  revoked_at timestamptz);

create table if not exists public.partner_agreements (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id),
  terms_version text not null,
  terms_sha256 text not null,
  record_html text not null,
  record_json jsonb not null,
  record_sha256 text not null,
  signer_name text not null,
  signer_email text not null,
  signer_ip text,
  signer_user_agent text,
  email_verified_at timestamptz not null,
  signed_at timestamptz not null default now(),
  tsa_status text not null default 'pending' check (tsa_status in ('pending','stamped','failed')),
  tsa_url text,
  tsa_token_b64 text,
  tsa_stamped_at timestamptz,
  created_at timestamptz not null default now());
create index if not exists partner_agreements_partner_idx on public.partner_agreements (partner_id);

create or replace function public.partner_agreements_guard()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then raise exception 'Signed agreements cannot be deleted'; end if;
  if (new.partner_id, new.terms_version, new.terms_sha256, new.record_html, new.record_json, new.record_sha256,
      new.signer_name, new.signer_email, new.signer_ip, new.signer_user_agent, new.email_verified_at, new.signed_at, new.created_at)
     is distinct from
     (old.partner_id, old.terms_version, old.terms_sha256, old.record_html, old.record_json, old.record_sha256,
      old.signer_name, old.signer_email, old.signer_ip, old.signer_user_agent, old.email_verified_at, old.signed_at, old.created_at) then
    raise exception 'Signed agreements are immutable';
  end if;
  if old.tsa_status = 'stamped' and (new.tsa_status, new.tsa_url, new.tsa_token_b64, new.tsa_stamped_at)
     is distinct from (old.tsa_status, old.tsa_url, old.tsa_token_b64, old.tsa_stamped_at) then
    raise exception 'A stamped agreement cannot be re-stamped';
  end if;
  return new;
end $$;
drop trigger if exists partner_agreements_guard on public.partner_agreements;
create trigger partner_agreements_guard before update or delete on public.partner_agreements
  for each row execute function public.partner_agreements_guard();

create table if not exists public.partner_payout_details (
  partner_id uuid primary key references public.partners(id),
  currency text not null default 'USD',
  method text not null default 'bank_transfer',
  country text,
  hint text,
  ciphertext text not null,
  updated_at timestamptz not null default now(),
  previous_updated_at timestamptz);

create table if not exists public.portal_login_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null, purpose text not null check (purpose in ('login','join')),
  code_hash text not null, attempts int not null default 0,
  expires_at timestamptz not null, used_at timestamptz, created_at timestamptz not null default now());
create index if not exists portal_login_codes_lookup on public.portal_login_codes (email, purpose, created_at desc);

create table if not exists public.portal_rate_limits (
  key text not null, window_start timestamptz not null, count int not null default 1,
  primary key (key, window_start));

create table if not exists public.partner_notifications (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id),
  kind text not null, ref text not null default '',
  sent_at timestamptz not null default now(),
  unique (partner_id, kind, ref));

alter table public.portal_settings enable row level security;
alter table public.partner_invites enable row level security;
alter table public.partner_agreements enable row level security;
alter table public.partner_payout_details enable row level security;
alter table public.portal_login_codes enable row level security;
alter table public.portal_rate_limits enable row level security;
alter table public.partner_notifications enable row level security;
revoke all on public.portal_settings, public.partner_invites, public.partner_agreements, public.partner_payout_details,
  public.portal_login_codes, public.portal_rate_limits, public.partner_notifications from anon, authenticated;

-- Fixed-window rate limiter: returns false once p_limit is exceeded in the window.
create or replace function public.portal_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_window timestamptz; v_count int;
begin
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.portal_rate_limits (key, window_start, count) values (p_key, v_window, 1)
  on conflict (key, window_start) do update set count = public.portal_rate_limits.count + 1
  returning count into v_count;
  if random() < 0.02 then delete from public.portal_rate_limits where window_start < now() - interval '2 days'; end if;
  return v_count <= p_limit;
end $$;

create or replace function public.portal_check_invite(p_code_hash text)
returns table (invite_id uuid, commission_rate numeric, commission_rate_year2 numeric, label text)
language sql stable security definer set search_path = public as $$
  select id, commission_rate, commission_rate_year2, label from public.partner_invites
   where code_hash = p_code_hash and used_at is null and revoked_at is null and expires_at > now();
$$;

create or replace function public.portal_create_invite(
  p_code_hash text, p_hint text, p_label text, p_rate numeric, p_rate2 numeric, p_days int)
returns uuid language sql security definer set search_path = public as $$
  insert into public.partner_invites (code_hash, code_hint, label, commission_rate, commission_rate_year2, expires_at)
  values (p_code_hash, p_hint, nullif(trim(p_label), ''), p_rate, p_rate2, now() + make_interval(days => p_days))
  returning id;
$$;

create or replace function public.portal_suggest_ref_code(p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare v_base text; v_code text; v_n int := 1;
begin
  v_base := trim(both '-' from regexp_replace(lower(coalesce(p_name, '')), '[^a-z0-9_-]+', '-', 'g'));
  if length(v_base) < 3 then v_base := trim(both '-' from v_base || '-partner'); end if;
  v_base := left(v_base, 34); v_code := v_base;
  while exists (select 1 from public.partners x where x.ref_code = v_code) loop
    v_n := v_n + 1; v_code := v_base || '-' || v_n;
  end loop;
  return v_code;
end $$;

create or replace function public.portal_find_auth_user(p_email text)
returns uuid language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

create or replace function public.portal_login_allowed(p_email text)
returns table (user_id uuid, role text, partner_id uuid)
language sql stable security definer set search_path = public, auth as $$
  select u.id,
         case when a.user_id is not null then 'admin' else 'partner' end,
         m.partner_id
    from auth.users u
    left join public.portal_admins a on a.user_id = u.id
    left join public.partner_members m on m.user_id = u.id
   where lower(u.email) = lower(p_email) and (a.user_id is not null or m.user_id is not null)
   limit 1;
$$;

create or replace function public.portal_store_code(p_email text, p_purpose text, p_code_hash text, p_ttl_seconds int)
returns void language sql security definer set search_path = public as $$
  update public.portal_login_codes set used_at = now()
   where lower(email) = lower(p_email) and purpose = p_purpose and used_at is null;
  insert into public.portal_login_codes (email, purpose, code_hash, expires_at)
  values (lower(p_email), p_purpose, p_code_hash, now() + make_interval(secs => p_ttl_seconds));
$$;

create or replace function public.portal_verify_code(p_email text, p_purpose text, p_code_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
declare r public.portal_login_codes%rowtype;
begin
  select * into r from public.portal_login_codes
   where lower(email) = lower(p_email) and purpose = p_purpose and used_at is null and expires_at > now()
   order by created_at desc limit 1 for update;
  if not found then return false; end if;
  if r.attempts >= 5 then return false; end if;
  if r.code_hash = p_code_hash then
    update public.portal_login_codes set used_at = now() where id = r.id;
    return true;
  end if;
  update public.portal_login_codes set attempts = attempts + 1 where id = r.id;
  return false;
end $$;

-- Atomic onboarding: validates and consumes the invite, creates the partner, links the login, stores the agreement.
create or replace function public.portal_onboard_partner(
  p_invite_id uuid, p_partner_id uuid, p_user_id uuid, p_name text, p_company text, p_email text, p_ref_code text,
  p_terms_version text, p_terms_sha text, p_record_html text, p_record_json jsonb, p_record_sha text,
  p_ip text, p_ua text, p_email_verified_at timestamptz)
returns table (out_partner_id uuid, out_ref_code text)
language plpgsql security definer set search_path = public as $$
declare inv public.partner_invites%rowtype;
begin
  select * into inv from public.partner_invites where id = p_invite_id for update;
  if not found or inv.used_at is not null or inv.revoked_at is not null or inv.expires_at <= now() then
    raise exception 'This invitation code is no longer valid';
  end if;
  if exists (select 1 from public.partners where lower(email) = lower(p_email) and status <> 'terminated') then
    raise exception 'An affiliate with this email already exists. Please log in instead';
  end if;

  insert into public.partners (id, name, company, email, ref_code, commission_rate, commission_rate_year2, status, agreement_signed_at)
  values (p_partner_id, trim(p_name), nullif(trim(p_company), ''), lower(trim(p_email)), p_ref_code,
          inv.commission_rate, inv.commission_rate_year2, 'active', now());

  insert into public.partner_members (user_id, partner_id) values (p_user_id, p_partner_id)
  on conflict (user_id) do update set partner_id = excluded.partner_id;

  insert into public.partner_agreements
    (partner_id, terms_version, terms_sha256, record_html, record_json, record_sha256, signer_name, signer_email,
     signer_ip, signer_user_agent, email_verified_at)
  values (p_partner_id, p_terms_version, p_terms_sha, p_record_html, p_record_json, p_record_sha, trim(p_name), lower(trim(p_email)),
          p_ip, p_ua, p_email_verified_at);

  update public.partner_invites set used_at = now(), used_partner_id = p_partner_id where id = inv.id;
  return query select p_partner_id, p_ref_code;
end $$;

-- What will be payable on a given payout date (hold passed by then). Admin payout run uses this.
create or replace function public.portal_payouts_due(p_payout_date date)
returns table (partner_id uuid, name text, email text, currency text, amount numeric, payments bigint, oldest_payment timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.email, coalesce(c.currency, 'USD'), round(sum(c.commission_amount), 2),
         count(*) filter (where c.kind = 'commission'), min(c.paid_at)
    from public.partner_commissions c join public.partners p on p.id = c.partner_id
   where c.status = 'pending' and c.hold_until < (p_payout_date + 1)
   group by p.id, p.name, p.email, coalesce(c.currency, 'USD')
   having sum(c.commission_amount) > 0
   order by p.name;
$$;

-- Event emails: database -> portal worker (pg_net). Never allowed to break signups or payments.
create or replace function public.portal_notify(p_event text, p_payload jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_url text; v_secret text;
begin
  select value #>> '{}' into v_url from public.portal_settings where key = 'notify_url';
  select value #>> '{}' into v_secret from public.portal_settings where key = 'notify_secret';
  if v_url is null or v_secret is null then return; end if;
  execute 'select net.http_post(url := $1, headers := $2, body := $3)'
    using v_url || '/' || p_event,
          jsonb_build_object('Content-Type', 'application/json', 'x-portal-secret', v_secret),
          p_payload;
exception when others then
  null;
end $$;

create or replace function public.partner_leads_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('signed_up', 'paid') and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    perform public.portal_notify('lead', jsonb_build_object('partner_id', new.partner_id, 'user_id', new.user_id, 'status', new.status, 'lead_id', new.id));
  end if;
  return new;
exception when others then return new;
end $$;
drop trigger if exists partner_leads_notify on public.partner_leads;
create trigger partner_leads_notify after insert or update on public.partner_leads
  for each row execute function public.partner_leads_notify();

create or replace function public.partner_commissions_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'commission' and new.status = 'pending' then
    perform public.portal_notify('commission', jsonb_build_object('partner_id', new.partner_id, 'commission_id', new.id));
  end if;
  return new;
exception when others then return new;
end $$;
drop trigger if exists partner_commissions_notify on public.partner_commissions;
create trigger partner_commissions_notify after insert on public.partner_commissions
  for each row execute function public.partner_commissions_notify();

do $$
begin
  perform cron.schedule('portal-weekly-digest', '0 8 * * 1', $c$select public.portal_notify('digest', '{}'::jsonb)$c$);
  perform cron.schedule('portal-timestamp-retry', '30 3 * * *', $c$select public.portal_notify('timestamps', '{}'::jsonb)$c$);
exception when others then
  raise notice 'pg_cron is not enabled; weekly digest and timestamp retries will not run automatically';
end $$;

-- Revoke direct execution of every portal function from app roles; the portal worker uses the service role.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname like 'portal\_%' escape '\' and p.proname <> 'portal_payout_date' loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;

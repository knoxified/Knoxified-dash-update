-- Partner referrals: lead log, bonus ledger, affiliate rate plans (all plans),
-- effective limits, and attribution in the signup trigger. Safe to re-run.

-- 1) Columns and indexes
alter table public.users
  add column if not exists discount_offer_expires_at timestamptz,
  add column if not exists discount_offer_claimed_at timestamptz,
  add column if not exists discount_offer_forfeited boolean not null default false;

alter table public.plans
  add column if not exists affiliate_rate_of uuid references public.plans(id);

create index if not exists plans_affiliate_rate_of_idx
  on public.plans (affiliate_rate_of) where affiliate_rate_of is not null;

create unique index if not exists partners_ref_code_key on public.partners (ref_code);

-- 2) Lead log and bonus ledger
create table if not exists public.partner_leads (
  id            uuid primary key default gen_random_uuid(),
  partner_id    uuid not null references public.partners(id),
  visitor_id    text not null,
  landing_path  text,
  utm           jsonb not null default '{}'::jsonb,
  status        text not null default 'visited' check (status in ('visited','signed_up','paid')),
  user_id       uuid references public.users(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  signed_up_at  timestamptz,
  paid_at       timestamptz,
  unique (partner_id, visitor_id)
);
create index if not exists partner_leads_partner_status_idx on public.partner_leads (partner_id, status);
create index if not exists partner_leads_user_idx on public.partner_leads (user_id);
alter table public.partner_leads enable row level security; -- no policies: service role only

create table if not exists public.bonus_grants (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  partner_id uuid references public.partners(id),
  kind       text not null check (kind in ('voice_minutes','automation_credits')),
  amount     integer not null check (amount > 0),
  source     text not null default 'partner_referral',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (user_id, kind, source)
);
create index if not exists bonus_grants_user_idx on public.bonus_grants (user_id, expires_at);
alter table public.bonus_grants enable row level security;
drop policy if exists bonus_grants_select_own on public.bonus_grants;
create policy bonus_grants_select_own on public.bonus_grants for select using (user_id = auth.uid());

-- 3) Affiliate rate plans: rename the existing one, link it to its base plan,
--    and create a matching variant for every other paid recurring plan using
--    the same discount ratio. Variants copy every column of their base plan.
do $$
declare
  v_old   uuid;
  v_ids   uuid[];
  v_base  public.plans%rowtype;
  v_ratio numeric;
  v_row   public.plans%rowtype;
begin
  select id into v_old from public.plans where name = 'Pro Founding Rate';
  if v_old is not null then
    select array_agg(b.id) into v_ids from public.plans b
     where b.name ilike 'Pro%' and b.name not ilike '%founding%' and b.name not ilike 'Affiliate%'
       and b.billing_interval = 'month' and b.affiliate_rate_of is null and b.is_active;
    if coalesce(array_length(v_ids, 1), 0) <> 1 then
      raise exception 'Expected exactly one active monthly Pro plan to link Pro Founding Rate to, found %', coalesce(array_length(v_ids, 1), 0);
    end if;
    select * into v_base from public.plans where id = v_ids[1];
    update public.plans
       set name = 'Affiliate Discount Rate - ' || v_base.name,
           affiliate_rate_of = v_base.id,
           is_active = false
     where id = v_old;
  end if;

  select a.price / b.price into v_ratio
    from public.plans a join public.plans b on b.id = a.affiliate_rate_of
   where a.price > 0 and b.price > 0 limit 1;
  if v_ratio is null then
    raise notice 'No existing affiliate rate to take a ratio from; no variants created.';
    return;
  end if;

  for v_row in
    select * from public.plans b
     where b.is_active and b.affiliate_rate_of is null and coalesce(b.price, 0) > 0
       and coalesce(b.price_type, 'recurring') = 'recurring'
       and b.name not ilike '%trial%' and b.name <> 'Custom'
       and not exists (select 1 from public.plans x where x.affiliate_rate_of = b.id)
  loop
    insert into public.plans
    select (jsonb_populate_record(null::public.plans, to_jsonb(v_row) || jsonb_build_object(
      'id', gen_random_uuid(),
      'name', 'Affiliate Discount Rate - ' || v_row.name,
      'price', round(v_row.price * v_ratio, 2),
      'flutterwave_plan_id', null,
      'flutterwave_plan_token', null,
      'paddle_price_id', null,
      'affiliate_rate_of', v_row.id,
      'is_active', false))).*;
  end loop;
end $$;

-- 4) Bonus grant helper (50 minutes + 200 credits, 30 days)
create or replace function public.grant_partner_bonus(p_user_id uuid, p_partner_id uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.bonus_grants (user_id, partner_id, kind, amount, source, expires_at)
  values
    (p_user_id, p_partner_id, 'voice_minutes',      50,  'partner_referral', now() + interval '30 days'),
    (p_user_id, p_partner_id, 'automation_credits', 200, 'partner_referral', now() + interval '30 days')
  on conflict (user_id, kind, source) do nothing;
$$;
revoke all on function public.grant_partner_bonus(uuid, uuid) from public, anon, authenticated;

-- 5) Effective limits = plan limit + active bonus (0 stays 0, meaning unlimited)
create or replace function public.get_effective_limits(p_user_id uuid)
returns table (limit_voice_minutes integer, limit_credits integer, bonus_voice_minutes integer, bonus_credits integer)
language sql stable security definer set search_path = public as $$
  select
    case when coalesce(p.limit_voice_minutes, 0) = 0 then 0 else p.limit_voice_minutes + b.vm end,
    case when coalesce(p.limit_credits, 0) = 0 then 0 else p.limit_credits + b.cr end,
    b.vm, b.cr
  from public.users u
  join public.plans p on p.id = u.plan_id
  cross join lateral (
    select coalesce(sum(g.amount) filter (where g.kind = 'voice_minutes'), 0)::int as vm,
           coalesce(sum(g.amount) filter (where g.kind = 'automation_credits'), 0)::int as cr
      from public.bonus_grants g where g.user_id = u.id and g.expires_at > now()
  ) b
  where u.id = p_user_id and (auth.role() = 'service_role' or auth.uid() = p_user_id);
$$;
revoke all on function public.get_effective_limits(uuid) from public, anon;
grant execute on function public.get_effective_limits(uuid) to authenticated, service_role;

-- 6) Visit logging, callable from the marketing site (never raises)
create or replace function public.record_partner_visit(
  p_ref_code text, p_visitor_id text, p_landing_path text default null, p_utm jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_partner uuid;
begin
  if p_ref_code is null or p_ref_code !~ '^[a-z0-9_-]{3,40}$' then return; end if;
  if p_visitor_id is null or p_visitor_id !~ '^[A-Za-z0-9-]{8,64}$' then return; end if;
  select id into v_partner from public.partners where ref_code = p_ref_code and status = 'active';
  if v_partner is null then return; end if;
  insert into public.partner_leads (partner_id, visitor_id, landing_path, utm)
  values (v_partner, p_visitor_id, left(p_landing_path, 200),
          case when jsonb_typeof(p_utm) = 'object' and length(p_utm::text) < 1000 then p_utm else '{}'::jsonb end)
  on conflict (partner_id, visitor_id) do nothing;
exception when others then
  null;
end $$;
revoke all on function public.record_partner_visit(text, text, text, jsonb) from public;
grant execute on function public.record_partner_visit(text, text, text, jsonb) to anon, authenticated;

-- 7) Signup trigger: same user creation as before, plus referral attribution.
--    The referral block can never break account creation.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_ref text; v_partner uuid;
begin
  insert into public.users (id, email, paddle_customer_id, plan_id, status, trial_ends_at)
  values (new.id, new.email, null, (select id from public.plans where name = 'Trial Package'), 'ACTIVE', now() + interval '14 days');

  begin
    v_ref := lower(nullif(trim(new.raw_user_meta_data->>'ref_code'), ''));
    if v_ref is not null and v_ref ~ '^[a-z0-9_-]{3,40}$' then
      select id into v_partner from public.partners where ref_code = v_ref and status = 'active';
      if v_partner is not null then
        update public.users set referred_by_partner_id = v_partner where id = new.id;
        perform public.grant_partner_bonus(new.id, v_partner);
        insert into public.partner_leads (partner_id, visitor_id, status, user_id, signed_up_at)
        values (v_partner, coalesce(nullif(new.raw_user_meta_data->>'visitor_id', ''), 'signup-' || new.id::text), 'signed_up', new.id, now())
        on conflict (partner_id, visitor_id) do update
          set status = 'signed_up', user_id = excluded.user_id, signed_up_at = now()
          where public.partner_leads.status = 'visited';
      end if;
    end if;
  exception when others then
    raise warning 'referral attribution failed for %: %', new.id, sqlerrm;
  end;

  return new;
end $$;

-- Affiliate portal (separate worker): logins, scoped read functions. Safe to re-run.
-- The portal reads through these functions with the service role; affiliates never get
-- direct table access, and customer identity is masked (business name + location only).

create table if not exists public.portal_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.partner_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  partner_id uuid not null references public.partners(id),
  created_at timestamptz not null default now()
);
alter table public.portal_admins enable row level security;   -- no policies: service role only
alter table public.partner_members enable row level security;

-- Signup trigger: affiliate logins (created by the portal's invite link) are not customers,
-- so they get no trial account; they are linked to their partner instead.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_ref text; v_partner uuid; v_member_partner uuid;
begin
  if new.raw_user_meta_data->>'account_type' = 'partner' then
    begin
      v_member_partner := nullif(new.raw_user_meta_data->>'partner_id', '')::uuid;
      if v_member_partner is not null and exists (select 1 from public.partners where id = v_member_partner) then
        insert into public.partner_members (user_id, partner_id) values (new.id, v_member_partner)
        on conflict (user_id) do nothing;
      end if;
    exception when others then
      raise warning 'partner login link failed for %: %', new.id, sqlerrm;
    end;
    return new;
  end if;

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

-- Monthly payout date: the 15th. A payment's commission is paid on the first 15th on or after
-- its hold ends.
create or replace function public.portal_payout_date(p_ts timestamptz)
returns date language sql immutable as $$
  select case when extract(day from p_ts) <= 15
              then date_trunc('month', p_ts)::date + 14
              else (date_trunc('month', p_ts) + interval '1 month')::date + 14 end;
$$;

create or replace function public.portal_partner_list()
returns table (partner_id uuid, name text, company text, email text, ref_code text, status text,
               visits bigint, signups bigint, paying_customers bigint,
               in_hold numeric, payable_now numeric, paid_to_date numeric, voided numeric)
language sql stable security definer set search_path = public as $$
  select s.partner_id, s.name, p.company, p.email, s.ref_code, s.status,
         s.visits, s.signups, s.paying_customers, s.in_hold, s.payable_now, s.paid_to_date, s.voided
    from public.partner_summary s join public.partners p on p.id = s.partner_id
   order by s.name;
$$;

create or replace function public.portal_partner_detail(p_partner_id uuid)
returns table (partner_id uuid, name text, company text, email text, ref_code text, status text,
               year1_rate numeric, year2_rate numeric,
               visits bigint, signups bigint, paying_customers bigint,
               in_hold numeric, payable_now numeric, paid_to_date numeric, voided numeric,
               next_payout_date date, scheduled_amount numeric, scheduled_count bigint, currency text)
language sql stable security definer set search_path = public as $$
  select s.partner_id, s.name, p.company, p.email, s.ref_code, s.status, s.year1_rate, s.year2_rate,
         s.visits, s.signups, s.paying_customers, s.in_hold, s.payable_now, s.paid_to_date, s.voided,
         public.portal_payout_date(now()),
         coalesce((select sum(c.commission_amount) from public.partner_commissions c
                    where c.partner_id = s.partner_id and c.status = 'pending'
                      and c.hold_until < (public.portal_payout_date(now()) + 1)), 0),
         (select count(*) from public.partner_commissions c
           where c.partner_id = s.partner_id and c.status = 'pending' and c.kind = 'commission'
             and c.hold_until < (public.portal_payout_date(now()) + 1)),
         coalesce((select c.currency from public.partner_commissions c where c.partner_id = s.partner_id and c.currency is not null limit 1), 'USD')
    from public.partner_summary s join public.partners p on p.id = s.partner_id
   where s.partner_id = p_partner_id;
$$;

create or replace function public.portal_partner_customers(p_partner_id uuid)
returns table (customer_key text, business_name text, location text, plan_name text, status text,
               signed_up_at timestamptz, first_paid_at timestamptz, last_paid_at timestamptz,
               payments bigint, total_commission numeric)
language sql stable security definer set search_path = public as $$
  select upper(left(md5(u.id::text), 6)),
         coalesce(nullif(trim(up.organization_name), ''), nullif(nullif(trim(ac.organization_name), ''), 'My Business'),
                  'Customer ' || upper(left(md5(u.id::text), 6))),
         nullif(trim(ac.business_location), ''),
         pl.name,
         case when pl.name ilike '%trial%' then 'Trial' else 'Paying' end,
         u.created_at, cm.first_paid, cm.last_paid, cm.n, cm.total
    from public.users u
    join public.plans pl on pl.id = u.plan_id
    left join public.user_profiles up on up.user_id = u.id
    left join public.agent_configs ac on ac.user_id = u.id
    left join lateral (
      select min(c.paid_at) as first_paid, max(c.paid_at) as last_paid,
             count(*) filter (where c.status <> 'void') as n,
             coalesce(sum(c.commission_amount) filter (where c.status <> 'void'), 0) as total
        from public.partner_commissions c where c.user_id = u.id and c.kind = 'commission') cm on true
   where u.referred_by_partner_id = p_partner_id
   order by u.created_at desc;
$$;

create or replace function public.portal_partner_payments(p_partner_id uuid)
returns table (paid_at timestamptz, kind text, customer_key text, business_name text, plan_name text,
               commission_base numeric, rate_percent numeric, commission_amount numeric, status text,
               period text, payable_on date, scheduled_payout date, paid_out_at timestamptz,
               payout_ref text, note text, currency text)
language sql stable security definer set search_path = public as $$
  select c.paid_at, c.kind,
         case when c.kind = 'commission' then upper(left(md5(coalesce(c.user_id::text, c.customer_email, c.id::text)), 6)) end,
         case when c.kind = 'adjustment' then 'Adjustment'
              else coalesce(nullif(trim(up.organization_name), ''), nullif(nullif(trim(ac.organization_name), ''), 'My Business'),
                            'Customer ' || upper(left(md5(coalesce(c.user_id::text, c.customer_email, c.id::text)), 6))) end,
         pl.name, c.net_amount, c.rate_percent, c.commission_amount, c.status, c.period,
         c.hold_until::date, public.portal_payout_date(c.hold_until), c.paid_out_at, c.payout_ref, c.note, c.currency
    from public.partner_commissions c
    left join public.users u on u.id = c.user_id
    left join public.plans pl on pl.id = u.plan_id
    left join public.user_profiles up on up.user_id = u.id
    left join public.agent_configs ac on ac.user_id = u.id
   where c.partner_id = p_partner_id
   order by c.paid_at desc;
$$;

-- Admin-only: real identities for the same customer keys.
create or replace function public.portal_customer_identities(p_partner_id uuid)
returns table (customer_key text, full_name text, email text)
language sql stable security definer set search_path = public as $$
  select upper(left(md5(u.id::text), 6)), up.full_name, u.email
    from public.users u left join public.user_profiles up on up.user_id = u.id
   where u.referred_by_partner_id = p_partner_id;
$$;

revoke all on function public.portal_payout_date(timestamptz) from public, anon, authenticated;
revoke all on function public.portal_partner_list() from public, anon, authenticated;
revoke all on function public.portal_partner_detail(uuid) from public, anon, authenticated;
revoke all on function public.portal_partner_customers(uuid) from public, anon, authenticated;
revoke all on function public.portal_partner_payments(uuid) from public, anon, authenticated;
revoke all on function public.portal_customer_identities(uuid) from public, anon, authenticated;
grant execute on function public.portal_payout_date(timestamptz) to service_role;
grant execute on function public.portal_partner_list() to service_role;
grant execute on function public.portal_partner_detail(uuid) to service_role;
grant execute on function public.portal_partner_customers(uuid) to service_role;
grant execute on function public.portal_partner_payments(uuid) to service_role;
grant execute on function public.portal_customer_identities(uuid) to service_role;

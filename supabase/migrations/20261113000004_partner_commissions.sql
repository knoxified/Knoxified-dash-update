-- Partner commission ledger: one row per customer payment, tiered 30% year one / 20% year two
-- (rates live on the partner row), 21-day hold, add-only integrity, payout views and helpers.
-- Commission is calculated on the NET amount (payment minus Flutterwave fees). Safe to re-run.

alter table public.partners
  add column if not exists commission_rate_year2 numeric not null default 20
  check (commission_rate_year2 >= 0 and commission_rate_year2 <= 100);

create table if not exists public.partner_commissions (
  id                uuid primary key default gen_random_uuid(),
  kind              text not null default 'commission' check (kind in ('commission','adjustment')),
  partner_id        uuid not null references public.partners(id),
  user_id           uuid references public.users(id) on delete set null,
  customer_email    text,
  tx_id             text not null unique,            -- Flutterwave transaction id (dedupes webhook retries)
  paid_at           timestamptz not null,
  currency          text,
  gross_amount      numeric(12,2) not null default 0,
  net_amount        numeric(12,2) not null default 0,
  rate_percent      numeric(5,2)  not null default 0,
  commission_amount numeric(12,2) not null,
  period            text check (period in ('year1','year2')),
  hold_until        timestamptz not null,
  status            text not null default 'pending' check (status in ('pending','paid','void')),
  paid_out_at       timestamptz,
  payout_ref        text,
  note              text,
  created_at        timestamptz not null default now()
);
create index if not exists partner_commissions_partner_idx on public.partner_commissions (partner_id, status, hold_until);
create index if not exists partner_commissions_user_idx on public.partner_commissions (user_id);
alter table public.partner_commissions enable row level security;  -- no policies: service role / SQL editor only

-- Add-only: amounts can never change and rows can never be deleted. Only a pending row may
-- move to paid or void (corrections after payout are negative adjustment rows).
create or replace function public.partner_commissions_guard()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Ledger rows cannot be deleted; void or add an adjustment instead';
  end if;
  if (new.kind, new.partner_id, new.customer_email, new.tx_id, new.paid_at, new.currency,
      new.gross_amount, new.net_amount, new.rate_percent, new.commission_amount, new.period,
      new.hold_until, new.created_at)
     is distinct from
     (old.kind, old.partner_id, old.customer_email, old.tx_id, old.paid_at, old.currency,
      old.gross_amount, old.net_amount, old.rate_percent, old.commission_amount, old.period,
      old.hold_until, old.created_at) then
    raise exception 'Ledger amounts are immutable';
  end if;
  if old.status <> 'pending'
     and (new.status, new.paid_out_at, new.payout_ref, new.note)
         is distinct from (old.status, old.paid_out_at, old.payout_ref, old.note) then
    raise exception 'Paid or void ledger rows cannot change';
  end if;
  return new;
end $$;
drop trigger if exists partner_commissions_guard on public.partner_commissions;
create trigger partner_commissions_guard before update or delete on public.partner_commissions
  for each row execute function public.partner_commissions_guard();

-- Called by the Flutterwave webhook (service role) after every successful payment.
create or replace function public.record_partner_commission(
  p_user_id uuid, p_tx_id text, p_paid_at timestamptz, p_gross numeric, p_net numeric, p_currency text)
returns void language plpgsql security definer set search_path = public as $$
declare
  u record; pr record; v_first timestamptz; v_rate numeric; v_period text;
  v_status text := 'pending'; v_note text;
begin
  select id, email, referred_by_partner_id into u from public.users where id = p_user_id;
  if not found or u.referred_by_partner_id is null then return; end if;
  select * into pr from public.partners where id = u.referred_by_partner_id;
  if not found then return; end if;

  -- Customer age is measured from their first commission-bearing payment.
  select min(paid_at) into v_first from public.partner_commissions where user_id = u.id and kind = 'commission';
  v_first := coalesce(v_first, p_paid_at);
  if p_paid_at < v_first + interval '1 year' then
    v_rate := pr.commission_rate; v_period := 'year1';
  elsif p_paid_at < v_first + interval '2 years' then
    v_rate := pr.commission_rate_year2; v_period := 'year2';
  else
    return; -- beyond year two: no commission
  end if;

  if lower(u.email) = lower(pr.email) then
    v_status := 'void'; v_note := 'Self-referral: partner email equals customer email';
  end if;

  insert into public.partner_commissions
    (partner_id, user_id, customer_email, tx_id, paid_at, currency, gross_amount, net_amount,
     rate_percent, commission_amount, period, hold_until, status, note)
  values
    (pr.id, u.id, u.email, p_tx_id, p_paid_at, p_currency, round(p_gross, 2), round(greatest(p_net, 0), 2),
     v_rate, round(greatest(p_net, 0) * v_rate / 100, 2), v_period, p_paid_at + interval '21 days', v_status, v_note)
  on conflict (tx_id) do nothing;
end $$;
revoke all on function public.record_partner_commission(uuid, text, timestamptz, numeric, numeric, text) from public, anon, authenticated;
grant execute on function public.record_partner_commission(uuid, text, timestamptz, numeric, numeric, text) to service_role;

-- Refund or chargeback before payout: void that payment's commission.
create or replace function public.void_commission(p_tx_id text, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.partner_commissions
     set status = 'void', note = concat_ws(' | ', note, p_reason)
   where tx_id = p_tx_id and status = 'pending';
  if not found then
    raise exception 'No pending commission with tx_id % (already paid or void?)', p_tx_id;
  end if;
  insert into public.audit_logs (action, entity_type, metadata)
  values ('commission_voided', 'partner_commission', jsonb_build_object('tx_id', p_tx_id, 'reason', p_reason));
end $$;
revoke all on function public.void_commission(text, text) from public, anon, authenticated;

-- Correction after a payout (negative amount) or a goodwill bonus (positive amount).
create or replace function public.add_commission_adjustment(
  p_partner_id uuid, p_amount numeric, p_currency text, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.partner_commissions (kind, partner_id, tx_id, paid_at, currency, commission_amount, hold_until, note)
  values ('adjustment', p_partner_id, 'adj-' || gen_random_uuid()::text, now(), p_currency, round(p_amount, 2), now(), p_reason);
  insert into public.audit_logs (action, entity_type, metadata)
  values ('commission_adjustment', 'partner', jsonb_build_object('partner_id', p_partner_id, 'amount', p_amount, 'reason', p_reason));
end $$;
revoke all on function public.add_commission_adjustment(uuid, numeric, text, text) from public, anon, authenticated;

-- After you have sent the money: close out everything payable for that partner.
create or replace function public.mark_commissions_paid(
  p_partner_id uuid, p_currency text, p_payout_ref text, p_through timestamptz default now())
returns table (rows_paid integer, total_paid numeric)
language plpgsql security definer set search_path = public as $$
declare v_due numeric;
begin
  select sum(commission_amount) into v_due from public.partner_commissions
   where partner_id = p_partner_id and currency is not distinct from p_currency
     and status = 'pending' and hold_until <= p_through;
  if coalesce(v_due, 0) <= 0 then
    raise exception 'Nothing payable for this partner and currency';
  end if;
  with u as (
    update public.partner_commissions
       set status = 'paid', paid_out_at = now(), payout_ref = p_payout_ref
     where partner_id = p_partner_id and currency is not distinct from p_currency
       and status = 'pending' and hold_until <= p_through
    returning commission_amount)
  select count(*)::int, coalesce(sum(commission_amount), 0) into rows_paid, total_paid from u;
  insert into public.audit_logs (action, entity_type, metadata)
  values ('commissions_paid', 'partner', jsonb_build_object('partner_id', p_partner_id, 'currency', p_currency,
          'total', total_paid, 'payout_ref', p_payout_ref));
  return next;
end $$;
revoke all on function public.mark_commissions_paid(uuid, text, text, timestamptz) from public, anon, authenticated;

-- Monthly payout list: what is payable now (hold passed). Minimum payout: 50 (rolls over if below).
create or replace view public.partner_payouts_due with (security_invoker = true) as
select p.id as partner_id, p.name as partner, p.email, c.currency,
       count(*) filter (where c.kind = 'commission') as payments,
       round(sum(c.commission_amount), 2) as amount_due,
       (sum(c.commission_amount) >= 50) as meets_minimum,
       min(c.paid_at) as oldest_payment
  from public.partner_commissions c join public.partners p on p.id = c.partner_id
 where c.status = 'pending' and c.hold_until <= now()
 group by p.id, p.name, p.email, c.currency;

-- One row per partner: funnel and money.
create or replace view public.partner_summary with (security_invoker = true) as
select p.id as partner_id, p.name, p.ref_code, p.status,
       p.commission_rate as year1_rate, p.commission_rate_year2 as year2_rate,
       (select count(*) from public.partner_leads l where l.partner_id = p.id) as visits,
       (select count(*) from public.partner_leads l where l.partner_id = p.id and l.status in ('signed_up','paid')) as signups,
       (select count(*) from public.partner_leads l where l.partner_id = p.id and l.status = 'paid') as paying_customers,
       coalesce(sum(c.commission_amount) filter (where c.status = 'pending' and c.hold_until >  now()), 0) as in_hold,
       coalesce(sum(c.commission_amount) filter (where c.status = 'pending' and c.hold_until <= now()), 0) as payable_now,
       coalesce(sum(c.commission_amount) filter (where c.status = 'paid'), 0) as paid_to_date,
       coalesce(sum(c.commission_amount) filter (where c.status = 'void'), 0) as voided
  from public.partners p left join public.partner_commissions c on c.partner_id = p.id
 group by p.id;

-- Books / statements: every payment with the affiliate and customer tagged.
create or replace view public.partner_ledger with (security_invoker = true) as
select c.paid_at, p.name as partner, c.kind, c.customer_email as customer, c.tx_id, c.currency,
       c.gross_amount, c.net_amount, c.rate_percent, c.period, c.commission_amount,
       c.status, c.hold_until, c.paid_out_at, c.payout_ref, c.note
  from public.partner_commissions c join public.partners p on p.id = c.partner_id
 order by c.paid_at desc;

revoke all on public.partner_commissions, public.partner_payouts_due, public.partner_summary, public.partner_ledger from anon, authenticated;

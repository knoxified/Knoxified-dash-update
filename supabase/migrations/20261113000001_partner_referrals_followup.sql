-- Follow-up: annual plans get no affiliate rate; expose the referrer's name to its own user.

-- Remove unused annual affiliate variants (not purchasable, nobody is on them).
delete from public.plans a
 using public.plans b
 where a.affiliate_rate_of = b.id
   and (b.billing_interval = 'year' or b.name ilike '%annual%')
   and not exists (select 1 from public.users u where u.plan_id = a.id);

-- Name of the partner who referred the signed-in user (null if none).
create or replace function public.get_my_referrer_name()
returns text language sql stable security definer set search_path = public as $$
  select p.name
    from public.users u
    join public.partners p on p.id = u.referred_by_partner_id
   where u.id = auth.uid();
$$;
revoke all on function public.get_my_referrer_name() from public, anon;
grant execute on function public.get_my_referrer_name() to authenticated;

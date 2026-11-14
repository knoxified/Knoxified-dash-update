-- add_partner now accepts both commission rates (defaults 30% year one, 20% year two). Safe to re-run.
alter table public.partners alter column commission_rate set default 30;
alter table public.partners alter column commission_rate_year2 set default 20;

drop function if exists public.add_partner(text, text, text, text, numeric);
create or replace function public.add_partner(
  p_name text, p_company text, p_email text,
  p_ref_code text default null,
  p_commission_rate numeric default 30,
  p_commission_rate_year2 numeric default 20)
returns table (out_partner_id uuid, out_ref_code text, out_link text)
language plpgsql set search_path = public as $$
declare v_base text; v_code text; v_n int := 1;
begin
  v_base := lower(coalesce(nullif(trim(p_ref_code), ''), p_name));
  v_base := trim(both '-' from regexp_replace(v_base, '[^a-z0-9_-]+', '-', 'g'));
  if length(v_base) < 3 then
    v_base := trim(both '-' from v_base || '-partner');
  end if;
  v_base := left(v_base, 34);
  v_code := v_base;
  while exists (select 1 from public.partners x where x.ref_code = v_code) loop
    v_n := v_n + 1;
    v_code := v_base || '-' || v_n;
  end loop;

  insert into public.partners (name, company, email, ref_code, commission_rate, commission_rate_year2)
  values (trim(p_name), nullif(trim(p_company), ''), lower(trim(p_email)), v_code,
          p_commission_rate, p_commission_rate_year2)
  returning id into out_partner_id;

  out_ref_code := v_code;
  out_link := 'https://knoxified.org/?ref=' || v_code;
  return next;
end $$;
revoke all on function public.add_partner(text, text, text, text, numeric, numeric) from public, anon, authenticated;

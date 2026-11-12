-- Number lifecycle: lapse countdown + uniqueness that allows a released number to be re-bought.
alter table public.phone_number_mappings add column if not exists lapsed_at timestamptz;

do $$
declare c text;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname = 'public' and rel.relname = 'phone_number_mappings' and con.contype = 'u'
      and con.conkey = array[(select attnum from pg_attribute where attrelid = rel.oid and attname = 'phone_number')]::smallint[]
  loop
    execute format('alter table public.phone_number_mappings drop constraint %I', c);
  end loop;
end $$;

create unique index if not exists phone_number_mappings_active_unique
  on public.phone_number_mappings (phone_number)
  where released_at is null and verified_at is not null;

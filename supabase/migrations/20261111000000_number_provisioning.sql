-- Number provisioning: countries, shared numbers, purchase log, mapping columns.
create table if not exists public.countries (
  country_code text primary key check (country_code ~ '^[A-Z]{2}$'),
  name text not null,
  dial_code text not null,
  is_enabled boolean not null default false,
  number_mode text not null default 'shared' check (number_mode in ('dedicated', 'shared')),
  provider text not null default 'signalwire' check (provider in ('signalwire', 'telnyx', 'twilio', 'vonage')),
  shared_customer_threshold smallint not null default 3,
  forwarding_instructions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.countries (country_code, name, dial_code, is_enabled, number_mode, provider) values
  ('US', 'United States', '+1', true, 'dedicated', 'signalwire'),
  ('CA', 'Canada', '+1', true, 'dedicated', 'signalwire'),
  ('GB', 'United Kingdom', '+44', true, 'dedicated', 'signalwire'),
  ('IE', 'Ireland', '+353', true, 'dedicated', 'signalwire'),
  ('AU', 'Australia', '+61', true, 'dedicated', 'signalwire'),
  ('NZ', 'New Zealand', '+64', true, 'dedicated', 'signalwire')
on conflict (country_code) do nothing;

create table if not exists public.platform_numbers (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(country_code),
  phone_number text not null unique,
  provider text not null default 'signalwire' check (provider in ('signalwire', 'telnyx', 'twilio', 'vonage')),
  provider_number_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.number_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  country_code text not null references public.countries(country_code),
  provider text not null,
  phone_number text,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'paused_low_balance')),
  idempotency_key text not null unique,
  error text,
  created_at timestamptz not null default now()
);

alter table public.phone_number_mappings
  add column if not exists source text not null default 'customer_forwarded' check (source in ('provisioned', 'customer_forwarded')),
  add column if not exists verified_at timestamptz,
  add column if not exists released_at timestamptz;

update public.phone_number_mappings set verified_at = coalesce(verified_at, created_at) where verified_at is null;

create unique index if not exists phone_number_mappings_one_provisioned_per_user
  on public.phone_number_mappings (user_id) where source = 'provisioned' and released_at is null;

alter table public.countries enable row level security;
alter table public.platform_numbers enable row level security;
alter table public.number_purchases enable row level security;

drop policy if exists "Anyone signed in can read countries" on public.countries;
create policy "Anyone signed in can read countries" on public.countries for select to authenticated using (true);
drop policy if exists "Users can view their own number purchases" on public.number_purchases;
create policy "Users can view their own number purchases" on public.number_purchases for select to authenticated using (auth.uid() = user_id);

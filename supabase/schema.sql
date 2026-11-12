-- NevaWebDesign internal CRM, Supabase PostgreSQL
-- Run once in Supabase SQL Editor. No public signup policies.
create extension if not exists pgcrypto;

create table if not exists public.nwd_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.nwd_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  business_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);
create table if not exists public.nwd_quotes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.nwd_clients(id) on delete cascade,
  quote_number text not null unique,
  service text not null,
  description text,
  amount numeric(12,2) not null check(amount>=0),
  tax_amount numeric(12,2) not null default 0 check(tax_amount>=0),
  status text not null default 'draft' check(status in ('draft','sent','accepted','rejected','expired')),
  valid_until date,
  created_at timestamptz not null default now()
);
create table if not exists public.nwd_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.nwd_clients(id) on delete cascade,
  quote_id uuid references public.nwd_quotes(id) on delete set null,
  title text not null,
  status text not null default 'planning' check(status in ('planning','design','development','review','completed','cancelled')),
  agreed_amount numeric(12,2) not null default 0 check(agreed_amount>=0),
  estimated_hours numeric(8,2) not null default 0 check(estimated_hours>=0),
  actual_hours numeric(8,2) not null default 0 check(actual_hours>=0),
  start_date date,
  due_date date,
  notes text,
  created_at timestamptz not null default now()
);
create table if not exists public.nwd_transactions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.nwd_projects(id) on delete cascade,
  type text not null check(type in ('payment','expense')),
  category text,
  amount numeric(12,2) not null check(amount>0),
  occurred_on date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.nwd_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.nwd_admins where user_id = (select auth.uid())); $$;
revoke all on function public.nwd_is_admin() from public;
grant execute on function public.nwd_is_admin() to authenticated;

alter table public.nwd_admins enable row level security;
alter table public.nwd_clients enable row level security;
alter table public.nwd_quotes enable row level security;
alter table public.nwd_projects enable row level security;
alter table public.nwd_transactions enable row level security;

drop policy if exists "admins read own membership" on public.nwd_admins;
create policy "admins read own membership" on public.nwd_admins for select to authenticated using (user_id=(select auth.uid()));
-- Admin membership is provisioned manually in SQL Editor; never from client UI.
do $$
declare tbl text;
begin
  foreach tbl in array array['nwd_clients','nwd_quotes','nwd_projects','nwd_transactions'] loop
    execute format('drop policy if exists "nwd admin select" on public.%I',tbl);
    execute format('drop policy if exists "nwd admin insert" on public.%I',tbl);
    execute format('drop policy if exists "nwd admin update" on public.%I',tbl);
    execute format('drop policy if exists "nwd admin delete" on public.%I',tbl);
    execute format('create policy "nwd admin select" on public.%I for select to authenticated using ((select public.nwd_is_admin()))',tbl);
    execute format('create policy "nwd admin insert" on public.%I for insert to authenticated with check ((select public.nwd_is_admin()))',tbl);
    execute format('create policy "nwd admin update" on public.%I for update to authenticated using ((select public.nwd_is_admin())) with check ((select public.nwd_is_admin()))',tbl);
    execute format('create policy "nwd admin delete" on public.%I for delete to authenticated using ((select public.nwd_is_admin()))',tbl);
  end loop;
end $$;

revoke all on public.nwd_admins, public.nwd_clients, public.nwd_quotes, public.nwd_projects, public.nwd_transactions from anon;
grant select on public.nwd_admins to authenticated;
grant select,insert,update,delete on public.nwd_clients, public.nwd_quotes, public.nwd_projects, public.nwd_transactions to authenticated;

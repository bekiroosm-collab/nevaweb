-- NevaWebDesign public website lead inbox (run in Supabase SQL Editor)
create table if not exists public.nwd_leads (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(name) between 2 and 100),
 business_name text,
 phone text not null,
 service text not null,
 budget text,
 details text not null,
 status text not null default 'new' check(status in ('new','contacted','qualified','closed')),
 created_at timestamptz not null default now()
);
alter table public.nwd_leads enable row level security;
drop policy if exists "nwd admin select" on public.nwd_leads;
drop policy if exists "nwd admin update" on public.nwd_leads;
drop policy if exists "nwd admin delete" on public.nwd_leads;
create policy "nwd admin select" on public.nwd_leads for select to authenticated using ((select public.nwd_is_admin()));
create policy "nwd admin update" on public.nwd_leads for update to authenticated using ((select public.nwd_is_admin())) with check ((select public.nwd_is_admin()));
create policy "nwd admin delete" on public.nwd_leads for delete to authenticated using ((select public.nwd_is_admin()));
revoke all on public.nwd_leads from anon, authenticated;
grant select,update,delete on public.nwd_leads to authenticated;
create index if not exists nwd_leads_created_idx on public.nwd_leads(created_at desc);

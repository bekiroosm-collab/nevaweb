-- Run once in Supabase SQL Editor before using cloud sync.
create table if not exists public.nwd_prospects (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 business text not null,
 contact text not null default '',
 phone text not null default '',
 email text not null default '',
 service text not null default '',
 stage text not null default 'Yeni',
 followup date,
 notes text not null default '',
 created_at timestamptz not null default now()
);
create index if not exists nwd_prospects_owner_idx on public.nwd_prospects(owner_id,created_at desc);
alter table public.nwd_prospects enable row level security;
revoke all on public.nwd_prospects from anon,authenticated;
grant select,insert,update,delete on public.nwd_prospects to authenticated;
drop policy if exists nwd_prospects_select on public.nwd_prospects;
drop policy if exists nwd_prospects_insert on public.nwd_prospects;
drop policy if exists nwd_prospects_update on public.nwd_prospects;
drop policy if exists nwd_prospects_delete on public.nwd_prospects;
create policy nwd_prospects_select on public.nwd_prospects for select to authenticated using (owner_id=(select auth.uid()) and (select public.nwd_is_admin()));
create policy nwd_prospects_insert on public.nwd_prospects for insert to authenticated with check (owner_id=(select auth.uid()) and (select public.nwd_is_admin()));
create policy nwd_prospects_update on public.nwd_prospects for update to authenticated using (owner_id=(select auth.uid()) and (select public.nwd_is_admin())) with check (owner_id=(select auth.uid()) and (select public.nwd_is_admin()));
create policy nwd_prospects_delete on public.nwd_prospects for delete to authenticated using (owner_id=(select auth.uid()) and (select public.nwd_is_admin()));

-- Run once in Supabase SQL Editor to enable project task tracking.
create table if not exists public.nwd_project_tasks (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.nwd_projects(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 1 and 240),
 done boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.nwd_project_tasks enable row level security;
drop policy if exists "nwd admin select" on public.nwd_project_tasks;
drop policy if exists "nwd admin insert" on public.nwd_project_tasks;
drop policy if exists "nwd admin update" on public.nwd_project_tasks;
drop policy if exists "nwd admin delete" on public.nwd_project_tasks;
create policy "nwd admin select" on public.nwd_project_tasks for select to authenticated using ((select public.nwd_is_admin()));
create policy "nwd admin insert" on public.nwd_project_tasks for insert to authenticated with check ((select public.nwd_is_admin()));
create policy "nwd admin update" on public.nwd_project_tasks for update to authenticated using ((select public.nwd_is_admin())) with check ((select public.nwd_is_admin()));
create policy "nwd admin delete" on public.nwd_project_tasks for delete to authenticated using ((select public.nwd_is_admin()));
revoke all on public.nwd_project_tasks from anon;
grant select,insert,update,delete on public.nwd_project_tasks to authenticated;
create index if not exists nwd_project_tasks_project_id_idx on public.nwd_project_tasks(project_id);

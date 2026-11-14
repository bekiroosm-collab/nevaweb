-- NevaOS V1 - common reservation engine (DRAFT FOR A NEW SUPABASE PROJECT)
-- IMPORTANT: DO NOT run against the existing live BerberOS database.
-- This file has not been executed. Provision a separate test Supabase project first.
-- 2026-11-14

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.nos_businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,64}$'),
  name text not null check (char_length(trim(name)) between 2 and 160),
  sector text not null check (char_length(trim(sector)) between 2 and 100),
  engine text not null check (engine in ('appointment','space','class')),
  timezone text not null default 'Europe/Istanbul',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.nos_memberships (
  business_id uuid not null references public.nos_businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','staff')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (business_id,user_id)
);
create table if not exists public.nos_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.nos_businesses(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 160),
  duration_minutes integer not null default 60 check (duration_minutes between 15 and 480),
  price numeric(12,2) not null default 0 check (price>=0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id,business_id)
);
create table if not exists public.nos_resources (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.nos_businesses(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  kind text not null check (kind in ('staff','table','room','pitch','court','studio','console','other')),
  capacity integer not null default 1 check (capacity between 1 and 1000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id,business_id)
);
create table if not exists public.nos_bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.nos_businesses(id) on delete cascade,
  resource_id uuid not null,
  service_id uuid,
  customer_name text not null check (char_length(trim(customer_name)) between 2 and 160),
  customer_phone text,
  party_size integer not null default 1 check (party_size between 1 and 1000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('held','confirmed','completed','cancelled','no_show')),
  notes text,
  created_at timestamptz not null default now(),
  constraint nos_booking_time_valid check (starts_at<ends_at),
  foreign key (resource_id,business_id) references public.nos_resources(id,business_id),
  foreign key (service_id,business_id) references public.nos_services(id,business_id),
  unique(id,business_id)
);
-- A real PostgreSQL exclusion constraint prevents overlapping reserved slots
-- for the same resource across concurrent connections.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname='nos_no_resource_overlaps'
      and conrelid='public.nos_bookings'::regclass
  ) then
    alter table public.nos_bookings add constraint nos_no_resource_overlaps
    exclude using gist (
      resource_id with =,
      tstzrange(starts_at,ends_at,'[)') with &&
    ) where (status in ('held','confirmed'));
  end if;
end $$;

create table if not exists public.nos_class_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.nos_businesses(id) on delete cascade,
  resource_id uuid,
  title text not null check (char_length(trim(title)) between 2 and 160),
  capacity integer not null check (capacity between 1 and 1000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','cancelled','completed')),
  created_at timestamptz not null default now(),
  constraint nos_class_time_valid check(starts_at<ends_at),
  foreign key (resource_id,business_id) references public.nos_resources(id,business_id),
  unique (id,business_id)
);
create table if not exists public.nos_class_enrollments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.nos_businesses(id) on delete cascade,
  session_id uuid not null,
  attendee_name text not null check (char_length(trim(attendee_name)) between 2 and 160),
  status text not null default 'enrolled' check (status in ('enrolled','cancelled')),
  created_at timestamptz not null default now(),
  foreign key (session_id,business_id) references public.nos_class_sessions(id,business_id)
);
create table if not exists public.nos_audit_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.nos_businesses(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check(char_length(action) between 2 and 100),
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists nos_member_user_idx on public.nos_memberships(user_id);
create index if not exists nos_resources_business_idx on public.nos_resources(business_id);
create index if not exists nos_services_business_idx on public.nos_services(business_id);
create index if not exists nos_booking_business_start_idx on public.nos_bookings(business_id,starts_at);
create index if not exists nos_booking_resource_idx on public.nos_bookings(resource_id,starts_at);
create index if not exists nos_sessions_start_idx on public.nos_class_sessions(business_id,starts_at);
create index if not exists nos_enrollments_session_idx on public.nos_class_enrollments(session_id,status);

-- Membership inspection intentionally uses SECURITY DEFINER to avoid recursive RLS.
create or replace function public.nos_member(p_business_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$select exists(
 select 1 from public.nos_memberships m
 where m.business_id=p_business_id and m.user_id=(select auth.uid()) and m.active
)$$;
create or replace function public.nos_manager(p_business_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$select exists(
 select 1 from public.nos_memberships m
 where m.business_id=p_business_id and m.user_id=(select auth.uid()) and m.active
 and m.role in ('owner','manager')
)$$;

revoke all on function public.nos_member(uuid) from public;
revoke all on function public.nos_manager(uuid) from public;
grant execute on function public.nos_member(uuid),public.nos_manager(uuid) to authenticated;

alter table public.nos_businesses enable row level security;
alter table public.nos_memberships enable row level security;
alter table public.nos_resources enable row level security;
alter table public.nos_services enable row level security;
alter table public.nos_bookings enable row level security;
alter table public.nos_class_sessions enable row level security;
alter table public.nos_class_enrollments enable row level security;
alter table public.nos_audit_events enable row level security;

-- No public/anonymous grants. Public customer booking must use a separate
-- rate-limited Edge Function with validated inputs, server-side business checks.
revoke all on public.nos_businesses,public.nos_memberships,public.nos_resources,
 public.nos_services,public.nos_bookings,public.nos_class_sessions,
 public.nos_class_enrollments,public.nos_audit_events from anon,authenticated;
grant select on public.nos_businesses,public.nos_memberships to authenticated;
grant select,insert,update on public.nos_services,public.nos_resources,public.nos_bookings,
 public.nos_class_sessions,public.nos_class_enrollments to authenticated;
grant select on public.nos_audit_events to authenticated;

drop policy if exists nos_business_view on public.nos_businesses;
create policy nos_business_view on public.nos_businesses for select to authenticated using ((select public.nos_member(id)));
drop policy if exists nos_membership_view on public.nos_memberships;
create policy nos_membership_view on public.nos_memberships for select to authenticated using ((select public.nos_member(business_id)));
drop policy if exists nos_resource_view on public.nos_resources;
create policy nos_resource_view on public.nos_resources for select to authenticated using ((select public.nos_member(business_id)));
drop policy if exists nos_resource_manage on public.nos_resources;
create policy nos_resource_manage on public.nos_resources for all to authenticated using ((select public.nos_manager(business_id))) with check ((select public.nos_manager(business_id)));
drop policy if exists nos_service_view on public.nos_services;
create policy nos_service_view on public.nos_services for select to authenticated using ((select public.nos_member(business_id)));
drop policy if exists nos_service_manage on public.nos_services;
create policy nos_service_manage on public.nos_services for all to authenticated using ((select public.nos_manager(business_id))) with check ((select public.nos_manager(business_id)));
drop policy if exists nos_booking_select on public.nos_bookings;
create policy nos_booking_select on public.nos_bookings for select to authenticated using ((select public.nos_member(business_id)));
drop policy if exists nos_booking_insert on public.nos_bookings;
create policy nos_booking_insert on public.nos_bookings for insert to authenticated with check ((select public.nos_member(business_id)));
drop policy if exists nos_booking_update on public.nos_bookings;
create policy nos_booking_update on public.nos_bookings for update to authenticated using ((select public.nos_member(business_id))) with check ((select public.nos_member(business_id)));
drop policy if exists nos_classes_view on public.nos_class_sessions;
create policy nos_classes_view on public.nos_class_sessions for select to authenticated using ((select public.nos_member(business_id)));
drop policy if exists nos_classes_manage on public.nos_class_sessions;
create policy nos_classes_manage on public.nos_class_sessions for all to authenticated using ((select public.nos_manager(business_id))) with check ((select public.nos_manager(business_id)));
drop policy if exists nos_enrollments_view on public.nos_class_enrollments;
create policy nos_enrollments_view on public.nos_class_enrollments for select to authenticated using ((select public.nos_member(business_id)));
-- Enrollment writes are intentionally restricted to a server-side function.
drop policy if exists nos_audit_view on public.nos_audit_events;
create policy nos_audit_view on public.nos_audit_events for select to authenticated using ((select public.nos_manager(business_id)));

-- Atomically enroll into a class. Only the server-side service role may call.
create or replace function public.nos_enroll_class(
 p_business_id uuid,p_session_id uuid,p_attendee_name text
) returns uuid language plpgsql security definer set search_path=''
as $$
declare session_row record;enrolled integer;new_id uuid;
begin
 if char_length(trim(coalesce(p_attendee_name,''))) not between 2 and 160 then
  raise exception 'Invalid attendee name';
 end if;
 select id,business_id,capacity,status into session_row
 from public.nos_class_sessions
 where id=p_session_id and business_id=p_business_id for update;
 if not found or session_row.status<>'scheduled' then
  raise exception 'Class session not found or not available';
 end if;
 select count(*) into enrolled from public.nos_class_enrollments
 where session_id=p_session_id and status='enrolled';
 if enrolled>=session_row.capacity then
  raise exception 'Class is full';
 end if;
 insert into public.nos_class_enrollments(business_id,session_id,attendee_name)
 values(p_business_id,p_session_id,trim(p_attendee_name))
 returning id into new_id;
 return new_id;
end $$;
revoke all on function public.nos_enroll_class(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.nos_enroll_class(uuid,uuid,text) to service_role;

-- NEXT: write server booking API, add verified business onboarding,
-- validate resource capacity and staff availability on every mutation,
-- and integrate with BerberOS via a carefully tested migration.

-- REDLINE detail template: leads, owner allow-list, RLS, realtime, atomic booking.

create extension if not exists pgcrypto;

create type vehicle_type as enum ('coupe','sedan','suv','truck');
create type service_type as enum ('wash','polish','ceramic');
create type lead_kind    as enum ('booking','question','quote');
create type lead_status  as enum ('new','booked','quote','follow_up','done','lost');

create table public.leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null check (char_length(name) between 1 and 80),
  phone         text not null,
  email         text,
  vehicle       vehicle_type,
  service       service_type,
  kind          lead_kind not null default 'booking',
  slot_start    timestamptz,             -- null for questions/quotes
  ready_at      timestamptz,
  source        text not null default 'website',
  status        lead_status not null default 'new',
  follow_up     text,                    -- e.g. '✓ Text sent in 4s'
  follow_up_at  timestamptz,
  est_price     integer,
  message       text,
  utm           jsonb default '{}'::jsonb,
  notes         text
);
create index on public.leads (created_at desc);
create index on public.leads (slot_start);

create table public.admins (email text primary key);

alter table public.leads  enable row level security;
alter table public.admins enable row level security;

-- Only authenticated admins can read or update leads. Inserts happen server-side with the service role.
create policy "admins read leads" on public.leads for select
  using (exists (select 1 from public.admins a where a.email = auth.jwt()->>'email'));
create policy "admins update leads" on public.leads for update
  using (exists (select 1 from public.admins a where a.email = auth.jwt()->>'email'));
create policy "admins read admins" on public.admins for select
  using (email = auth.jwt()->>'email');

alter publication supabase_realtime add table public.leads;

-- Atomic booking: one advisory lock per slot, so "count, then insert" can't race.
-- Two requests for the last free slot → exactly one row; the other gets 'slot_full'.
create or replace function public.book_slot(p_lead jsonb, p_bays int)
returns public.leads
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot  timestamptz := (p_lead->>'slot_start')::timestamptz;
  v_count int;
  v_row   public.leads;
begin
  if v_slot is null then
    raise exception 'slot_start required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('slot:' || extract(epoch from v_slot)::text, 0));

  select count(*) into v_count
  from public.leads
  where kind = 'booking' and status in ('new','booked') and slot_start = v_slot;

  if v_count >= p_bays then
    raise exception 'slot_full' using errcode = 'P0001';
  end if;

  insert into public.leads (name, phone, email, vehicle, service, kind, slot_start, ready_at, source, status, est_price, message, utm)
  values (
    p_lead->>'name',
    p_lead->>'phone',
    nullif(p_lead->>'email',''),
    (p_lead->>'vehicle')::vehicle_type,
    (p_lead->>'service')::service_type,
    coalesce((p_lead->>'kind')::lead_kind, 'booking'),
    v_slot,
    (p_lead->>'ready_at')::timestamptz,
    coalesce(p_lead->>'source','website'),
    coalesce((p_lead->>'status')::lead_status, 'booked'),
    (p_lead->>'est_price')::int,
    p_lead->>'message',
    coalesce(p_lead->'utm','{}'::jsonb)
  )
  returning * into v_row;
  return v_row;
end;
$$;

revoke all on function public.book_slot(jsonb, int) from public;
revoke all on function public.book_slot(jsonb, int) from anon, authenticated;
grant execute on function public.book_slot(jsonb, int) to service_role;

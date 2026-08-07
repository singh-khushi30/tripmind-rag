-- TripMind trips table, RLS, indexes, and updated_at trigger
-- Run manually in the Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  destination text not null,
  start_date date null,
  number_of_days integer not null,
  budget numeric(12, 2) not null,
  currency text not null default 'USD',
  travelers integer not null,
  travel_style text not null,
  travel_pace text not null,
  interests text[] not null default '{}',
  food_preference text null,
  special_notes text null,
  status text not null default 'generated',
  itinerary_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trips_number_of_days_range
    check (number_of_days between 1 and 30),
  constraint trips_budget_positive
    check (budget > 0),
  constraint trips_travelers_range
    check (travelers between 1 and 20),
  constraint trips_status_allowed
    check (status in ('draft', 'generated', 'updated', 'completed'))
);

create index if not exists trips_user_id_idx
  on public.trips (user_id);

create index if not exists trips_created_at_desc_idx
  on public.trips (created_at desc);

alter table public.trips enable row level security;

create policy "Users can select their own trips"
  on public.trips
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own trips"
  on public.trips
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own trips"
  on public.trips
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own trips"
  on public.trips
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trips_set_updated_at on public.trips;

create trigger trips_set_updated_at
before update on public.trips
for each row
execute function public.set_updated_at();

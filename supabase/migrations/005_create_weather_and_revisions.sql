-- TripMind adaptive planning: daily weather + itinerary day revisions
-- Run manually in the Supabase SQL Editor after 004_create_trip_locations.sql.
-- Weather: Open-Meteo (no key). Currency conversion is not stored here.

-- ---------------------------------------------------------------------------
-- 1. Per-day weather forecasts
-- ---------------------------------------------------------------------------

create table if not exists public.trip_day_weather (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day_number integer not null,
  forecast_date date not null,
  weather_status text not null,
  temp_min numeric null,
  temp_max numeric null,
  precipitation_probability numeric null,
  precipitation_amount numeric null,
  weather_code integer null,
  summary text null,
  category text null,
  fetched_at timestamptz not null default now(),

  constraint trip_day_weather_day_number_positive
    check (day_number >= 1),
  constraint trip_day_weather_status_allowed
    check (
      weather_status in (
        'available',
        'forecast_unavailable',
        'service_unavailable',
        'no_coordinates',
        'no_start_date'
      )
    ),
  constraint trip_day_weather_trip_day_unique
    unique (trip_id, day_number)
);

create index if not exists trip_day_weather_trip_id_idx
  on public.trip_day_weather (trip_id);

alter table public.trip_day_weather enable row level security;

drop policy if exists "Users can select weather for their trips"
  on public.trip_day_weather;

create policy "Users can select weather for their trips"
  on public.trip_day_weather
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = trip_day_weather.trip_id
        and t.user_id = auth.uid()
    )
  );

-- Writes happen server-side (authenticated insert for own trips).

drop policy if exists "Users can insert weather for their trips"
  on public.trip_day_weather;

create policy "Users can insert weather for their trips"
  on public.trip_day_weather
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = trip_day_weather.trip_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update weather for their trips"
  on public.trip_day_weather;

create policy "Users can update weather for their trips"
  on public.trip_day_weather
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = trip_day_weather.trip_id
        and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = trip_day_weather.trip_id
        and t.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Day re-plan revisions (for undo)
-- ---------------------------------------------------------------------------

create table if not exists public.trip_revisions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  day_number integer not null,
  reason text not null,
  previous_day jsonb not null,
  updated_day jsonb not null,
  created_at timestamptz not null default now(),

  constraint trip_revisions_day_number_positive
    check (day_number >= 1)
);

create index if not exists trip_revisions_trip_day_created_idx
  on public.trip_revisions (trip_id, day_number, created_at desc);

alter table public.trip_revisions enable row level security;

drop policy if exists "Users can select their trip revisions"
  on public.trip_revisions;

create policy "Users can select their trip revisions"
  on public.trip_revisions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert their trip revisions"
  on public.trip_revisions;

create policy "Users can insert their trip revisions"
  on public.trip_revisions
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.trips t
      where t.id = trip_revisions.trip_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete their trip revisions"
  on public.trip_revisions;

create policy "Users can delete their trip revisions"
  on public.trip_revisions
  for delete
  to authenticated
  using (user_id = auth.uid());

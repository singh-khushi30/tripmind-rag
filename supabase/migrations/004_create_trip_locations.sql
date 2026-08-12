-- TripMind maps phase: geocoding cache + per-activity locations
-- Run manually in the Supabase SQL Editor after 003_normalize_travel_sources.sql.
-- Providers: Nominatim (geocode) + OSRM (routing). No paid map APIs.

-- ---------------------------------------------------------------------------
-- 1. Shared geocoding cache
-- ---------------------------------------------------------------------------

create table if not exists public.location_cache (
  normalized_query text primary key,
  latitude double precision not null,
  longitude double precision not null,
  display_name text null,
  provider text not null default 'nominatim',
  confidence text null,
  fetched_at timestamptz not null default now(),

  constraint location_cache_latitude_range
    check (latitude >= -90 and latitude <= 90),
  constraint location_cache_longitude_range
    check (longitude >= -180 and longitude <= 180),
  constraint location_cache_not_null_island
    check (not (latitude = 0 and longitude = 0))
);

alter table public.location_cache enable row level security;

drop policy if exists "Authenticated users can select location cache"
  on public.location_cache;

create policy "Authenticated users can select location cache"
  on public.location_cache
  for select
  to authenticated
  using (true);

-- Writes happen only via the server-only service role client.

-- ---------------------------------------------------------------------------
-- 2. Per-trip activity locations
-- ---------------------------------------------------------------------------

create table if not exists public.trip_activity_locations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  activity_key text not null,
  activity_title text not null,
  location_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  display_name text null,
  geocoding_provider text not null default 'nominatim',
  confidence text null,
  created_at timestamptz not null default now(),

  constraint trip_activity_locations_latitude_range
    check (latitude >= -90 and latitude <= 90),
  constraint trip_activity_locations_longitude_range
    check (longitude >= -180 and longitude <= 180),
  constraint trip_activity_locations_not_null_island
    check (not (latitude = 0 and longitude = 0)),
  constraint trip_activity_locations_confidence_allowed
    check (
      confidence is null
      or confidence in ('exact', 'approximate', 'unavailable')
    ),
  constraint trip_activity_locations_trip_activity_key_unique
    unique (trip_id, activity_key)
);

create index if not exists trip_activity_locations_trip_id_idx
  on public.trip_activity_locations (trip_id);

alter table public.trip_activity_locations enable row level security;

drop policy if exists "Users can select locations for their trips"
  on public.trip_activity_locations;

create policy "Users can select locations for their trips"
  on public.trip_activity_locations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = trip_activity_locations.trip_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert locations for their trips"
  on public.trip_activity_locations;

create policy "Users can insert locations for their trips"
  on public.trip_activity_locations
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = trip_activity_locations.trip_id
        and t.user_id = auth.uid()
    )
  );

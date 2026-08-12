-- TripMind RAG normalization: travel_sources + travel_document_chunks
-- Run manually in the Supabase SQL Editor after 002_create_travel_rag.sql.
-- Embedding model remains gemini-embedding-001 / vector(768).
-- Does not drop legacy data immediately; renames travel_documents for rollback.

-- ---------------------------------------------------------------------------
-- 1. Normalized source pages
-- ---------------------------------------------------------------------------

create table if not exists public.travel_sources (
  id uuid primary key default gen_random_uuid(),
  destination_key text not null,
  destination_name text not null,
  country text null,
  source_type text not null,
  source_title text not null,
  source_url text not null,
  source_page_id text null,
  full_content text null,
  content_hash text not null,
  language text not null default 'en',
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint travel_sources_source_type_allowed
    check (source_type in ('wikipedia', 'wikivoyage')),
  constraint travel_sources_source_url_not_blank
    check (length(trim(source_url)) > 0),
  constraint travel_sources_content_hash_not_blank
    check (length(trim(content_hash)) > 0),
  constraint travel_sources_source_url_unique
    unique (source_url)
);

create index if not exists travel_sources_destination_key_idx
  on public.travel_sources (destination_key);

create index if not exists travel_sources_source_type_idx
  on public.travel_sources (source_type);

create index if not exists travel_sources_fetched_at_idx
  on public.travel_sources (fetched_at desc);

create or replace function public.set_travel_sources_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists travel_sources_set_updated_at on public.travel_sources;

create trigger travel_sources_set_updated_at
before update on public.travel_sources
for each row
execute function public.set_travel_sources_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Chunk rows with embeddings
-- ---------------------------------------------------------------------------

create table if not exists public.travel_document_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.travel_sources (id) on delete cascade,
  section_title text null,
  chunk_index integer not null,
  content text not null,
  content_hash text not null,
  embedding extensions.vector(768) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint travel_document_chunks_chunk_index_nonnegative
    check (chunk_index >= 0),
  constraint travel_document_chunks_content_not_blank
    check (length(trim(content)) > 0),
  constraint travel_document_chunks_source_hash_unique
    unique (source_id, content_hash)
);

create index if not exists travel_document_chunks_source_id_idx
  on public.travel_document_chunks (source_id);

create index if not exists travel_document_chunks_embedding_hnsw_idx
  on public.travel_document_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

create or replace function public.set_travel_document_chunks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists travel_document_chunks_set_updated_at
  on public.travel_document_chunks;

create trigger travel_document_chunks_set_updated_at
before update on public.travel_document_chunks
for each row
execute function public.set_travel_document_chunks_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Migrate existing travel_documents → sources + chunks
-- ---------------------------------------------------------------------------

insert into public.travel_sources (
  destination_key,
  destination_name,
  country,
  source_type,
  source_title,
  source_url,
  source_page_id,
  full_content,
  content_hash,
  language,
  fetched_at,
  created_at,
  updated_at
)
select
  (array_agg(td.destination_key order by td.fetched_at desc))[1] as destination_key,
  (array_agg(td.destination_name order by td.fetched_at desc))[1] as destination_name,
  (array_agg(td.country order by td.fetched_at desc))[1] as country,
  (array_agg(td.source_type order by td.fetched_at desc))[1] as source_type,
  (array_agg(td.source_title order by td.fetched_at desc))[1] as source_title,
  td.source_url,
  (array_agg(td.source_page_id order by td.fetched_at desc))[1] as source_page_id,
  string_agg(td.content, E'\n\n' order by td.chunk_index) as full_content,
  md5(
    td.source_url || ':' ||
    coalesce((array_agg(td.source_page_id order by td.fetched_at desc))[1], '')
  ) as content_hash,
  coalesce((array_agg(td.language order by td.fetched_at desc))[1], 'en') as language,
  max(td.fetched_at) as fetched_at,
  min(td.created_at) as created_at,
  now() as updated_at
from public.travel_documents td
group by td.source_url
on conflict (source_url) do nothing;

-- Preserve legacy chunk IDs so citation remapping stays 1:1 where possible.
insert into public.travel_document_chunks (
  id,
  source_id,
  section_title,
  chunk_index,
  content,
  content_hash,
  embedding,
  created_at,
  updated_at
)
select
  td.id,
  ts.id,
  td.section_title,
  td.chunk_index,
  td.content,
  td.content_hash,
  td.embedding,
  td.created_at,
  td.updated_at
from public.travel_documents td
inner join public.travel_sources ts on ts.source_url = td.source_url
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Update trip_citations to reference chunk + source
-- ---------------------------------------------------------------------------

alter table public.trip_citations
  add column if not exists travel_chunk_id uuid,
  add column if not exists travel_source_id uuid;

update public.trip_citations tc
set
  travel_chunk_id = coalesce(tc.travel_chunk_id, tc.travel_document_id),
  travel_source_id = coalesce(
    tc.travel_source_id,
    (
      select tdc.source_id
      from public.travel_document_chunks tdc
      where tdc.id = coalesce(tc.travel_chunk_id, tc.travel_document_id)
      limit 1
    )
  )
where tc.travel_chunk_id is null
   or tc.travel_source_id is null;

-- Drop rows that cannot be remapped (should be rare).
delete from public.trip_citations
where travel_chunk_id is null
   or travel_source_id is null;

alter table public.trip_citations
  alter column travel_chunk_id set not null,
  alter column travel_source_id set not null;

alter table public.trip_citations
  drop constraint if exists trip_citations_travel_document_id_fkey;

alter table public.trip_citations
  drop column if exists travel_document_id;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'trip_citations_travel_chunk_id_fkey'
  ) then
    alter table public.trip_citations
      add constraint trip_citations_travel_chunk_id_fkey
      foreign key (travel_chunk_id)
      references public.travel_document_chunks (id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'trip_citations_travel_source_id_fkey'
  ) then
    alter table public.trip_citations
      add constraint trip_citations_travel_source_id_fkey
      foreign key (travel_source_id)
      references public.travel_sources (id)
      on delete restrict;
  end if;
end $$;

create index if not exists trip_citations_travel_chunk_id_idx
  on public.trip_citations (travel_chunk_id);

create index if not exists trip_citations_travel_source_id_idx
  on public.trip_citations (travel_source_id);

-- ---------------------------------------------------------------------------
-- 5. Replace match RPC to join chunks → sources
-- ---------------------------------------------------------------------------

drop function if exists public.match_travel_documents(
  extensions.vector(768),
  text,
  integer,
  float
);

create or replace function public.match_travel_documents(
  query_embedding extensions.vector(768),
  match_destination text,
  match_count integer default 12,
  similarity_threshold float default 0.45
)
returns table (
  id uuid,
  source_id uuid,
  destination_name text,
  country text,
  source_type text,
  source_title text,
  source_url text,
  section_title text,
  content text,
  similarity float
)
language sql
stable
as $$
  select
    c.id,
    s.id as source_id,
    s.destination_name,
    s.country,
    s.source_type,
    s.source_title,
    s.source_url,
    c.section_title,
    c.content,
    (1 - (c.embedding <=> query_embedding))::float as similarity
  from public.travel_document_chunks c
  inner join public.travel_sources s on s.id = c.source_id
  where s.destination_key = match_destination
    and (1 - (c.embedding <=> query_embedding)) >= similarity_threshold
  order by c.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

grant execute on function public.match_travel_documents(
  extensions.vector(768),
  text,
  integer,
  float
) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. RLS for normalized tables
-- ---------------------------------------------------------------------------

alter table public.travel_sources enable row level security;
alter table public.travel_document_chunks enable row level security;

drop policy if exists "Authenticated users can select travel sources"
  on public.travel_sources;

create policy "Authenticated users can select travel sources"
  on public.travel_sources
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can select travel document chunks"
  on public.travel_document_chunks;

create policy "Authenticated users can select travel document chunks"
  on public.travel_document_chunks
  for select
  to authenticated
  using (true);

-- No insert/update/delete policies for authenticated/anon.
-- Ingestion continues through the server-only service role client.

-- ---------------------------------------------------------------------------
-- 7. Safe rollback rename (do not drop yet)
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'travel_documents'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'travel_documents_legacy'
  ) then
    alter table public.travel_documents rename to travel_documents_legacy;
  end if;
end $$;

-- Optional verification queries (run manually after migration):
-- select count(*) as source_count from public.travel_sources;
-- select count(*) as chunk_count from public.travel_document_chunks;
-- select count(*) from public.travel_document_chunks c
--   left join public.travel_sources s on s.id = c.source_id
--   where s.id is null;
-- select count(*) from public.trip_citations
--   where travel_chunk_id is null or travel_source_id is null;

-- TripMind Phase 1 RAG: travel documents, pgvector match, trip citations
-- Run manually in the Supabase SQL Editor.
-- Embedding model: gemini-embedding-001 with output_dimensionality = 768

create extension if not exists vector with schema extensions;

create table if not exists public.travel_documents (
  id uuid primary key default gen_random_uuid(),
  destination_key text not null,
  destination_name text not null,
  country text null,
  source_type text not null,
  source_title text not null,
  source_url text not null,
  source_page_id text null,
  section_title text null,
  chunk_index integer not null,
  content text not null,
  content_hash text not null,
  embedding extensions.vector(768) not null,
  language text not null default 'en',
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint travel_documents_source_type_allowed
    check (source_type in ('wikipedia', 'wikivoyage')),
  constraint travel_documents_chunk_index_nonnegative
    check (chunk_index >= 0),
  constraint travel_documents_content_not_blank
    check (length(trim(content)) > 0),
  constraint travel_documents_source_url_not_blank
    check (length(trim(source_url)) > 0),
  constraint travel_documents_source_url_hash_unique
    unique (source_url, content_hash)
);

create index if not exists travel_documents_destination_key_idx
  on public.travel_documents (destination_key);

create index if not exists travel_documents_source_type_idx
  on public.travel_documents (source_type);

create index if not exists travel_documents_fetched_at_idx
  on public.travel_documents (fetched_at desc);

create index if not exists travel_documents_embedding_hnsw_idx
  on public.travel_documents
  using hnsw (embedding extensions.vector_cosine_ops);

create or replace function public.set_travel_documents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists travel_documents_set_updated_at on public.travel_documents;

create trigger travel_documents_set_updated_at
before update on public.travel_documents
for each row
execute function public.set_travel_documents_updated_at();

create or replace function public.match_travel_documents(
  query_embedding extensions.vector(768),
  match_destination text,
  match_count integer default 12,
  similarity_threshold float default 0.45
)
returns table (
  id uuid,
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
    td.id,
    td.destination_name,
    td.country,
    td.source_type,
    td.source_title,
    td.source_url,
    td.section_title,
    td.content,
    (1 - (td.embedding <=> query_embedding))::float as similarity
  from public.travel_documents td
  where td.destination_key = match_destination
    and (1 - (td.embedding <=> query_embedding)) >= similarity_threshold
  order by td.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

alter table public.travel_documents enable row level security;

drop policy if exists "Authenticated users can select travel documents"
  on public.travel_documents;

create policy "Authenticated users can select travel documents"
  on public.travel_documents
  for select
  to authenticated
  using (true);

-- No insert/update/delete policies for authenticated/anon.
-- Ingestion uses the server-only service role client.

create table if not exists public.trip_citations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  travel_document_id uuid not null references public.travel_documents (id),
  citation_key text not null,
  source_type text not null,
  source_title text not null,
  source_url text not null,
  section_title text null,
  created_at timestamptz not null default now(),

  constraint trip_citations_source_type_allowed
    check (source_type in ('wikipedia', 'wikivoyage')),
  constraint trip_citations_trip_citation_key_unique
    unique (trip_id, citation_key)
);

create index if not exists trip_citations_trip_id_idx
  on public.trip_citations (trip_id);

alter table public.trip_citations enable row level security;

drop policy if exists "Users can select citations for their trips"
  on public.trip_citations;

create policy "Users can select citations for their trips"
  on public.trip_citations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = trip_citations.trip_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert citations for their trips"
  on public.trip_citations;

create policy "Users can insert citations for their trips"
  on public.trip_citations
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = trip_citations.trip_id
        and t.user_id = auth.uid()
    )
  );

grant execute on function public.match_travel_documents(
  extensions.vector(768),
  text,
  integer,
  float
) to authenticated;

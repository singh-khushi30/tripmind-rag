import "server-only";

import { TripGenerationError } from "@/lib/gemini/errors";
import { chunkMediaWikiPages, type TravelChunk } from "@/lib/rag/chunking";
import {
  GEMINI_EMBEDDING_DIMENSIONS,
  RAG_FRESHNESS_DAYS,
  RAG_MIN_CHUNKS,
} from "@/lib/rag/constants";
import { normalizeDestinationKey } from "@/lib/rag/destination";
import {
  assertAllEmbeddingsDimension,
  assertEmbeddingDimension,
} from "@/lib/rag/embedding-utils";
import { embedDocuments } from "@/lib/rag/embeddings";
import { groundingFailureError } from "@/lib/rag/errors";
import { ragLog } from "@/lib/rag/log";
import { groupChunksBySourceUrl } from "@/lib/rag/normalize-sources";
import { selectChunksForEmbedding } from "@/lib/rag/select-chunks";
import { fetchWikipediaForDestination } from "@/lib/rag/sources/wikipedia";
import { fetchWikivoyageForDestination } from "@/lib/rag/sources/wikivoyage";
import { createAdminClient } from "@/lib/supabase/admin";

export type IngestionSummary = {
  destination_key: string;
  destination_name: string;
  sources_fetched: Array<"wikipedia" | "wikivoyage">;
  source_status: Record<"wikipedia" | "wikivoyage", "ok" | "failed" | "skipped">;
  pages_fetched: number;
  chunks_created: number;
  chunks_reused: number;
  embedding_count: number;
  embedding_dimensions: number;
  failures: Partial<
    Record<"wikipedia" | "wikivoyage" | "embedding" | "upsert", string>
  >;
  reused_existing: boolean;
};

function freshnessCutoff() {
  return new Date(
    Date.now() - RAG_FRESHNESS_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

async function countFreshSourcesAndChunks(destinationKey: string) {
  const admin = createAdminClient();
  const { data: sources, error: sourceError } = await admin
    .from("travel_sources")
    .select("id")
    .eq("destination_key", destinationKey)
    .gte("fetched_at", freshnessCutoff());

  if (sourceError) {
    throw sourceError;
  }

  const sourceIds = (sources ?? []).map((source) => source.id);
  if (sourceIds.length === 0) {
    return { sourcesReused: 0, chunksReused: 0 };
  }

  const { count, error } = await admin
    .from("travel_document_chunks")
    .select("id", { count: "exact", head: true })
    .in("source_id", sourceIds);

  if (error) {
    throw error;
  }

  return {
    sourcesReused: sourceIds.length,
    chunksReused: count ?? 0,
  };
}

async function findExistingChunkHashes(hashes: string[]) {
  if (hashes.length === 0) return new Set<string>();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("travel_document_chunks")
    .select("content_hash")
    .in("content_hash", hashes);

  if (error) {
    throw error;
  }

  return new Set((data ?? []).map((row) => row.content_hash));
}

async function upsertSources(chunks: TravelChunk[]) {
  const admin = createAdminClient();
  const sources = groupChunksBySourceUrl(chunks).map((source) => ({
    ...source,
    fetched_at: new Date().toISOString(),
  }));

  if (sources.length === 0) return new Map<string, string>();

  const { data, error } = await admin
    .from("travel_sources")
    .upsert(sources, {
      onConflict: "source_url",
      ignoreDuplicates: false,
    })
    .select("id, source_url");

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((row) => [row.source_url, row.id]));
}

async function upsertChunks(
  chunks: TravelChunk[],
  embeddings: number[][],
  sourceIdsByUrl: Map<string, string>,
) {
  assertAllEmbeddingsDimension(embeddings);
  if (chunks.length !== embeddings.length) {
    throw new Error("Chunk/embedding count mismatch before upsert");
  }

  const admin = createAdminClient();
  const rows = chunks.map((chunk, index) => {
    const sourceId = sourceIdsByUrl.get(chunk.source_url);
    if (!sourceId) {
      throw new Error(`Missing travel_sources id for ${chunk.source_url}`);
    }

    const embedding = assertEmbeddingDimension(embeddings[index]);
    return {
      source_id: sourceId,
      section_title: chunk.section_title,
      chunk_index: chunk.chunk_index,
      content: chunk.content,
      content_hash: chunk.content_hash,
      embedding: embedding as unknown as string,
    };
  });

  const { error } = await admin.from("travel_document_chunks").upsert(rows, {
    onConflict: "source_id,content_hash",
    ignoreDuplicates: false,
  });

  if (error) {
    throw error;
  }
}

export async function ingestDestination(
  destination: string,
): Promise<IngestionSummary> {
  const normalized = normalizeDestinationKey(destination);
  const failures: IngestionSummary["failures"] = {};
  const source_status: IngestionSummary["source_status"] = {
    wikipedia: "skipped",
    wikivoyage: "skipped",
  };

  ragLog("ingest.start", {
    destination_key: normalized.destination_key,
    destination_name: normalized.destination_name,
  });

  const fresh = await countFreshSourcesAndChunks(normalized.destination_key);
  if (fresh.chunksReused >= RAG_MIN_CHUNKS) {
    const summary: IngestionSummary = {
      destination_key: normalized.destination_key,
      destination_name: normalized.destination_name,
      sources_fetched: [],
      source_status,
      pages_fetched: 0,
      chunks_created: 0,
      chunks_reused: fresh.chunksReused,
      embedding_count: 0,
      embedding_dimensions: GEMINI_EMBEDDING_DIMENSIONS,
      failures,
      reused_existing: true,
    };

    ragLog("ingest.reuse", {
      destination_key: summary.destination_key,
      sources_reused: fresh.sourcesReused,
      chunks_reused: summary.chunks_reused,
      pages_fetched: 0,
      chunks_created: 0,
      embedding_count: 0,
    });

    return summary;
  }

  const sources_fetched: Array<"wikipedia" | "wikivoyage"> = [];
  let pages_fetched = 0;
  const chunks: TravelChunk[] = [];

  try {
    const wikiPages = await fetchWikipediaForDestination(
      normalized.destination_name,
    );
    sources_fetched.push("wikipedia");
    source_status.wikipedia = "ok";
    pages_fetched += wikiPages.length;
    chunks.push(
      ...chunkMediaWikiPages({
        pages: wikiPages,
        sourceType: "wikipedia",
        destination: normalized,
      }),
    );
    ragLog("ingest.source", {
      destination_key: normalized.destination_key,
      source: "wikipedia",
      status: "ok",
      pages_fetched: wikiPages.length,
    });
  } catch (error) {
    source_status.wikipedia = "failed";
    failures.wikipedia =
      error instanceof Error ? error.message : "Wikipedia fetch failed";
    ragLog("ingest.source", {
      destination_key: normalized.destination_key,
      source: "wikipedia",
      status: "failed",
    });
  }

  try {
    const voyagePages = await fetchWikivoyageForDestination(
      normalized.destination_name,
    );
    sources_fetched.push("wikivoyage");
    source_status.wikivoyage = "ok";
    pages_fetched += voyagePages.length;
    chunks.push(
      ...chunkMediaWikiPages({
        pages: voyagePages,
        sourceType: "wikivoyage",
        destination: normalized,
      }),
    );
    ragLog("ingest.source", {
      destination_key: normalized.destination_key,
      source: "wikivoyage",
      status: "ok",
      pages_fetched: voyagePages.length,
    });
  } catch (error) {
    source_status.wikivoyage = "failed";
    failures.wikivoyage =
      error instanceof Error ? error.message : "Wikivoyage fetch failed";
    ragLog("ingest.source", {
      destination_key: normalized.destination_key,
      source: "wikivoyage",
      status: "failed",
    });
  }

  const selectedChunks = selectChunksForEmbedding(chunks);

  ragLog("ingest.chunks_selected", {
    destination_key: normalized.destination_key,
    chunks_generated: chunks.length,
    chunks_selected: selectedChunks.length,
    source_rows: groupChunksBySourceUrl(selectedChunks).length,
    pages_fetched,
  });

  if (selectedChunks.length < RAG_MIN_CHUNKS) {
    ragLog("ingest.insufficient_chunks", {
      destination_key: normalized.destination_key,
      chunks_generated: selectedChunks.length,
      pages_fetched,
    });
    throw groundingFailureError({ failures, chunks: selectedChunks.length });
  }

  const existingHashes = await findExistingChunkHashes(
    selectedChunks.map((chunk) => chunk.content_hash),
  );
  const newChunks = selectedChunks.filter(
    (chunk) => !existingHashes.has(chunk.content_hash),
  );
  const reusedHashes = selectedChunks.length - newChunks.length;

  let embeddings: number[][] = [];
  try {
    if (newChunks.length > 0) {
      embeddings = await embedDocuments(
        newChunks.map((chunk) => chunk.content),
      );
      assertAllEmbeddingsDimension(embeddings);
    }
  } catch (error) {
    failures.embedding =
      error instanceof Error ? error.message : "Embedding failed";
    ragLog("ingest.embedding_failed", {
      destination_key: normalized.destination_key,
      chunks_to_embed: newChunks.length,
    });
    if (error instanceof TripGenerationError) {
      throw error;
    }
    if (
      failures.embedding.toLowerCase().includes("429") ||
      failures.embedding.toLowerCase().includes("quota") ||
      failures.embedding.toLowerCase().includes("resource_exhausted")
    ) {
      throw new TripGenerationError(
        "RATE_LIMIT",
        "Gemini embedding quota exceeded",
        { failures },
      );
    }
    throw groundingFailureError({ failures });
  }

  try {
    // Always refresh source metadata for selected pages; embed only new chunks.
    const sourceIdsByUrl = await upsertSources(selectedChunks);
    if (newChunks.length > 0) {
      await upsertChunks(newChunks, embeddings, sourceIdsByUrl);
    }
  } catch (error) {
    failures.upsert =
      error instanceof Error ? error.message : "Vector upsert failed";
    ragLog("ingest.upsert_failed", {
      destination_key: normalized.destination_key,
      chunks_to_upsert: newChunks.length,
    });
    throw groundingFailureError({ failures });
  }

  const summary: IngestionSummary = {
    destination_key: normalized.destination_key,
    destination_name: normalized.destination_name,
    sources_fetched,
    source_status,
    pages_fetched,
    chunks_created: newChunks.length,
    chunks_reused: reusedHashes,
    embedding_count: embeddings.length,
    embedding_dimensions: GEMINI_EMBEDDING_DIMENSIONS,
    failures,
    reused_existing: false,
  };

  ragLog("ingest.complete", {
    destination_key: summary.destination_key,
    sources_fetched: summary.sources_fetched,
    unique_sources_count: groupChunksBySourceUrl(selectedChunks).length,
    pages_fetched: summary.pages_fetched,
    chunks_created: summary.chunks_created,
    chunks_reused: summary.chunks_reused,
    embedding_count: summary.embedding_count,
    embedding_dimensions: summary.embedding_dimensions,
  });

  return summary;
}

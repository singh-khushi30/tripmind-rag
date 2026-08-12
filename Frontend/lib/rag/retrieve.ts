import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { TripPlannerInput } from "@/lib/gemini/types";
import {
  RAG_MATCH_COUNT,
  RAG_MAX_CONTEXT_CHARS,
  RAG_MIN_CHUNKS,
  RAG_SIMILARITY_THRESHOLD,
} from "@/lib/rag/constants";
import { normalizeDestinationKey } from "@/lib/rag/destination";
import { embedQuery } from "@/lib/rag/embeddings";
import { groundingFailureError } from "@/lib/rag/errors";
import { ragLog } from "@/lib/rag/log";
import {
  diversifyChunks,
  type SelectedChunk,
} from "@/lib/rag/retrieve-select";
import { sanitizeRetrievedContent } from "@/lib/rag/sanitize";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type RetrievedTravelChunk = SelectedChunk & {
  fetched_at?: string | null;
};

export type TravelRetrievalResult = {
  destination_key: string;
  chunks: RetrievedTravelChunk[];
  contextBlock: string;
  citationKeys: string[];
  uniqueSourceCount: number;
};

function buildRetrievalQuery(input: TripPlannerInput): string {
  return [
    `Travel guide for ${input.destination}`,
    `Interests: ${input.interests.join(", ")}`,
    `Travel style: ${input.travel_style}`,
    `Travel pace: ${input.travel_pace}`,
    `Food preference: ${input.food_preference ?? "local food"}`,
    `Trip length: ${input.number_of_days} days`,
    "Focus on neighborhoods, attractions, food, getting around, and practical travel tips.",
  ].join(". ");
}

function buildContextBlock(chunks: RetrievedTravelChunk[]): string {
  let used = 0;
  const blocks: string[] = [];

  for (const chunk of chunks) {
    const block = [
      `[${chunk.travel_chunk_id}]`,
      `Chunk ID: ${chunk.travel_chunk_id}`,
      `Source ID: ${chunk.travel_source_id}`,
      `Source Type: ${chunk.source_type}`,
      `Source Title: ${chunk.source_title}`,
      `Source URL: ${chunk.source_url}`,
      `Section: ${chunk.section_title ?? "Overview"}`,
      `Content: ${sanitizeRetrievedContent(chunk.content)}`,
    ].join("\n");

    if (used + block.length > RAG_MAX_CONTEXT_CHARS) break;
    blocks.push(block);
    used += block.length;
  }

  return blocks.join("\n\n");
}

export async function retrieveTravelContextWithClient(
  supabase: SupabaseClient<Database>,
  input: TripPlannerInput,
): Promise<TravelRetrievalResult> {
  const normalized = normalizeDestinationKey(input.destination);
  const query = buildRetrievalQuery(input);
  const queryEmbedding = await embedQuery(query);

  ragLog("retrieve.start", {
    destination_key: normalized.destination_key,
    match_count: RAG_MATCH_COUNT,
    similarity_threshold: RAG_SIMILARITY_THRESHOLD,
  });

  // Normalized RPC: travel_document_chunks ⨝ travel_sources
  const { data, error } = await supabase.rpc("match_travel_documents", {
    query_embedding: queryEmbedding as unknown as string,
    match_destination: normalized.destination_key,
    match_count: Math.min(15, RAG_MATCH_COUNT + 3),
    similarity_threshold: RAG_SIMILARITY_THRESHOLD,
  });

  if (error) {
    ragLog("retrieve.rpc_failed", {
      destination_key: normalized.destination_key,
    });
    throw groundingFailureError(error);
  }

  const chunks = diversifyChunks(data ?? [], RAG_MATCH_COUNT);
  if (chunks.length < Math.min(RAG_MIN_CHUNKS, 3)) {
    ragLog("retrieve.insufficient", {
      destination_key: normalized.destination_key,
      retrieval_count: chunks.length,
    });
    throw groundingFailureError({
      reason: "too_few_chunks",
      count: chunks.length,
    });
  }

  const contextBlock = buildContextBlock(chunks);
  if (!contextBlock.trim()) {
    throw groundingFailureError({ reason: "empty_context" });
  }

  const citationKeys = chunks.map((chunk) => chunk.travel_chunk_id);
  const uniqueSourceCount = new Set(
    chunks.map((chunk) => chunk.travel_source_id),
  ).size;

  ragLog("retrieve.complete", {
    destination_key: normalized.destination_key,
    retrieved_chunks_count: chunks.length,
    unique_sources_count: uniqueSourceCount,
    citation_count: citationKeys.length,
  });

  return {
    destination_key: normalized.destination_key,
    chunks,
    contextBlock,
    citationKeys,
    uniqueSourceCount,
  };
}

/** Authenticated server-client retrieval for user request paths. */
export async function retrieveTravelContext(
  input: TripPlannerInput,
): Promise<TravelRetrievalResult> {
  const supabase = await createClient();
  return retrieveTravelContextWithClient(supabase, input);
}

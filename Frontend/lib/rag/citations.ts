import { TripGenerationError } from "@/lib/gemini/errors";
import type { ItineraryData } from "@/lib/gemini/schema";
import { ragLog } from "@/lib/rag/log";
import type { RetrievedTravelChunk } from "@/lib/rag/retrieve";

/**
 * Allowed citation IDs are travel_document_chunks.id values from retrieval.
 */
export function assertValidCitationIds(
  itinerary: ItineraryData,
  allowedChunkIds: string[],
): ItineraryData {
  const allowed = new Set(allowedChunkIds);
  const fallback = allowedChunkIds[0];

  if (!fallback) {
    throw new TripGenerationError(
      "INVALID_RESPONSE",
      "INSUFFICIENT_GROUNDING_CONTEXT",
    );
  }

  let validatedCount = 0;

  const days = itinerary.days.map((day) => ({
    ...day,
    activities: day.activities.map((activity) => {
      const provided = activity.citation_ids ?? [];
      const fabricated = provided.filter((id) => !allowed.has(id));
      if (fabricated.length > 0) {
        ragLog("citations.fabricated", {
          fabricated_count: fabricated.length,
          allowed_count: allowedChunkIds.length,
        });
        throw new TripGenerationError(
          "INVALID_RESPONSE",
          "Fabricated citation IDs are not allowed",
        );
      }

      const valid = provided.filter((id) => allowed.has(id));
      validatedCount += valid.length > 0 ? valid.length : 1;
      return {
        ...activity,
        citation_ids: valid.length > 0 ? valid : [fallback],
      };
    }),
  }));

  ragLog("citations.validated", {
    citation_validation_count: validatedCount,
    allowed_count: allowedChunkIds.length,
  });

  return {
    ...itinerary,
    days,
  };
}

export function citationsFromRetrieval(
  tripId: string,
  chunks: RetrievedTravelChunk[],
  usedChunkIds: Set<string>,
) {
  return chunks
    .filter((chunk) => usedChunkIds.has(chunk.travel_chunk_id))
    .map((chunk) => ({
      trip_id: tripId,
      travel_chunk_id: chunk.travel_chunk_id,
      travel_source_id: chunk.travel_source_id,
      // Stable key = chunk id (matches activity.citation_ids).
      citation_key: chunk.travel_chunk_id,
      // Metadata always comes from retrieved travel_sources rows, never Gemini.
      source_type: chunk.source_type,
      source_title: chunk.source_title,
      source_url: chunk.source_url,
      section_title: chunk.section_title,
    }));
}

export function collectUsedCitationKeys(itinerary: ItineraryData): Set<string> {
  const keys = new Set<string>();
  for (const day of itinerary.days) {
    for (const activity of day.activities) {
      for (const id of activity.citation_ids ?? []) {
        keys.add(id);
      }
    }
  }
  return keys;
}

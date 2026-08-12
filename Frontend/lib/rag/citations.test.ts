import { describe, expect, it } from "vitest";

import { TripGenerationError } from "@/lib/gemini/errors";
import type { ItineraryData } from "@/lib/gemini/schema";
import {
  assertValidCitationIds,
  citationsFromRetrieval,
  collectUsedCitationKeys,
} from "@/lib/rag/citations";
import type { RetrievedTravelChunk } from "@/lib/rag/retrieve";

const CHUNK_A = "11111111-1111-1111-1111-111111111111";
const CHUNK_B = "22222222-2222-2222-2222-222222222222";
const SOURCE_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function itineraryWithCitations(citationIds: string[]): ItineraryData {
  return {
    destination: "Paris",
    country: "France",
    summary: "A short Paris plan.",
    currency: "USD",
    estimated_total_cost: 400,
    budget_status: "within_budget",
    days: [
      {
        day_number: 1,
        title: "Central Paris",
        summary: "Museums and neighborhoods.",
        estimated_day_cost: 100,
        activities: [
          {
            start_time: "09:00",
            title: "Louvre visit",
            description: "Morning museum visit.",
            category: "Culture",
            estimated_cost: 20,
            duration_minutes: 120,
            location_name: "Louvre",
            neighborhood: "1st",
            indoor_outdoor: "indoor",
            reservation_required: false,
            notes: null,
            citation_ids: citationIds,
          },
        ],
      },
    ],
  };
}

describe("citation validation", () => {
  it("accepts grounded chunk IDs from retrieval", () => {
    const result = assertValidCitationIds(itineraryWithCitations([CHUNK_A]), [
      CHUNK_A,
      CHUNK_B,
    ]);
    expect(result.days[0]?.activities[0]?.citation_ids).toEqual([CHUNK_A]);
  });

  it("rejects fabricated citation IDs", () => {
    expect(() =>
      assertValidCitationIds(itineraryWithCitations(["made_up"]), [CHUNK_A]),
    ).toThrow(TripGenerationError);
  });

  it("collects used citation chunk IDs", () => {
    const keys = collectUsedCitationKeys(
      itineraryWithCitations([CHUNK_A, CHUNK_B]),
    );
    expect(keys.has(CHUNK_A)).toBe(true);
    expect(keys.has(CHUNK_B)).toBe(true);
  });

  it("citation insert payload uses chunk_id + source_id", () => {
    const chunks: RetrievedTravelChunk[] = [
      {
        citation_key: CHUNK_A,
        travel_chunk_id: CHUNK_A,
        travel_source_id: SOURCE_A,
        destination_name: "Paris",
        country: "France",
        source_type: "wikipedia",
        source_title: "Paris",
        source_url: "https://en.wikipedia.org/wiki/Paris",
        section_title: "See",
        content: "Louvre content",
        similarity: 0.8,
      },
    ];

    const rows = citationsFromRetrieval("trip-1", chunks, new Set([CHUNK_A]));
    expect(rows).toEqual([
      {
        trip_id: "trip-1",
        travel_chunk_id: CHUNK_A,
        travel_source_id: SOURCE_A,
        citation_key: CHUNK_A,
        source_type: "wikipedia",
        source_title: "Paris",
        source_url: "https://en.wikipedia.org/wiki/Paris",
        section_title: "See",
      },
    ]);
    expect(JSON.stringify(rows)).not.toContain("travel_document_id");
  });
});

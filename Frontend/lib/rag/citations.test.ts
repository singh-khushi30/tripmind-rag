import { describe, expect, it } from "vitest";

import { TripGenerationError } from "@/lib/gemini/errors";
import type { ItineraryData } from "@/lib/gemini/schema";
import {
  assertValidCitationIds,
  collectUsedCitationKeys,
} from "@/lib/rag/citations";

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
  it("accepts grounded citation IDs from retrieval", () => {
    const result = assertValidCitationIds(itineraryWithCitations(["src_1"]), [
      "src_1",
      "src_2",
    ]);
    expect(result.days[0]?.activities[0]?.citation_ids).toEqual(["src_1"]);
  });

  it("rejects fabricated citation IDs", () => {
    expect(() =>
      assertValidCitationIds(itineraryWithCitations(["made_up"]), ["src_1"]),
    ).toThrow(TripGenerationError);
  });

  it("collects used citation keys", () => {
    const keys = collectUsedCitationKeys(
      itineraryWithCitations(["src_1", "src_2"]),
    );
    expect(keys.has("src_1")).toBe(true);
    expect(keys.has("src_2")).toBe(true);
  });
});

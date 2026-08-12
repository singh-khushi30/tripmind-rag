import { describe, expect, it } from "vitest";

import { dedupeCitationsBySourceId } from "@/lib/trip/dedupe-sources";
import type { TripCitationSource } from "@/types/trip";

function citation(
  overrides: Partial<TripCitationSource> &
    Pick<TripCitationSource, "travel_source_id" | "travel_chunk_id">,
): TripCitationSource {
  return {
    citation_key: overrides.travel_chunk_id,
    source_type: "wikipedia",
    source_title: "Paris",
    source_url: "https://en.wikipedia.org/wiki/Paris",
    section_title: "See",
    fetched_at: null,
    ...overrides,
  };
}

describe("dedupeCitationsBySourceId", () => {
  it("shows one Sources Used entry even when many chunks share a source", () => {
    const citations = [
      citation({
        travel_source_id: "source-wiki",
        travel_chunk_id: "chunk-1",
        section_title: "See",
      }),
      citation({
        travel_source_id: "source-wiki",
        travel_chunk_id: "chunk-2",
        section_title: "History",
      }),
      citation({
        travel_source_id: "source-wiki",
        travel_chunk_id: "chunk-3",
        section_title: "Culture",
      }),
      citation({
        travel_source_id: "source-voyage",
        travel_chunk_id: "chunk-4",
        source_type: "wikivoyage",
        source_url: "https://en.wikivoyage.org/wiki/Paris",
        section_title: "Eat",
      }),
    ];

    const unique = dedupeCitationsBySourceId(citations);
    expect(unique).toHaveLength(2);
    expect(unique.map((item) => item.travel_source_id).sort()).toEqual([
      "source-voyage",
      "source-wiki",
    ]);
  });
});

import { describe, expect, it } from "vitest";

import {
  diversifyChunks,
  filterByDestinationKey,
  filterBySimilarity,
  type MatchRow,
} from "@/lib/rag/retrieve-select";

function row(
  overrides: Partial<MatchRow> & Pick<MatchRow, "id" | "source_type">,
): MatchRow {
  return {
    source_id: `source-${overrides.id}`,
    destination_name: "Paris",
    country: "France",
    source_title: "Paris",
    source_url: `https://example.com/${overrides.id}`,
    section_title: "See",
    content: `Unique content for ${overrides.id}`,
    similarity: 0.9,
    ...overrides,
  };
}

describe("retrieval filters", () => {
  it("enforces similarity threshold", () => {
    const rows = [
      row({ id: "1", source_type: "wikipedia", similarity: 0.8 }),
      row({ id: "2", source_type: "wikivoyage", similarity: 0.2 }),
    ];
    expect(filterBySimilarity(rows, 0.45).map((item) => item.id)).toEqual([
      "1",
    ]);
  });

  it("prevents cross-destination context", () => {
    const rows = [
      {
        ...row({ id: "1", source_type: "wikipedia" }),
        destination_key: "paris",
      },
      {
        ...row({ id: "2", source_type: "wikivoyage" }),
        destination_key: "london",
      },
    ];
    expect(
      filterByDestinationKey(rows, "paris").map((item) => item.id),
    ).toEqual(["1"]);
  });
});

describe("diversifyChunks", () => {
  it("filters by destination-compatible source types only", () => {
    const selected = diversifyChunks([
      row({ id: "chunk-1", source_type: "wikipedia" }),
      row({ id: "chunk-2", source_type: "blog" }),
      row({ id: "chunk-3", source_type: "wikivoyage" }),
    ]);

    expect(selected.map((chunk) => chunk.source_type)).toEqual([
      "wikipedia",
      "wikivoyage",
    ]);
  });

  it("uses chunk UUIDs as citation IDs and returns source metadata", () => {
    const selected = diversifyChunks([
      row({
        id: "11111111-1111-1111-1111-111111111111",
        source_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        source_type: "wikipedia",
        source_url: "https://en.wikipedia.org/wiki/Paris",
        section_title: "See",
        similarity: 0.95,
      }),
      row({
        id: "22222222-2222-2222-2222-222222222222",
        source_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        source_type: "wikipedia",
        source_url: "https://en.wikipedia.org/wiki/Paris",
        section_title: "See",
        content: "duplicate section content about museums",
        similarity: 0.94,
      }),
      row({
        id: "33333333-3333-3333-3333-333333333333",
        source_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        source_type: "wikivoyage",
        source_url: "https://en.wikivoyage.org/wiki/Paris",
        section_title: "Eat",
        similarity: 0.93,
      }),
    ]);

    expect(selected[0]?.citation_key).toBe(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(selected[0]?.travel_chunk_id).toBe(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(selected[0]?.travel_source_id).toBe(
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    );
    expect(selected.some((chunk) => chunk.travel_chunk_id.startsWith("2222"))).toBe(
      false,
    );
    expect(selected[1]?.source_type).toBe("wikivoyage");
  });
});

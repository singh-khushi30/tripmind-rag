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
      row({ id: "1", source_type: "wikipedia" }),
      row({ id: "2", source_type: "blog" }),
      row({ id: "3", source_type: "wikivoyage" }),
    ]);

    expect(selected.map((chunk) => chunk.source_type)).toEqual([
      "wikipedia",
      "wikivoyage",
    ]);
  });

  it("returns source metadata and skips near-duplicate sections", () => {
    const selected = diversifyChunks([
      row({
        id: "1",
        source_id: "src-wiki",
        source_type: "wikipedia",
        source_url: "https://en.wikipedia.org/wiki/Paris",
        section_title: "See",
        similarity: 0.95,
      }),
      row({
        id: "2",
        source_id: "src-wiki",
        source_type: "wikipedia",
        source_url: "https://en.wikipedia.org/wiki/Paris",
        section_title: "See",
        content: "duplicate section content about museums",
        similarity: 0.94,
      }),
      row({
        id: "3",
        source_id: "src-voyage",
        source_type: "wikivoyage",
        source_url: "https://en.wikivoyage.org/wiki/Paris",
        section_title: "Eat",
        similarity: 0.93,
      }),
      row({
        id: "4",
        source_id: "src-louvre",
        source_type: "wikipedia",
        source_url: "https://en.wikipedia.org/wiki/Louvre",
        section_title: "History",
        similarity: 0.92,
      }),
    ]);

    expect(selected[0]?.source_type).toBe("wikipedia");
    expect(selected[1]?.source_type).toBe("wikivoyage");
    expect(selected.some((chunk) => chunk.travel_chunk_id === "2")).toBe(false);
    expect(selected[0]?.travel_source_id).toBe("src-wiki");
    expect(selected[0]?.source_url).toContain("wikipedia.org");
    expect(selected.map((chunk) => chunk.citation_key)).toEqual([
      "src_1",
      "src_2",
      "src_3",
    ]);
  });
});

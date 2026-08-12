import { describe, expect, it } from "vitest";

import type { TravelChunk } from "@/lib/rag/chunking";
import { selectChunksForEmbedding } from "@/lib/rag/select-chunks";

function chunk(
  overrides: Partial<TravelChunk> &
    Pick<TravelChunk, "source_type" | "section_title" | "content_hash">,
): TravelChunk {
  return {
    destination_key: "san-francisco",
    destination_name: "San Francisco",
    country: "United States",
    source_title: "San Francisco",
    source_url: `https://example.com/${overrides.content_hash}`,
    source_page_id: "1",
    source_full_content: "A".repeat(400),
    source_content_hash: `source-${overrides.content_hash}`,
    chunk_index: 0,
    content: "A".repeat(400),
    language: "en",
    ...overrides,
  };
}

describe("selectChunksForEmbedding", () => {
  it("prefers Wikivoyage travel sections over Wikipedia history", () => {
    const selected = selectChunksForEmbedding(
      [
        chunk({
          source_type: "wikipedia",
          section_title: "Spanish era (1769–1821)",
          content_hash: "hist",
        }),
        chunk({
          source_type: "wikivoyage",
          section_title: "Eat",
          content_hash: "eat",
        }),
        chunk({
          source_type: "wikivoyage",
          section_title: "See",
          content_hash: "see",
        }),
      ],
      2,
    );

    expect(selected.map((item) => item.section_title)).toEqual(["Eat", "See"]);
  });

  it("caps the number of chunks", () => {
    const chunks = Array.from({ length: 50 }, (_, index) =>
      chunk({
        source_type: index % 2 === 0 ? "wikivoyage" : "wikipedia",
        section_title: index % 2 === 0 ? "Do" : "Overview",
        content_hash: `h${index}`,
      }),
    );

    expect(selectChunksForEmbedding(chunks, 10)).toHaveLength(10);
  });
});

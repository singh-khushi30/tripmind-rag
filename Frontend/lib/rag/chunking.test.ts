import { describe, expect, it } from "vitest";

import { chunkMediaWikiPages, hashContent } from "@/lib/rag/chunking";
import type { MediaWikiPage } from "@/lib/rag/sources/mediawiki-parse";

const longSection = `${"Paris has walkable neighborhoods and museums. ".repeat(80)}`;

function page(overrides: Partial<MediaWikiPage> = {}): MediaWikiPage {
  return {
    title: "Paris",
    pageId: 1,
    url: "https://en.wikipedia.org/wiki/Paris",
    extract: longSection,
    sections: [{ title: "See", content: longSection }],
    isDisambiguation: false,
    ...overrides,
  };
}

describe("chunking", () => {
  it("creates deterministic content hashes", () => {
    const a = hashContent("same content");
    const b = hashContent("same content");
    expect(a).toBe(b);
    expect(hashContent("different")).not.toBe(a);
  });

  it("splits long sections with overlap and avoids tiny chunks", () => {
    const chunks = chunkMediaWikiPages({
      pages: [page()],
      sourceType: "wikipedia",
      destination: {
        destination_key: "paris",
        destination_name: "Paris",
        display_name: "Paris",
      },
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.content.length >= 200)).toBe(true);
    expect(chunks[0]?.chunk_index).toBe(0);
    expect(chunks[1]?.chunk_index).toBe(1);
  });

  it("deduplicates identical chunks and never mixes source URLs", () => {
    const duplicate = page();
    const other = page({
      title: "Paris travel",
      url: "https://en.wikivoyage.org/wiki/Paris",
      pageId: 2,
    });

    const chunks = chunkMediaWikiPages({
      pages: [duplicate, duplicate, other],
      sourceType: "wikipedia",
      destination: {
        destination_key: "paris",
        destination_name: "Paris",
        display_name: "Paris",
      },
    });

    const hashes = chunks.map((chunk) => chunk.content_hash);
    expect(new Set(hashes).size).toBe(hashes.length);
    expect(
      chunks.every(
        (chunk) =>
          chunk.source_url === "https://en.wikipedia.org/wiki/Paris" ||
          chunk.source_url === "https://en.wikivoyage.org/wiki/Paris",
      ),
    ).toBe(true);
  });
});

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import type { TravelChunk } from "@/lib/rag/chunking";
import { citationsFromRetrieval } from "@/lib/rag/citations";
import { groupChunksBySourceUrl } from "@/lib/rag/normalize-sources";
import { diversifyChunks, type MatchRow } from "@/lib/rag/retrieve-select";

function chunk(
  overrides: Partial<TravelChunk> &
    Pick<TravelChunk, "source_url" | "content_hash" | "chunk_index">,
): TravelChunk {
  return {
    destination_key: "paris",
    destination_name: "Paris",
    country: "France",
    source_type: "wikipedia",
    source_title: "Paris",
    source_page_id: "1",
    source_full_content: "Paris full page content for travel planning.",
    source_content_hash: "source-hash-paris",
    section_title: "See",
    content: `Chunk body ${overrides.chunk_index}`,
    language: "en",
    ...overrides,
  };
}

describe("normalized source grouping", () => {
  it("creates one source row per source URL", () => {
    const sources = groupChunksBySourceUrl([
      chunk({
        source_url: "https://en.wikipedia.org/wiki/Paris",
        content_hash: "c1",
        chunk_index: 0,
      }),
      chunk({
        source_url: "https://en.wikipedia.org/wiki/Paris",
        content_hash: "c2",
        chunk_index: 1,
      }),
      chunk({
        source_url: "https://en.wikivoyage.org/wiki/Paris",
        source_type: "wikivoyage",
        source_content_hash: "source-hash-voyage",
        content_hash: "c3",
        chunk_index: 0,
      }),
    ]);

    expect(sources).toHaveLength(2);
    expect(new Set(sources.map((source) => source.source_url)).size).toBe(2);
  });

  it("keeps multiple chunks linked to one source without duplicating metadata", () => {
    const sharedUrl = "https://en.wikipedia.org/wiki/Paris";
    const chunks = [
      chunk({ source_url: sharedUrl, content_hash: "c1", chunk_index: 0 }),
      chunk({ source_url: sharedUrl, content_hash: "c2", chunk_index: 1 }),
      chunk({ source_url: sharedUrl, content_hash: "c3", chunk_index: 2 }),
    ];
    const sources = groupChunksBySourceUrl(chunks);

    expect(sources).toHaveLength(1);
    expect(chunks.every((item) => item.source_url === sources[0]?.source_url)).toBe(
      true,
    );
    expect(new Set(chunks.map((item) => item.content_hash)).size).toBe(3);
  });
});

describe("normalized retrieval + citations", () => {
  it("retrieval still returns source metadata from joined rows", () => {
    const rows: MatchRow[] = [
      {
        id: "chunk-1",
        source_id: "source-1",
        destination_name: "Paris",
        country: "France",
        source_type: "wikipedia",
        source_title: "Paris",
        source_url: "https://en.wikipedia.org/wiki/Paris",
        section_title: "See",
        content: "Louvre and Seine walks.",
        similarity: 0.8,
      },
      {
        id: "chunk-2",
        source_id: "source-2",
        destination_name: "Paris",
        country: "France",
        source_type: "wikivoyage",
        source_title: "Paris",
        source_url: "https://en.wikivoyage.org/wiki/Paris",
        section_title: "Eat",
        content: "Neighborhood bistros.",
        similarity: 0.77,
      },
    ];

    const selected = diversifyChunks(rows);
    expect(selected[0]?.travel_chunk_id).toBe("chunk-1");
    expect(selected[0]?.travel_source_id).toBe("source-1");
    expect(selected[0]?.citation_key).toBe("chunk-1");
    expect(selected[0]?.source_title).toBe("Paris");
  });

  it("citations resolve from retrieved chunk and source ids", () => {
    const selected = diversifyChunks([
      {
        id: "chunk-1",
        source_id: "source-1",
        destination_name: "Paris",
        country: "France",
        source_type: "wikipedia",
        source_title: "Paris",
        source_url: "https://en.wikipedia.org/wiki/Paris",
        section_title: "See",
        content: "Louvre and Seine walks.",
        similarity: 0.8,
      },
    ]);

    const rows = citationsFromRetrieval(
      "trip-1",
      selected,
      new Set(["chunk-1"]),
    );

    expect(rows[0]?.travel_chunk_id).toBe("chunk-1");
    expect(rows[0]?.travel_source_id).toBe("source-1");
    expect(rows[0]?.citation_key).toBe("chunk-1");
  });
});

describe("no legacy schema references in app code", () => {
  it("does not query travel_documents or use travel_document_id", () => {
    const frontendRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../..",
    );

    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        if (
          entry === "node_modules" ||
          entry === ".next" ||
          entry === "dist"
        ) {
          continue;
        }
        const full = path.join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          walk(full);
          continue;
        }
        if (/\.(ts|tsx|mjs|cjs|js)$/.test(entry)) {
          files.push(full);
        }
      }
    };
    walk(frontendRoot);

    const legacyTable = /from\(\s*["']travel_documents(?:_legacy)?["']\s*\)/;
    const legacyId = /\btravel_document_id\b/;

    const offenders: string[] = [];
    for (const file of files) {
      const relative = path.relative(frontendRoot, file);
      // Guard tests may mention the forbidden identifier by name.
      if (relative.endsWith(".test.ts") || relative.endsWith(".test.tsx")) {
        continue;
      }
      const contents = readFileSync(file, "utf8");
      if (legacyTable.test(contents) || legacyId.test(contents)) {
        offenders.push(relative);
      }
    }

    expect(offenders).toEqual([]);
  });
});

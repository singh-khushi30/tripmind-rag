import { createHash } from "node:crypto";

import type { NormalizedDestination } from "@/lib/rag/destination";
import type { MediaWikiPage } from "@/lib/rag/sources/mediawiki-parse";

export type TravelChunk = {
  destination_key: string;
  destination_name: string;
  country: string | null;
  source_type: "wikipedia" | "wikivoyage";
  source_title: string;
  source_url: string;
  source_page_id: string | null;
  /** Full cleaned page extract stored once on travel_sources. */
  source_full_content: string | null;
  source_content_hash: string;
  section_title: string | null;
  chunk_index: number;
  content: string;
  content_hash: string;
  language: string;
};

const TARGET_CHARS = 2200; // ~500–800 tokens rough
const OVERLAP_CHARS = 350; // ~80–120 tokens rough
const MIN_CHUNK_CHARS = 280;

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function cleanTravelText(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s([,.!?])/g, "$1")
    .trim();
}

function splitLongText(text: string): string[] {
  if (text.length <= TARGET_CHARS) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + TARGET_CHARS, text.length);
    if (end < text.length) {
      const slice = text.slice(start, end);
      const breakAt = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("; "),
        slice.lastIndexOf(" "),
      );
      if (breakAt > TARGET_CHARS * 0.5) {
        end = start + breakAt + 1;
      }
    }

    const piece = text.slice(start, end).trim();
    if (piece.length >= MIN_CHUNK_CHARS || chunks.length === 0) {
      chunks.push(piece);
    }

    if (end >= text.length) break;
    start = Math.max(end - OVERLAP_CHARS, start + 1);
  }

  return chunks;
}

export function chunkMediaWikiPages(options: {
  pages: MediaWikiPage[];
  sourceType: "wikipedia" | "wikivoyage";
  destination: NormalizedDestination;
  country?: string | null;
}): TravelChunk[] {
  const { pages, sourceType, destination, country = null } = options;
  const chunks: TravelChunk[] = [];
  const seenHashes = new Set<string>();

  for (const page of pages) {
    let chunkIndex = 0;
    const sourceFullContent = cleanTravelText(page.extract);
    const sourceContentHash = hashContent(
      `${sourceType}|${page.url}|${sourceFullContent}`,
    );
    const sections =
      page.sections.length > 0
        ? page.sections
        : [{ title: "Overview", content: page.extract }];

    for (const section of sections) {
      const cleaned = cleanTravelText(section.content);
      if (!cleaned || cleaned.length < MIN_CHUNK_CHARS) continue;

      for (const piece of splitLongText(cleaned)) {
        const content = cleanTravelText(
          `${page.title}${section.title ? ` — ${section.title}` : ""}\n${piece}`,
        );
        const content_hash = hashContent(
          `${sourceType}|${page.url}|${section.title}|${content}`,
        );

        if (seenHashes.has(content_hash)) continue;
        seenHashes.add(content_hash);

        chunks.push({
          destination_key: destination.destination_key,
          destination_name: destination.destination_name,
          country,
          source_type: sourceType,
          source_title: page.title,
          source_url: page.url,
          source_page_id: page.pageId != null ? String(page.pageId) : null,
          source_full_content: sourceFullContent || null,
          source_content_hash: sourceContentHash,
          section_title: section.title,
          chunk_index: chunkIndex,
          content,
          content_hash,
          language: "en",
        });
        chunkIndex += 1;
      }
    }
  }

  return chunks;
}

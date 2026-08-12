import type { TravelChunk } from "@/lib/rag/chunking";
import { RAG_MAX_CHUNKS_PER_DESTINATION } from "@/lib/rag/constants-shared";

const HIGH_PRIORITY_SECTIONS = [
  "see",
  "do",
  "eat",
  "get around",
  "stay safe",
  "understand",
  "get in",
  "overview",
  "culture",
  "geography",
  "tourism",
  "districts",
  "neighborhood",
  "climate",
];

function sectionScore(sectionTitle: string | null): number {
  const title = (sectionTitle ?? "").toLowerCase();
  if (!title) return 1;
  if (HIGH_PRIORITY_SECTIONS.some((section) => title.includes(section))) {
    return 3;
  }
  if (
    title.includes("history") ||
    title.includes("etymology") ||
    title.includes("era")
  ) {
    return 0;
  }
  return 1;
}

function chunkScore(chunk: TravelChunk): number {
  const sourceBoost = chunk.source_type === "wikivoyage" ? 2 : 0;
  return sourceBoost + sectionScore(chunk.section_title);
}

/**
 * Prefer travel-useful Wikivoyage/Wikipedia sections and cap volume
 * so embedding stays within API quotas.
 */
export function selectChunksForEmbedding(
  chunks: TravelChunk[],
  maxChunks = RAG_MAX_CHUNKS_PER_DESTINATION,
): TravelChunk[] {
  if (chunks.length <= maxChunks) return chunks;

  const ranked = [...chunks].sort((a, b) => {
    const scoreDiff = chunkScore(b) - chunkScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return a.chunk_index - b.chunk_index;
  });

  const selected = ranked.slice(0, maxChunks);

  // Keep stable chunk_index per source URL after selection.
  const counters = new Map<string, number>();
  return selected.map((chunk) => {
    const key = chunk.source_url;
    const next = counters.get(key) ?? 0;
    counters.set(key, next + 1);
    return {
      ...chunk,
      chunk_index: next,
    };
  });
}

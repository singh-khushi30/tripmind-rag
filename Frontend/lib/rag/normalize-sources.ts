import type { TravelChunk } from "@/lib/rag/chunking";

export type TravelSourceUpsert = {
  destination_key: string;
  destination_name: string;
  country: string | null;
  source_type: "wikipedia" | "wikivoyage";
  source_title: string;
  source_url: string;
  source_page_id: string | null;
  full_content: string | null;
  content_hash: string;
  language: string;
};

/**
 * Collapse chunks into one source row per unique source_url.
 */
export function groupChunksBySourceUrl(
  chunks: TravelChunk[],
): TravelSourceUpsert[] {
  const byUrl = new Map<string, TravelSourceUpsert>();

  for (const chunk of chunks) {
    if (byUrl.has(chunk.source_url)) continue;
    byUrl.set(chunk.source_url, {
      destination_key: chunk.destination_key,
      destination_name: chunk.destination_name,
      country: chunk.country,
      source_type: chunk.source_type,
      source_title: chunk.source_title,
      source_url: chunk.source_url,
      source_page_id: chunk.source_page_id,
      full_content: chunk.source_full_content,
      content_hash: chunk.source_content_hash,
      language: chunk.language,
    });
  }

  return Array.from(byUrl.values());
}

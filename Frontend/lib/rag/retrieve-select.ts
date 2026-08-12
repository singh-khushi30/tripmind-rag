import {
  RAG_MATCH_COUNT,
  RAG_SIMILARITY_THRESHOLD,
} from "@/lib/rag/constants-shared";

export type MatchRow = {
  id: string;
  source_id: string;
  destination_name: string;
  country: string | null;
  source_type: string;
  source_title: string;
  source_url: string;
  section_title: string | null;
  content: string;
  similarity: number;
};

export type SelectedChunk = {
  citation_key: string;
  travel_chunk_id: string;
  travel_source_id: string;
  destination_name: string;
  country: string | null;
  source_type: "wikipedia" | "wikivoyage";
  source_title: string;
  source_url: string;
  section_title: string | null;
  content: string;
  similarity: number;
};

function contentFingerprint(content: string): string {
  return content.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 240);
}

export function filterBySimilarity(
  rows: MatchRow[],
  threshold = RAG_SIMILARITY_THRESHOLD,
): MatchRow[] {
  return rows.filter((row) => row.similarity >= threshold);
}

export function filterByDestinationKey(
  rows: Array<MatchRow & { destination_key?: string }>,
  destinationKey: string,
): MatchRow[] {
  return rows.filter(
    (row) =>
      !row.destination_key || row.destination_key === destinationKey,
  );
}

/**
 * Prefer source diversity and avoid near-duplicate URL/section/content rows.
 */
export function diversifyChunks(
  rows: MatchRow[],
  matchCount = RAG_MATCH_COUNT,
): SelectedChunk[] {
  const selected: SelectedChunk[] = [];
  const seenSections = new Set<string>();
  const seenFingerprints = new Set<string>();

  const eligible = rows.filter(
    (
      row,
    ): row is MatchRow & { source_type: "wikipedia" | "wikivoyage" } =>
      row.source_type === "wikipedia" || row.source_type === "wikivoyage",
  );

  const queue = [...eligible];
  let prefer: "wikipedia" | "wikivoyage" | null = null;

  while (queue.length > 0 && selected.length < matchCount) {
    let index = 0;
    if (prefer) {
      const preferredIndex = queue.findIndex((row) => row.source_type === prefer);
      if (preferredIndex >= 0) index = preferredIndex;
    }

    const [row] = queue.splice(index, 1);
    if (!row) break;

    const sectionKey = `${row.source_url}|${row.section_title ?? ""}`;
    const fingerprint = contentFingerprint(row.content);
    if (seenSections.has(sectionKey) || seenFingerprints.has(fingerprint)) {
      continue;
    }

    const citation_key = `src_${selected.length + 1}`;
    selected.push({
      citation_key,
      travel_chunk_id: row.id,
      travel_source_id: row.source_id,
      destination_name: row.destination_name,
      country: row.country,
      source_type: row.source_type,
      source_title: row.source_title,
      source_url: row.source_url,
      section_title: row.section_title,
      content: row.content,
      similarity: row.similarity,
    });

    seenSections.add(sectionKey);
    seenFingerprints.add(fingerprint);
    prefer = row.source_type === "wikipedia" ? "wikivoyage" : "wikipedia";
  }

  return selected;
}

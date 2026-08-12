import type { TripCitationSource } from "@/types/trip";

/**
 * Collapse many chunk citations into one Sources Used entry per travel_source_id.
 */
export function dedupeCitationsBySourceId(
  citations: TripCitationSource[],
): TripCitationSource[] {
  const unique = new Map<string, TripCitationSource>();

  for (const citation of citations) {
    const key = citation.travel_source_id || citation.source_url;
    if (!unique.has(key)) {
      unique.set(key, citation);
    }
  }

  return Array.from(unique.values());
}

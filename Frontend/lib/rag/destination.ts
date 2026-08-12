export type NormalizedDestination = {
  destination_key: string;
  destination_name: string;
  display_name: string;
};

/**
 * Stable slug-like destination key for RAG storage/retrieval.
 * Never remaps a destination to an unrelated place.
 */
export function normalizeDestinationKey(destination: string): NormalizedDestination {
  const display_name = destination.trim().replace(/\s+/g, " ");
  const destination_name = display_name;

  const destination_key = display_name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!destination_key) {
    throw new Error("Destination could not be normalized");
  }

  return {
    destination_key,
    destination_name,
    display_name,
  };
}

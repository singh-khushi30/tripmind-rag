export function normalizeGeocodeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s,.\-'/]/gu, "");
}

export function buildDestinationContext(destination: string): {
  cityHint: string;
  fullDestination: string;
} {
  const fullDestination = destination.trim().replace(/\s+/g, " ");
  const cityHint = fullDestination.split(",")[0]?.trim() || fullDestination;
  return { cityHint, fullDestination };
}

export function buildGeocodeAttempts(input: {
  locationName: string;
  neighborhood: string | null;
  destination: string;
}): string[] {
  const { cityHint, fullDestination } = buildDestinationContext(input.destination);
  const location = input.locationName.trim();
  const neighborhood = input.neighborhood?.trim() || null;

  const attempts: string[] = [];
  const push = (value: string) => {
    const cleaned = value.replace(/\s+/g, " ").trim();
    if (!cleaned) return;
    if (!attempts.some((existing) => existing.toLowerCase() === cleaned.toLowerCase())) {
      attempts.push(cleaned);
    }
  };

  // Prefer place + destination context (never bare place name alone).
  push(`${location}, ${fullDestination}`);
  push(`${location}, ${cityHint}`);

  if (neighborhood) {
    push(`${location}, ${neighborhood}, ${cityHint}`);
    push(`${neighborhood}, ${cityHint}`);
  }

  return attempts;
}

export function isApproximateQuery(query: string, neighborhood: string | null): boolean {
  const lower = query.toLowerCase();
  if (neighborhood && lower.startsWith(neighborhood.trim().toLowerCase())) {
    return true;
  }
  return /\b(neighborhood|district|arrondissement|quarter|area)\b/i.test(query);
}

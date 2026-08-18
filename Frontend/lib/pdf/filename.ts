/** Pure helpers for TripMind PDF export filenames. */

export function slugifyDestinationForFilename(destination: string): string {
  const slug = destination
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "Trip";
}

/**
 * File name format: TripMind-<destination>-<start-date>.pdf
 * Example: TripMind-Paris-2026-09-10.pdf
 */
export function buildTripPdfFilename(input: {
  destination: string;
  startDate?: string | null;
  fallbackDate?: string | null;
}): string {
  const destination = slugifyDestinationForFilename(input.destination);
  const date =
    (input.startDate && /^\d{4}-\d{2}-\d{2}$/.test(input.startDate)
      ? input.startDate
      : null) ??
    (input.fallbackDate && /^\d{4}-\d{2}-\d{2}$/.test(input.fallbackDate)
      ? input.fallbackDate
      : null) ??
    new Date().toISOString().slice(0, 10);

  return `TripMind-${destination}-${date}.pdf`;
}

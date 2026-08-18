import "server-only";

import { itineraryDataSchema } from "@/lib/gemini/schema";
import { buildTripPdfFilename } from "@/lib/pdf/filename";
import {
  TripPdfAuthError,
  type TripPdfCitation,
  type TripPdfData,
} from "@/lib/pdf/types";
import { createClient } from "@/lib/supabase/server";
import { tripToTripResult } from "@/lib/trips/mappers";
import {
  getTripCitations,
  getTripDayWeather,
} from "@/lib/trips/queries";
import { mergeTripDayWeatherIntoItinerary } from "@/lib/weather/merge-trip-weather";
import type { Trip } from "@/types/database";

export { TripPdfAuthError } from "@/lib/pdf/types";

function buildRouteSummary(trip: ReturnType<typeof tripToTripResult>): string[] {
  const lines: string[] = [];
  const warnings = trip.routeWarnings ?? [];

  for (const day of trip.itinerary) {
    const located = day.activities.filter(
      (activity) =>
        typeof activity.latitude === "number" &&
        typeof activity.longitude === "number",
    );
    const dayWarnings = warnings.filter(
      (warning) => warning.day_number === day.day_number,
    );

    if (located.length >= 2) {
      lines.push(
        `Day ${day.day_number}: ${located.length} mapped stops · follow itinerary order for walking/transit transfers.`,
      );
    } else if (located.length === 1) {
      lines.push(
        `Day ${day.day_number}: 1 mapped stop (${located[0]!.location_name}).`,
      );
    } else {
      lines.push(
        `Day ${day.day_number}: map coordinates unavailable — use listed locations.`,
      );
    }

    for (const warning of dayWarnings.slice(0, 2)) {
      lines.push(`Day ${day.day_number} note: ${warning.message}`);
    }
  }

  if (lines.length === 0) {
    lines.push("Route details were not available for this itinerary.");
  }

  return lines;
}

function dedupeCitations(
  citations: TripPdfCitation[],
): TripPdfCitation[] {
  const seen = new Set<string>();
  const unique: TripPdfCitation[] = [];
  for (const citation of citations) {
    const key = citation.source_url || citation.citation_key;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(citation);
  }
  return unique;
}

async function hydrateTripWeather(trip: Trip): Promise<Trip> {
  try {
    const weatherRows = await getTripDayWeather(trip.id);
    if (weatherRows.length === 0) return trip;
    const parsed = itineraryDataSchema.safeParse(trip.itinerary_data);
    const base = parsed.success
      ? parsed.data
      : trip.itinerary_data &&
          typeof trip.itinerary_data === "object" &&
          Array.isArray((trip.itinerary_data as { days?: unknown }).days)
        ? trip.itinerary_data
        : null;
    if (!base?.days?.length) return trip;
    return {
      ...trip,
      itinerary_data: mergeTripDayWeatherIntoItinerary(base, weatherRows),
    };
  } catch {
    return trip;
  }
}

/**
 * Load PDF payload for the authenticated owner only.
 * Never trusts client-provided ownership claims.
 */
export async function loadTripPdfData(tripId: string): Promise<TripPdfData> {
  if (!tripId || typeof tripId !== "string") {
    throw new TripPdfAuthError(400, "Invalid trip id.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new TripPdfAuthError(401, "You must be signed in to export a PDF.");
  }

  const { data: trip, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new TripPdfAuthError(500, "Could not load trip for PDF export.");
  }

  if (!trip) {
    throw new TripPdfAuthError(404, "Trip not found.");
  }

  const hydrated = await hydrateTripWeather(trip as Trip);
  const citations = await getTripCitations(tripId);
  const result = tripToTripResult(hydrated, citations);

  const pdfCitations = dedupeCitations(
    citations.map((citation) => ({
      citation_key: citation.citation_key,
      source_title: citation.source_title,
      source_url: citation.source_url,
      source_type: citation.source_type,
      section_title: citation.section_title,
    })),
  );

  const filename = buildTripPdfFilename({
    destination: result.destination,
    startDate: result.startDate ?? trip.start_date,
    fallbackDate: trip.created_at.slice(0, 10),
  });

  return {
    trip: result,
    filename,
    generatedAt: new Date().toISOString(),
    routeSummary: buildRouteSummary(result),
    citations: pdfCitations,
  };
}

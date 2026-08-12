import "server-only";

import { isValidCoordinate } from "@/lib/geo/coordinates";
import { geocodeItineraryLight } from "@/lib/maps/geocode-itinerary-light";
import { itineraryDataSchema, type ItineraryData } from "@/lib/gemini/schema";
import { ragLog } from "@/lib/rag/log";
import { createClient } from "@/lib/supabase/server";
import type { Trip } from "@/types/database";

function itineraryHasMappedCoordinates(itinerary: ItineraryData): boolean {
  return itinerary.days.some((day) =>
    day.activities.some((activity) =>
      isValidCoordinate(activity.latitude, activity.longitude),
    ),
  );
}

function parseItinerary(raw: unknown): ItineraryData | null {
  const parsed = itineraryDataSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  if (!raw || typeof raw !== "object") return null;
  const days = (raw as { days?: unknown }).days;
  if (!Array.isArray(days) || days.length === 0) return null;
  return raw as ItineraryData;
}

/**
 * Best-effort, time-boxed backfill for trips missing coordinates.
 * Never throws — trip pages must still render.
 */
export async function ensureTripLocations(trip: Trip): Promise<Trip> {
  try {
    const itinerary = parseItinerary(trip.itinerary_data);
    if (!itinerary) return trip;
    if (itineraryHasMappedCoordinates(itinerary)) return trip;

    const geocoded = await geocodeItineraryLight({
      tripId: trip.id,
      itinerary,
      destination: trip.destination,
    });

    if (geocoded.geocoded_count === 0) {
      ragLog("geocode.backfill_empty", {
        trip_id: trip.id,
        failed_count: geocoded.failed_count,
      });
      return trip;
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("trips")
      .update({ itinerary_data: geocoded.itinerary })
      .eq("id", trip.id)
      .eq("user_id", trip.user_id);

    if (!error && geocoded.locations.length > 0) {
      const { error: locationError } = await supabase
        .from("trip_activity_locations")
        .upsert(geocoded.locations, { onConflict: "trip_id,activity_key" });
      if (locationError) {
        ragLog("geocode.backfill_locations_failed", {
          trip_id: trip.id,
          message: locationError.message.slice(0, 160),
        });
      }
    }

    ragLog("geocode.backfill_completed", {
      trip_id: trip.id,
      geocoded_count: geocoded.geocoded_count,
      failed_count: geocoded.failed_count,
    });

    return {
      ...trip,
      itinerary_data: geocoded.itinerary,
    };
  } catch (error) {
    ragLog("geocode.backfill_skipped", {
      trip_id: trip.id,
      message:
        error instanceof Error
          ? error.message.slice(0, 160)
          : "unknown_backfill_error",
    });
    return trip;
  }
}

import "server-only";

import { buildActivityKey } from "@/lib/maps/activity-key";
import {
  geocodeActivityLocation,
  type LocationConfidence,
} from "@/lib/maps/geocode";
import { isValidCoordinate } from "@/lib/geo/coordinates";
import type { ItineraryData } from "@/lib/gemini/schema";
import type { TripActivityLocationInsert } from "@/types/database";

const BACKFILL_BUDGET_MS = 12_000;

/**
 * Fast geocode attach for page-load backfill.
 * Skips OSRM, reorder, and Gemini repair so trip pages do not time out.
 */
export async function geocodeItineraryLight(input: {
  tripId: string;
  itinerary: ItineraryData;
  destination: string;
}): Promise<{
  itinerary: ItineraryData;
  locations: TripActivityLocationInsert[];
  geocoded_count: number;
  failed_count: number;
}> {
  const started = Date.now();
  let geocoded_count = 0;
  let failed_count = 0;

  const days = [];

  for (const day of input.itinerary.days) {
    const activities = [];
    for (let activityIndex = 0; activityIndex < day.activities.length; activityIndex += 1) {
      const activity = day.activities[activityIndex]!;

      if (isValidCoordinate(activity.latitude, activity.longitude)) {
        activities.push(activity);
        continue;
      }

      if (Date.now() - started > BACKFILL_BUDGET_MS) {
        failed_count += 1;
        activities.push({
          ...activity,
          latitude: null,
          longitude: null,
          location_display_name: null,
          location_confidence: "unavailable" as const,
        });
        continue;
      }

      try {
        const result = await geocodeActivityLocation({
          locationName: activity.location_name,
          neighborhood: activity.neighborhood,
          destination: input.destination,
        });

        if (!result) {
          failed_count += 1;
          activities.push({
            ...activity,
            latitude: null,
            longitude: null,
            location_display_name: null,
            location_confidence: "unavailable" as const,
          });
          continue;
        }

        geocoded_count += 1;
        activities.push({
          ...activity,
          latitude: result.latitude,
          longitude: result.longitude,
          location_display_name: result.display_name,
          location_confidence: result.confidence as LocationConfidence,
        });
      } catch {
        failed_count += 1;
        activities.push({
          ...activity,
          latitude: null,
          longitude: null,
          location_display_name: null,
          location_confidence: "unavailable" as const,
        });
      }
    }

    days.push({ ...day, activities });
  }

  const itinerary: ItineraryData = { ...input.itinerary, days };
  const locations: TripActivityLocationInsert[] = [];

  for (const day of itinerary.days) {
    day.activities.forEach((activity, activityIndex) => {
      if (!isValidCoordinate(activity.latitude, activity.longitude)) return;
      locations.push({
        trip_id: input.tripId,
        activity_key: buildActivityKey(day.day_number, activityIndex),
        activity_title: activity.title,
        location_name: activity.location_name,
        latitude: activity.latitude!,
        longitude: activity.longitude!,
        display_name: activity.location_display_name ?? null,
        geocoding_provider: "nominatim",
        confidence: activity.location_confidence ?? "exact",
      });
    });
  }

  return { itinerary, locations, geocoded_count, failed_count };
}

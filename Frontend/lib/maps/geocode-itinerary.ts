import "server-only";

import { buildActivityKey } from "@/lib/maps/activity-key";
import {
  geocodeActivityLocation,
  type LocationConfidence,
} from "@/lib/maps/geocode";
import { fetchOsrmDayRoute, haversineDayRoute } from "@/lib/maps/osrm";
import { reorderItineraryForRoutes } from "@/lib/maps/reorder-day";
import { repairItineraryRoutes } from "@/lib/maps/repair-route";
import {
  hasMajorRouteProblems,
  validateItineraryRoutes,
  type RouteWarning,
} from "@/lib/maps/validate-route";
import type { ItineraryData } from "@/lib/gemini/schema";
import type { TripActivityLocationInsert } from "@/types/database";

export type GeocodedActivityLocation = TripActivityLocationInsert & {
  confidence: LocationConfidence | null;
};

export type GeocodeItineraryResult = {
  itinerary: ItineraryData;
  locations: GeocodedActivityLocation[];
  warnings: RouteWarning[];
  geocoded_count: number;
  failed_count: number;
};

function attachLocationFields(
  itinerary: ItineraryData,
  byKey: Map<
    string,
    {
      latitude: number;
      longitude: number;
      display_name: string | null;
      confidence: LocationConfidence;
    }
  >,
): ItineraryData {
  return {
    ...itinerary,
    days: itinerary.days.map((day) => ({
      ...day,
      activities: day.activities.map((activity, activityIndex) => {
        const key = buildActivityKey(day.day_number, activityIndex);
        const hit = byKey.get(key);
        if (!hit) {
          return {
            ...activity,
            latitude: null,
            longitude: null,
            location_display_name: null,
            location_confidence: "unavailable" as const,
          };
        }
        return {
          ...activity,
          latitude: hit.latitude,
          longitude: hit.longitude,
          location_display_name: hit.display_name,
          location_confidence: hit.confidence,
        };
      }),
    })),
  };
}

async function buildDayRoutes(itinerary: ItineraryData) {
  const dayRoutes = new Map<
    number,
    Awaited<ReturnType<typeof fetchOsrmDayRoute>>
  >();

  for (const day of itinerary.days) {
    const points = day.activities
      .filter(
        (activity) =>
          activity.latitude != null &&
          activity.longitude != null &&
          activity.location_confidence !== "unavailable",
      )
      .map((activity) => ({
        lat: activity.latitude!,
        lng: activity.longitude!,
      }));

    if (points.length < 2) {
      dayRoutes.set(day.day_number, haversineDayRoute(points));
      continue;
    }

    dayRoutes.set(day.day_number, await fetchOsrmDayRoute(points));
  }

  return dayRoutes;
}

/**
 * Geocode activities, attach coords, validate routes, and lightly repair order.
 * Never fails the whole trip when individual geocodes miss.
 */
export async function geocodeAndValidateItinerary(input: {
  tripId: string;
  itinerary: ItineraryData;
  destination: string;
  groundedContextBlock?: string | null;
  fetchImpl?: typeof fetch;
}): Promise<GeocodeItineraryResult> {
  const byKey = new Map<
    string,
    {
      latitude: number;
      longitude: number;
      display_name: string | null;
      confidence: LocationConfidence;
      activity_title: string;
      location_name: string;
    }
  >();

  let geocoded_count = 0;
  let failed_count = 0;

  for (const day of input.itinerary.days) {
    for (let activityIndex = 0; activityIndex < day.activities.length; activityIndex += 1) {
      const activity = day.activities[activityIndex]!;
      const key = buildActivityKey(day.day_number, activityIndex);

      try {
        const result = await geocodeActivityLocation({
          locationName: activity.location_name,
          neighborhood: activity.neighborhood,
          destination: input.destination,
          fetchImpl: input.fetchImpl,
        });

        if (!result) {
          failed_count += 1;
          continue;
        }

        geocoded_count += 1;
        byKey.set(key, {
          latitude: result.latitude,
          longitude: result.longitude,
          display_name: result.display_name,
          confidence: result.confidence,
          activity_title: activity.title,
          location_name: activity.location_name,
        });
      } catch {
        failed_count += 1;
      }
    }
  }

  let itinerary = attachLocationFields(input.itinerary, byKey);
  itinerary = reorderItineraryForRoutes(itinerary);

  let dayRoutes = await buildDayRoutes(itinerary);
  let warnings = validateItineraryRoutes({ itinerary, dayRoutes });

  if (hasMajorRouteProblems(warnings)) {
    itinerary = await repairItineraryRoutes({
      itinerary,
      warnings,
      groundedContextBlock: input.groundedContextBlock ?? null,
    });
    itinerary = reorderItineraryForRoutes(itinerary);
    dayRoutes = await buildDayRoutes(itinerary);
    warnings = validateItineraryRoutes({ itinerary, dayRoutes });
  }

  const routeMeta = {
    warnings,
    days: Object.fromEntries(
      [...dayRoutes.entries()].map(([dayNumber, route]) => [
        String(dayNumber),
        {
          total_distance_km: Number(route.total_distance_km.toFixed(2)),
          total_duration_minutes: route.total_duration_minutes,
          source: route.source,
        },
      ]),
    ),
  };

  itinerary = {
    ...itinerary,
    route_meta: routeMeta,
  };

  const locations: GeocodedActivityLocation[] = [];
  for (const day of itinerary.days) {
    day.activities.forEach((activity, activityIndex) => {
      if (
        activity.latitude == null ||
        activity.longitude == null ||
        activity.location_confidence === "unavailable"
      ) {
        return;
      }
      locations.push({
        trip_id: input.tripId,
        activity_key: buildActivityKey(day.day_number, activityIndex),
        activity_title: activity.title,
        location_name: activity.location_name,
        latitude: activity.latitude,
        longitude: activity.longitude,
        display_name: activity.location_display_name ?? null,
        geocoding_provider: "nominatim",
        confidence: activity.location_confidence ?? "exact",
      });
    });
  }

  return {
    itinerary,
    locations,
    warnings,
    geocoded_count,
    failed_count,
  };
}

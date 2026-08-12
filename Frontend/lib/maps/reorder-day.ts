import { haversineKm, isValidCoordinate } from "@/lib/geo/coordinates";
import type { ItineraryActivity, ItineraryDay } from "@/types/trip";

type Pointed = {
  activity: ItineraryActivity;
  index: number;
  lat: number;
  lng: number;
};

/**
 * Nearest-neighbor reorder for same-day activities with coordinates.
 * Keeps original relative order for activities missing coordinates.
 */
export function reorderDayActivitiesNearestNeighbor(
  day: ItineraryDay,
): ItineraryDay {
  const withCoords: Pointed[] = [];
  const withoutCoords: Array<{ activity: ItineraryActivity; index: number }> =
    [];

  day.activities.forEach((activity, index) => {
    if (isValidCoordinate(activity.latitude, activity.longitude)) {
      withCoords.push({
        activity,
        index,
        lat: activity.latitude!,
        lng: activity.longitude!,
      });
    } else {
      withoutCoords.push({ activity, index });
    }
  });

  if (withCoords.length < 3) return day;

  const remaining = [...withCoords];
  const ordered: Pointed[] = [remaining.shift()!];

  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1]!;
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i]!;
      const dist = haversineKm(
        current.lat,
        current.lng,
        candidate.lat,
        candidate.lng,
      );
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    ordered.push(remaining.splice(bestIdx, 1)[0]!);
  }

  // Merge unlocated activities back at their relative slots.
  const merged: ItineraryActivity[] = ordered.map((item) => item.activity);
  for (const missing of withoutCoords.sort((a, b) => a.index - b.index)) {
    const insertAt = Math.min(missing.index, merged.length);
    merged.splice(insertAt, 0, missing.activity);
  }

  return {
    ...day,
    activities: merged,
  };
}

export function reorderItineraryForRoutes(
  itinerary: import("@/types/trip").ItineraryData,
): import("@/types/trip").ItineraryData {
  return {
    ...itinerary,
    days: itinerary.days.map((day) =>
      reorderDayActivitiesNearestNeighbor(day),
    ),
  };
}

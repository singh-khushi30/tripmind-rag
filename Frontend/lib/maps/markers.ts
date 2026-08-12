import { isValidCoordinate } from "@/lib/geo/coordinates";
import type { ItineraryDay } from "@/types/trip";

export type VisibleMapMarker = {
  dayNumber: number;
  order: number;
  title: string;
  time: string;
  location: string;
  estimatedCost: number;
  latitude: number;
  longitude: number;
  confidence: "exact" | "approximate" | "unavailable";
};

export function collectVisibleMapMarkers(
  days: ItineraryDay[],
  selectedDay: number | "all",
): VisibleMapMarker[] {
  const visibleDays =
    selectedDay === "all"
      ? days
      : days.filter((day) => day.day_number === selectedDay);

  const items: VisibleMapMarker[] = [];
  for (const day of visibleDays) {
    let order = 0;
    for (const activity of day.activities) {
      if (!isValidCoordinate(activity.latitude, activity.longitude)) continue;
      order += 1;
      items.push({
        dayNumber: day.day_number,
        order,
        title: activity.title,
        time: activity.start_time,
        location: activity.location_name,
        estimatedCost: activity.estimated_cost,
        latitude: activity.latitude!,
        longitude: activity.longitude!,
        confidence: activity.location_confidence ?? "exact",
      });
    }
  }
  return items;
}

import { describe, expect, it } from "vitest";

import { buildHaversineDayRoute } from "@/lib/maps/haversine-route";
import { reorderDayActivitiesNearestNeighbor } from "@/lib/maps/reorder-day";
import {
  detectBacktracking,
  validateDayRoute,
} from "@/lib/maps/validate-route";
import type { ItineraryDay } from "@/types/trip";

function day(partial: Partial<ItineraryDay> & { activities: ItineraryDay["activities"] }): ItineraryDay {
  return {
    day_number: 1,
    title: "City day",
    summary: "Explore the city",
    estimated_day_cost: 100,
    ...partial,
  };
}

describe("route validation", () => {
  it("detects excessive distance between city activities", () => {
    const itineraryDay = day({
      activities: [
        {
          start_time: "09:00",
          title: "Louvre",
          description: "Museum",
          category: "Culture",
          estimated_cost: 20,
          duration_minutes: 120,
          location_name: "Louvre",
          neighborhood: "1st",
          indoor_outdoor: "indoor",
          reservation_required: false,
          notes: null,
          latitude: 48.8606,
          longitude: 2.3376,
          location_confidence: "exact",
        },
        {
          start_time: "14:00",
          title: "Disneyland Paris",
          description: "Park",
          category: "Adventure",
          estimated_cost: 90,
          duration_minutes: 180,
          location_name: "Disneyland Paris",
          neighborhood: "Marne-la-Vallée",
          indoor_outdoor: "outdoor",
          reservation_required: false,
          notes: null,
          latitude: 48.8673,
          longitude: 2.7837,
          location_confidence: "exact",
        },
      ],
    });

    const route = buildHaversineDayRoute([
      { lat: 48.8606, lng: 2.3376 },
      { lat: 48.8673, lng: 2.7837 },
    ]);

    const warnings = validateDayRoute({ day: itineraryDay, route });
    expect(warnings.some((w) => w.code === "long_transfer")).toBe(true);
    expect(route.total_distance_km).toBeGreaterThan(20);
  });

  it("flags impossible same-day cross-city geography", () => {
    const itineraryDay = day({
      activities: [
        {
          start_time: "09:00",
          title: "Eiffel Tower",
          description: "Paris",
          category: "Culture",
          estimated_cost: 0,
          duration_minutes: 90,
          location_name: "Eiffel Tower",
          neighborhood: null,
          indoor_outdoor: "outdoor",
          reservation_required: false,
          notes: null,
          latitude: 48.8584,
          longitude: 2.2945,
          location_confidence: "exact",
        },
        {
          start_time: "15:00",
          title: "Colosseum",
          description: "Rome",
          category: "Culture",
          estimated_cost: 20,
          duration_minutes: 90,
          location_name: "Colosseum",
          neighborhood: null,
          indoor_outdoor: "outdoor",
          reservation_required: false,
          notes: null,
          latitude: 41.8902,
          longitude: 12.4922,
          location_confidence: "exact",
        },
      ],
    });

    const route = buildHaversineDayRoute([
      { lat: 48.8584, lng: 2.2945 },
      { lat: 41.8902, lng: 12.4922 },
    ]);

    const warnings = validateDayRoute({ day: itineraryDay, route });
    expect(
      warnings.some(
        (w) =>
          w.code === "impossible_same_day" || w.code === "cross_city_spread",
      ),
    ).toBe(true);
  });

  it("detects excessive backtracking", () => {
    expect(
      detectBacktracking(
        [
          { lat: 48.86, lng: 2.3 },
          { lat: 48.9, lng: 2.4 },
          { lat: 48.86, lng: 2.3 },
        ],
        1.6,
      ),
    ).toBe(true);
  });

  it("reorders same-day activities to reduce travel", () => {
    const itineraryDay = day({
      activities: [
        {
          start_time: "09:00",
          title: "A",
          description: "A",
          category: "Culture",
          estimated_cost: 0,
          duration_minutes: 60,
          location_name: "A",
          neighborhood: null,
          indoor_outdoor: "outdoor",
          reservation_required: false,
          notes: null,
          latitude: 48.86,
          longitude: 2.33,
          location_confidence: "exact",
        },
        {
          start_time: "11:00",
          title: "C",
          description: "C",
          category: "Culture",
          estimated_cost: 0,
          duration_minutes: 60,
          location_name: "C",
          neighborhood: null,
          indoor_outdoor: "outdoor",
          reservation_required: false,
          notes: null,
          latitude: 48.9,
          longitude: 2.4,
          location_confidence: "exact",
        },
        {
          start_time: "13:00",
          title: "B",
          description: "B",
          category: "Culture",
          estimated_cost: 0,
          duration_minutes: 60,
          location_name: "B",
          neighborhood: null,
          indoor_outdoor: "outdoor",
          reservation_required: false,
          notes: null,
          latitude: 48.87,
          longitude: 2.34,
          location_confidence: "exact",
        },
      ],
    });

    const reordered = reorderDayActivitiesNearestNeighbor(itineraryDay);
    expect(reordered.activities.map((a) => a.title)).toEqual(["A", "B", "C"]);
  });
});

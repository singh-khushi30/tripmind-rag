import { describe, expect, it } from "vitest";

import { collectVisibleMapMarkers } from "@/lib/maps/markers";
import type { ItineraryDay } from "@/types/trip";

const days: ItineraryDay[] = [
  {
    day_number: 1,
    title: "Day 1",
    summary: "Summary",
    estimated_day_cost: 50,
    activities: [
      {
        start_time: "09:00",
        title: "Verified",
        description: "d",
        category: "Culture",
        estimated_cost: 10,
        duration_minutes: 60,
        location_name: "Louvre",
        neighborhood: null,
        indoor_outdoor: "indoor",
        reservation_required: false,
        notes: null,
        latitude: 48.86,
        longitude: 2.34,
        location_confidence: "exact",
      },
      {
        start_time: "11:00",
        title: "Missing",
        description: "d",
        category: "Culture",
        estimated_cost: 0,
        duration_minutes: 60,
        location_name: "Unknown cafe",
        neighborhood: null,
        indoor_outdoor: "indoor",
        reservation_required: false,
        notes: null,
        latitude: null,
        longitude: null,
        location_confidence: "unavailable",
      },
      {
        start_time: "13:00",
        title: "Null island",
        description: "d",
        category: "Culture",
        estimated_cost: 0,
        duration_minutes: 60,
        location_name: "Bad",
        neighborhood: null,
        indoor_outdoor: "outdoor",
        reservation_required: false,
        notes: null,
        latitude: 0,
        longitude: 0,
        location_confidence: "exact",
      },
    ],
  },
];

describe("collectVisibleMapMarkers", () => {
  it("hides missing and 0,0 coordinates", () => {
    const markers = collectVisibleMapMarkers(days, 1);
    expect(markers).toHaveLength(1);
    expect(markers[0]?.title).toBe("Verified");
  });

  it("preserves approximate labeling", () => {
    const approxDays: ItineraryDay[] = [
      {
        ...days[0]!,
        activities: [
          {
            ...days[0]!.activities[0]!,
            location_confidence: "approximate",
          },
        ],
      },
    ];
    const markers = collectVisibleMapMarkers(approxDays, 1);
    expect(markers[0]?.confidence).toBe("approximate");
  });
});

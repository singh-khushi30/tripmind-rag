import { describe, expect, it } from "vitest";

import { TripGenerationError } from "@/lib/gemini/errors";
import type { ItineraryData } from "@/lib/gemini/schema";
import type { TripPlannerInput } from "@/lib/gemini/types";
import {
  parseAndValidateItinerary,
  titleLocationConsistent,
} from "@/lib/gemini/validate-itinerary";

const baseInput: TripPlannerInput = {
  destination: "Kyoto, Japan",
  start_date: null,
  number_of_days: 2,
  budget: 2000,
  currency: "USD",
  travelers: 2,
  travel_style: "mid-range",
  travel_pace: "moderate",
  interests: ["culture", "food"],
  food_preference: "local",
  special_notes: null,
  destination_scope: "city",
  selected_cities: [],
  include_accommodation_in_budget: false,
  include_transport_to_destination_in_budget: false,
};

function activity(
  overrides: Partial<ItineraryData["days"][number]["activities"][number]> & {
    start_time: string;
    title: string;
  },
) {
  return {
    description: "A planned stop.",
    category: "Culture",
    estimated_cost: 10,
    duration_minutes: 60,
    location_name: overrides.title,
    neighborhood: null,
    indoor_outdoor: "mixed" as const,
    reservation_required: false,
    notes: null,
    ...overrides,
  };
}

function makeValidItinerary(
  overrides: Partial<ItineraryData> = {},
): ItineraryData {
  return {
    destination: "Kyoto, Japan",
    country: "Japan",
    summary: "A culture-forward Kyoto itinerary.",
    currency: "USD",
    display_currency: "USD",
    destination_local_currency: "JPY",
    conversion_status: "estimated",
    estimated_total_cost: 120,
    budget_status: "within_budget",
    days: [
      {
        day_number: 1,
        title: "Temples",
        summary: "Historic east side day.",
        estimated_day_cost: 60,
        activities: [
          activity({ start_time: "09:00", title: "Kiyomizu-dera" }),
          activity({
            start_time: "11:00",
            title: "Sannenzaka stroll",
            estimated_cost: 0,
          }),
          activity({
            start_time: "13:00",
            title: "Mid-range lunch in Higashiyama",
            category: "Food",
            location_name: "Mid-range lunch in Higashiyama",
            neighborhood: "Higashiyama",
            estimated_cost: 25,
          }),
          activity({
            start_time: "15:30",
            title: "Tea break",
            category: "Food",
            location_name: "Tea break",
            estimated_cost: 8,
          }),
        ],
      },
      {
        day_number: 2,
        title: "Food walks",
        summary: "Markets and neighborhoods.",
        estimated_day_cost: 60,
        activities: [
          activity({
            start_time: "10:00",
            title: "Nishiki Market",
            category: "Food",
            location_name: "Nishiki Market",
            estimated_cost: 20,
          }),
          activity({
            start_time: "12:30",
            title: "Gion walk",
            estimated_cost: 0,
          }),
          activity({
            start_time: "15:00",
            title: "Cafe stop in Gion",
            category: "Food",
            location_name: "Cafe stop in Gion",
            neighborhood: "Gion",
            estimated_cost: 12,
          }),
          activity({
            start_time: "17:30",
            title: "Yasaka Shrine",
            estimated_cost: 0,
          }),
        ],
      },
    ],
    ...overrides,
  };
}

describe("parseAndValidateItinerary", () => {
  it("accepts a valid itinerary response", () => {
    const result = parseAndValidateItinerary(makeValidItinerary(), baseInput);
    expect(result.days).toHaveLength(2);
    expect(result.budget_totals?.day_total).toBe(
      result.budget_totals?.activity_total,
    );
  });

  it("rejects an invalid Gemini response", () => {
    expect(() =>
      parseAndValidateItinerary({ destination: "" }, baseInput),
    ).toThrow(TripGenerationError);
  });

  it("rejects the wrong number of days", () => {
    const itinerary = makeValidItinerary({
      days: [makeValidItinerary().days[0]!],
    });

    expect(() => parseAndValidateItinerary(itinerary, baseInput)).toThrow(
      expect.objectContaining({ code: "DAY_COUNT_MISMATCH" }),
    );
  });

  it("rejects negative costs", () => {
    const itinerary = makeValidItinerary();
    itinerary.days[0]!.activities[0]!.estimated_cost = -5;

    expect(() => parseAndValidateItinerary(itinerary, baseInput)).toThrow(
      TripGenerationError,
    );
  });

  it("pads empty or short days to match travel pace", () => {
    const itinerary = makeValidItinerary();
    itinerary.days[0]!.activities = [
      activity({ start_time: "09:00", title: "Temple visit" }),
      activity({ start_time: "12:00", title: "Market stroll" }),
    ];

    const result = parseAndValidateItinerary(itinerary, baseInput);
    expect(result.days[0]!.activities.length).toBeGreaterThanOrEqual(4);
    expect(result.days[0]!.activities.length).toBeLessThanOrEqual(5);
  });

  it("rejects destination mismatches", () => {
    expect(() =>
      parseAndValidateItinerary(
        makeValidItinerary({ destination: "Lisbon, Portugal" }),
        baseInput,
      ),
    ).toThrow(expect.objectContaining({ code: "DESTINATION_MISMATCH" }));
  });

  it("repairs title/location mismatches for dining instead of failing", () => {
    const itinerary = makeValidItinerary();
    itinerary.days[0]!.activities[2] = activity({
      start_time: "13:00",
      title: "Dinner at Invented Bistro",
      category: "Food",
      location_name: "Louvre Museum",
      estimated_cost: 40,
    });

    const result = parseAndValidateItinerary(itinerary, baseInput);
    const repaired = result.days[0]!.activities[2]!;
    expect(repaired.location_name).toBe("Dinner at Invented Bistro");
  });

  it("rejects broad destinations that still need clarification", () => {
    expect(() =>
      parseAndValidateItinerary(makeValidItinerary(), {
        ...baseInput,
        destination: "California",
        destination_scope: "city",
      }),
    ).toThrow(expect.objectContaining({ code: "INVALID_INPUT" }));
  });
});

describe("titleLocationConsistent", () => {
  it("accepts matching dining title and location", () => {
    expect(
      titleLocationConsistent(
        "Mid-range Italian dinner in North Beach",
        "North Beach",
        "North Beach",
      ),
    ).toBe(true);
  });
});

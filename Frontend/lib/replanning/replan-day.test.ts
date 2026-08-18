import { describe, expect, it } from "vitest";

import { assertValidCitationIds } from "@/lib/rag/citations";
import { TripGenerationError } from "@/lib/gemini/errors";
import type { ItineraryData, ItineraryDay } from "@/lib/gemini/schema";
import {
  mergeReplannedDay,
  restoreDayFromRevision,
} from "@/lib/replanning/day-revision";

function activity(
  title: string,
  citationIds: string[],
  estimatedCost = 10,
): ItineraryDay["activities"][number] {
  return {
    start_time: "10:00",
    title,
    description: `${title} description`,
    category: "Culture",
    estimated_cost: estimatedCost,
    duration_minutes: 60,
    location_name: title,
    neighborhood: null,
    indoor_outdoor: "indoor",
    reservation_required: false,
    notes: null,
    citation_ids: citationIds,
  };
}

function sampleTrip(): ItineraryData {
  return {
    destination: "Paris",
    country: "France",
    summary: "Paris trip",
    currency: "USD",
    estimated_total_cost: 100,
    budget_status: "within_budget",
    days: [
      {
        day_number: 1,
        title: "Day 1 outdoor",
        summary: "Louvre area",
        estimated_day_cost: 50,
        activities: [activity("Louvre", ["chunk-a"], 40)],
      },
      {
        day_number: 2,
        title: "Day 2",
        summary: "Marais",
        estimated_day_cost: 50,
        activities: [activity("Marais walk", ["chunk-b"], 20)],
      },
    ],
  };
}

describe("replan day purity", () => {
  it("only changes the selected day", () => {
    const original = sampleTrip();
    const rainyDay: ItineraryDay = {
      day_number: 1,
      title: "Indoor day",
      summary: "Rain plan",
      estimated_day_cost: 30,
      activities: [activity("Musée d'Orsay", ["chunk-a"], 30)],
    };
    const merged = mergeReplannedDay(original, 1, rainyDay);
    expect(merged.days[0]?.title).toBe("Indoor day");
    expect(merged.days[1]).toEqual(original.days[1]);
  });

  it("supports rainy-day indoor preference shape", () => {
    const original = sampleTrip();
    const rainy: ItineraryDay = {
      ...original.days[0]!,
      activities: [
        {
          ...activity("Covered Passage", ["chunk-a"], 15),
          indoor_outdoor: "indoor",
        },
      ],
    };
    const merged = mergeReplannedDay(original, 1, rainy);
    expect(merged.days[0]?.activities[0]?.indoor_outdoor).toBe("indoor");
    expect(merged.days[1]).toEqual(original.days[1]);
  });

  it("supports spend-less day replacements", () => {
    const original = sampleTrip();
    const cheaper: ItineraryDay = {
      ...original.days[0]!,
      activities: [activity("Free park stroll", ["chunk-a"], 0)],
      estimated_day_cost: 0,
    };
    const merged = mergeReplannedDay(original, 1, cheaper);
    expect(merged.days[0]?.activities[0]?.estimated_cost).toBe(0);
    expect(merged.days[1]?.activities[0]?.estimated_cost).toBe(20);
  });

  it("supports running-late by dropping activities", () => {
    const original = sampleTrip();
    const late: ItineraryDay = {
      ...original.days[0]!,
      activities: [activity("Short museum stop", ["chunk-a"], 20)],
    };
    const merged = mergeReplannedDay(original, 1, late);
    expect(merged.days[0]?.activities).toHaveLength(1);
    expect(merged.days[1]).toEqual(original.days[1]);
  });

  it("rejects fabricated citations", () => {
    const original = sampleTrip();
    const bad: ItineraryData = {
      ...original,
      days: [
        {
          ...original.days[0]!,
          activities: [activity("Fake place", ["fabricated-id"], 10)],
        },
        original.days[1]!,
      ],
    };
    expect(() => assertValidCitationIds(bad, ["chunk-a", "chunk-b"])).toThrow(
      TripGenerationError,
    );
  });

  it("leaves original unchanged when replan validation fails", () => {
    const original = sampleTrip();
    const snapshot = structuredClone(original);
    try {
      assertValidCitationIds(
        {
          ...original,
          days: [
            {
              ...original.days[0]!,
              activities: [activity("Fake", ["nope"], 1)],
            },
            original.days[1]!,
          ],
        },
        ["chunk-a"],
      );
    } catch {
      // expected
    }
    expect(original).toEqual(snapshot);
  });

  it("undo restores previous day", () => {
    const original = sampleTrip();
    const previous = structuredClone(original.days[0]!);
    const changed = mergeReplannedDay(original, 1, {
      ...previous,
      title: "Changed",
      activities: [activity("New stop", ["chunk-a"], 5)],
    });
    const undone = restoreDayFromRevision(changed, 1, previous);
    expect(undone.days[0]).toEqual(previous);
    expect(undone.days[1]).toEqual(original.days[1]);
  });
});

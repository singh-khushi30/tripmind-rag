import "server-only";

import { reconcileItineraryBudget } from "@/lib/gemini/budget";
import type { ItineraryActivity, ItineraryData } from "@/lib/gemini/schema";
import type { TripPlannerInput } from "@/lib/gemini/types";
import { parseAndValidateItinerary } from "@/lib/gemini/validate-itinerary";
import { getMockItinerary } from "@/lib/mock-itineraries";

const PACE_COUNTS = {
  relaxed: 3,
  moderate: 4,
  packed: 5,
} as const;

function parseDurationMinutes(duration: string): number {
  const hours = duration.match(/(\d+(?:\.\d+)?)\s*h/i);
  const mins = duration.match(/(\d+)\s*m/i);
  if (hours || mins) {
    const total =
      (hours ? Math.round(Number(hours[1]) * 60) : 0) +
      (mins ? Number(mins[1]) : 0);
    return Math.max(30, total || 90);
  }

  const parsed = Number.parseInt(duration, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 90;
}

function fitActivitiesToPace(
  activities: ItineraryActivity[],
  pace: TripPlannerInput["travel_pace"],
): ItineraryActivity[] {
  const target = PACE_COUNTS[pace];
  const base = activities.slice(0, target);

  while (base.length < target) {
    const hour = 9 + base.length * 2;
    const index = base.length + 1;
    base.push({
      start_time: `${String(hour).padStart(2, "0")}:00`,
      title: `Neighborhood walk ${index}`,
      description: "A flexible local stroll with a short rest stop.",
      category: "Exploration",
      estimated_cost: 0,
      duration_minutes: 60,
      location_name: `Neighborhood walk ${index}`,
      neighborhood: null,
      indoor_outdoor: "outdoor",
      reservation_required: false,
      notes: null,
    });
  }

  return base.map((activity, index) => ({
    ...activity,
    start_time: `${String(9 + index * 2).padStart(2, "0")}:00`,
    duration_minutes: Math.min(activity.duration_minutes, 90),
    location_name: activity.location_name || activity.title,
  }));
}

/**
 * Explicit development fallback only.
 * Must never be called unless USE_MOCK_ITINERARY=true.
 */
export function buildMockItineraryData(input: TripPlannerInput): ItineraryData {
  const mock = getMockItinerary(
    input.destination,
    input.number_of_days,
    input.currency,
  );

  const days = mock.itinerary.map((day) => {
    const mapped = day.activities.map((activity) => ({
      start_time: activity.time,
      title: activity.title,
      description: activity.description,
      category: activity.category,
      estimated_cost: Math.min(
        activity.estimatedCost,
        input.travel_style === "luxury" ? activity.estimatedCost : 45,
      ),
      duration_minutes: parseDurationMinutes(activity.duration),
      location_name: activity.title,
      neighborhood: null,
      indoor_outdoor: "mixed" as const,
      reservation_required: false,
      notes: null,
    }));

    const activities = fitActivitiesToPace(mapped, input.travel_pace);
    const estimated_day_cost = activities.reduce(
      (sum, activity) => sum + activity.estimated_cost,
      0,
    );

    return {
      day_number: day.day,
      title: day.title,
      summary: day.dateLabel,
      estimated_day_cost,
      activities,
    };
  });

  const estimated_total_cost = days.reduce(
    (sum, day) => sum + day.estimated_day_cost,
    0,
  );

  const itinerary: ItineraryData = {
    destination: input.destination,
    country: mock.country || null,
    summary: `A ${input.travel_pace} ${input.travel_style.replace("-", " ")} plan for ${input.destination} across ${input.number_of_days} days.`,
    currency: input.currency,
    display_currency: input.currency,
    destination_local_currency: null,
    conversion_status: "not_required",
    estimated_total_cost,
    budget_status: "within_budget",
    days,
  };

  const reconciled = reconcileItineraryBudget(itinerary, input);
  return parseAndValidateItinerary(reconciled, input);
}

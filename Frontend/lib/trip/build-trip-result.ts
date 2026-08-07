/**
 * Legacy helper retained for older mock-result tooling.
 * Production trip creation uses Gemini via generateTripItinerary.
 */

import { getMockItinerary } from "@/lib/mock-itineraries";
import type { TripPlannerFormValues } from "@/types/planner";
import type { BudgetBreakdownItem, TripResult } from "@/types/trip";

const DEFAULT_BREAKDOWN: Array<Omit<BudgetBreakdownItem, "amount">> = [
  { category: "Stay", percentage: 34 },
  { category: "Food", percentage: 23 },
  { category: "Activities", percentage: 17 },
  { category: "Transport", percentage: 15 },
  { category: "Shopping", percentage: 11 },
];

function buildBudgetBreakdown(total: number): BudgetBreakdownItem[] {
  return DEFAULT_BREAKDOWN.map((item) => ({
    ...item,
    amount: Math.round((item.percentage / 100) * total),
  }));
}

export function buildTripResult(form: TripPlannerFormValues): TripResult {
  const mock = getMockItinerary(form.destination, form.days, form.currency);
  const estimatedTotalCost = form.budget;

  return {
    id: `trip_${mock.key}_${form.days}d`,
    destination: mock.destinationLabel,
    country: mock.country || null,
    summary: `A ${form.pace}, ${form.travelStyle.replace("-", " ")} plan for ${mock.destinationLabel}.`,
    days: form.days,
    travelers: form.travelers,
    travelStyle: form.travelStyle,
    pace: form.pace,
    interests: form.interests,
    budget: {
      total: form.budget,
      currency: form.currency,
      estimatedTotalCost,
      budgetStatus: "within_budget",
      perPerson: Math.round(form.budget / form.travelers),
    },
    itinerary: mock.itinerary.map((day) => ({
      day_number: day.day,
      title: day.title,
      summary: day.dateLabel,
      estimated_day_cost: day.activities.reduce(
        (sum, activity) => sum + activity.estimatedCost,
        0,
      ),
      activities: day.activities.map((activity) => ({
        start_time: activity.time,
        title: activity.title,
        description: activity.description,
        category: activity.category,
        estimated_cost: activity.estimatedCost,
        duration_minutes: 90,
        location_name: activity.title,
        neighborhood: null,
        indoor_outdoor: "mixed" as const,
        reservation_required: false,
        notes: null,
      })),
    })),
  };
}

export function legacyBudgetBreakdown(total: number): BudgetBreakdownItem[] {
  return buildBudgetBreakdown(total);
}

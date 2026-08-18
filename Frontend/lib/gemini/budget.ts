import type { ItineraryData, ItineraryDay } from "@/lib/gemini/schema";
import type { TripPlannerInput } from "@/lib/gemini/types";
import { resolveLocalCurrency } from "@/lib/currency/local-currency";
import type { TravelStyle } from "@/types/trip";

export type BudgetAllocationGuidance = {
  food: { min: number; max: number };
  activities: { min: number; max: number };
  localTransport: { min: number; max: number };
  bufferMin: number;
  includeAccommodation: boolean;
};

export type BudgetTotals = {
  activity_total: number;
  day_total: number;
  calculated_total: number;
  cost_per_traveler: number;
  remaining_budget: number;
  percentage_used: number;
};

export function getBudgetAllocationGuidance(
  style: TravelStyle,
  includeAccommodation: boolean,
): BudgetAllocationGuidance {
  const base =
    style === "luxury"
      ? {
          food: { min: 0.25, max: 0.45 },
          activities: { min: 0.2, max: 0.4 },
          localTransport: { min: 0.08, max: 0.2 },
          bufferMin: 0.1,
        }
      : style === "budget" || style === "backpacking"
        ? {
            food: { min: 0.25, max: 0.35 },
            activities: { min: 0.15, max: 0.25 },
            localTransport: { min: 0.1, max: 0.2 },
            bufferMin: 0.15,
          }
        : {
            food: { min: 0.3, max: 0.4 },
            activities: { min: 0.2, max: 0.3 },
            localTransport: { min: 0.1, max: 0.15 },
            bufferMin: 0.15,
          };

  return {
    ...base,
    includeAccommodation,
  };
}

export function describeBudgetCoverage(input: TripPlannerInput): string[] {
  const included = ["Food & dining", "Activities & attractions", "Local transportation"];
  if (input.include_accommodation_in_budget) {
    included.unshift("Accommodation");
  }
  if (input.include_transport_to_destination_in_budget) {
    included.push("Flights / long-distance transport to destination");
  }
  return included;
}

export function recalculateDayCost(day: ItineraryDay): number {
  return day.activities.reduce(
    (sum, activity) => sum + Math.max(0, activity.estimated_cost),
    0,
  );
}

export function calculateBudgetTotals(
  itinerary: ItineraryData,
  input: TripPlannerInput,
): BudgetTotals {
  const days = itinerary.days.map((day) => ({
    ...day,
    estimated_day_cost: recalculateDayCost(day),
  }));

  const activity_total = days.reduce(
    (sum, day) =>
      sum +
      day.activities.reduce(
        (daySum, activity) => daySum + Math.max(0, activity.estimated_cost),
        0,
      ),
    0,
  );
  const day_total = days.reduce((sum, day) => sum + day.estimated_day_cost, 0);
  const calculated_total = day_total;
  const cost_per_traveler = calculated_total / Math.max(input.travelers, 1);
  const remaining_budget = input.budget - calculated_total;
  const percentage_used =
    input.budget > 0 ? (calculated_total / input.budget) * 100 : 0;

  return {
    activity_total: roundMoney(activity_total),
    day_total: roundMoney(day_total),
    calculated_total: roundMoney(calculated_total),
    cost_per_traveler: roundMoney(cost_per_traveler),
    remaining_budget: roundMoney(remaining_budget),
    percentage_used: roundMoney(percentage_used),
  };
}

export function budgetStatusFromTotals(
  calculatedTotal: number,
  budget: number,
): ItineraryData["budget_status"] {
  if (calculatedTotal > budget * 1.1) return "over_budget";
  if (calculatedTotal >= budget * 0.9) return "near_budget";
  return "within_budget";
}

export function reconcileItineraryBudget(
  itinerary: ItineraryData,
  input: TripPlannerInput,
): ItineraryData {
  const days = itinerary.days.map((day) => ({
    ...day,
    estimated_day_cost: roundMoney(recalculateDayCost(day)),
  }));

  const withDays = { ...itinerary, days };
  const totals = calculateBudgetTotals(withDays, input);
  // Prefer deterministic mapping over Gemini's currency claim — models often
  // copy the display currency into destination_local_currency by mistake.
  const localCurrency =
    resolveLocalCurrency(itinerary.destination, itinerary.country) ??
    itinerary.destination_local_currency ??
    null;
  const conversionStatus =
    itinerary.conversion_status ??
    (localCurrency && localCurrency !== input.currency
      ? "estimated"
      : "not_required");

  return {
    ...withDays,
    currency: input.currency,
    display_currency: input.currency,
    destination_local_currency: localCurrency,
    conversion_status: conversionStatus,
    // Provisional total in local currency units until FX enrichment converts.
    estimated_total_cost: totals.calculated_total,
    budget_status: budgetStatusFromTotals(totals.calculated_total, input.budget),
    budget_totals: totals,
  };
}

export function isWithinStyleBudget(
  style: TravelStyle,
  calculatedTotal: number,
  budget: number,
): boolean {
  if (style === "luxury") return true;
  return calculatedTotal <= budget * 1.05;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

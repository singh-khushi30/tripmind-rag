import type { ItineraryActivity, ItineraryData, ItineraryDay } from "@/lib/gemini/schema";
import type { TripPlannerInput } from "@/lib/gemini/types";
import { convertAmount } from "@/lib/currency/convert";
import type { ExchangeRateStatus } from "@/lib/currency/constants";

export type ExtendedBudgetStatus =
  | "comfortably_within_budget"
  | "within_budget"
  | "near_budget"
  | "over_budget";

export type TripBudgetBreakdown = {
  activity_total_local: number;
  activity_total_display: number;
  day_total_display: number;
  calculated_total_display: number;
  cost_per_traveler_display: number;
  remaining_budget_display: number;
  percentage_used: number;
  daily_average_display: number;
  budget_status: ExtendedBudgetStatus;
  local_currency: string | null;
  display_currency: string;
  exchange_rate: number | null;
  exchange_status: ExchangeRateStatus;
  warning: string | null;
  day_costs_display: Array<{ day_number: number; total: number }>;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sumActivityCostsLocal(day: ItineraryDay): number {
  return day.activities.reduce(
    (sum, activity) => sum + Math.max(0, activity.estimated_cost),
    0,
  );
}

export function activityDisplayCost(
  activity: ItineraryActivity,
  rate: number | null,
): number | null {
  if (activity.estimated_cost_display != null) {
    return activity.estimated_cost_display;
  }
  return convertAmount(activity.estimated_cost, rate);
}

export function budgetStatusFromUtilization(
  percentageUsed: number,
): ExtendedBudgetStatus {
  if (percentageUsed > 100) return "over_budget";
  if (percentageUsed >= 90) return "near_budget";
  if (percentageUsed <= 70) return "comfortably_within_budget";
  return "within_budget";
}

export function buildBudgetWarning(input: {
  status: ExtendedBudgetStatus;
  percentageUsed: number;
  remaining: number;
  overBy: number;
  displayCurrency: string;
  formatMoney: (amount: number, currency: string) => string;
}): string | null {
  if (input.status === "over_budget") {
    return `This itinerary exceeds your budget by approximately ${input.formatMoney(input.overBy, input.displayCurrency)}.`;
  }
  if (input.status === "near_budget") {
    return `You're using about ${Math.round(input.percentageUsed)}% of your trip budget.`;
  }
  if (input.remaining > 0) {
    return `You have approximately ${input.formatMoney(input.remaining, input.displayCurrency)} remaining for flexibility.`;
  }
  return null;
}

/**
 * Deterministic budget engine.
 * Activity.estimated_cost is treated as DESTINATION LOCAL currency.
 * Conversion into display currency uses the provided rate (never Gemini math).
 */
export function calculateTripBudget(input: {
  itinerary: ItineraryData;
  planner: Pick<
    TripPlannerInput,
    | "budget"
    | "currency"
    | "travelers"
    | "include_accommodation_in_budget"
    | "include_transport_to_destination_in_budget"
  >;
  localCurrency: string | null;
  exchangeRate: number | null;
  exchangeStatus: ExchangeRateStatus;
  formatMoney?: (amount: number, currency: string) => string;
}): TripBudgetBreakdown {
  const displayCurrency = input.planner.currency;
  const rate =
    !input.localCurrency || input.localCurrency === displayCurrency
      ? 1
      : input.exchangeRate;

  const day_costs_display = input.itinerary.days.map((day) => {
    const local = sumActivityCostsLocal(day);
    const display = rate == null ? local : convertAmount(local, rate) ?? local;
    return { day_number: day.day_number, total: roundMoney(display) };
  });

  const activity_total_local = roundMoney(
    input.itinerary.days.reduce(
      (sum, day) => sum + sumActivityCostsLocal(day),
      0,
    ),
  );

  const activity_total_display = roundMoney(
    day_costs_display.reduce((sum, day) => sum + day.total, 0),
  );

  // Accommodation / long-haul transport are toggles for coverage messaging only
  // unless Gemini already included them as activities. We do not invent those costs.
  void input.planner.include_accommodation_in_budget;
  void input.planner.include_transport_to_destination_in_budget;

  const calculated_total_display = activity_total_display;
  const travelers = Math.max(input.planner.travelers, 1);
  const cost_per_traveler_display = roundMoney(
    calculated_total_display / travelers,
  );
  const remaining_budget_display = roundMoney(
    input.planner.budget - calculated_total_display,
  );
  const percentage_used =
    input.planner.budget > 0
      ? roundMoney((calculated_total_display / input.planner.budget) * 100)
      : 0;
  const daily_average_display = roundMoney(
    calculated_total_display / Math.max(input.itinerary.days.length, 1),
  );
  const budget_status = budgetStatusFromUtilization(percentage_used);

  const formatMoney =
    input.formatMoney ??
    ((amount: number, currency: string) => `${currency} ${amount.toFixed(0)}`);

  const warning = buildBudgetWarning({
    status: budget_status,
    percentageUsed: percentage_used,
    remaining: Math.max(0, remaining_budget_display),
    overBy: Math.max(0, -remaining_budget_display),
    displayCurrency,
    formatMoney,
  });

  const exchange_status: ExchangeRateStatus =
    !input.localCurrency || input.localCurrency === displayCurrency
      ? "not_required"
      : rate == null
        ? "unavailable"
        : input.exchangeStatus;

  return {
    activity_total_local,
    activity_total_display,
    day_total_display: activity_total_display,
    calculated_total_display,
    cost_per_traveler_display,
    remaining_budget_display,
    percentage_used,
    daily_average_display,
    budget_status,
    local_currency: input.localCurrency,
    display_currency: displayCurrency,
    exchange_rate: rate,
    exchange_status,
    warning,
    day_costs_display,
  };
}

export function applyBudgetToItinerary(
  itinerary: ItineraryData,
  breakdown: TripBudgetBreakdown,
): ItineraryData {
  const rate = breakdown.exchange_rate;
  const days = itinerary.days.map((day) => {
    const dayCost = breakdown.day_costs_display.find(
      (entry) => entry.day_number === day.day_number,
    );
    return {
      ...day,
      estimated_day_cost: dayCost?.total ?? day.estimated_day_cost,
      activities: day.activities.map((activity) => ({
        ...activity,
        estimated_cost_display:
          rate == null
            ? activity.estimated_cost
            : (convertAmount(activity.estimated_cost, rate) ??
              activity.estimated_cost),
      })),
    };
  });

  const schemaStatus =
    breakdown.budget_status === "comfortably_within_budget"
      ? "within_budget"
      : breakdown.budget_status === "within_budget"
        ? "within_budget"
        : breakdown.budget_status === "near_budget"
          ? "near_budget"
          : "over_budget";

  return {
    ...itinerary,
    days,
    currency: breakdown.display_currency,
    display_currency: breakdown.display_currency,
    destination_local_currency: breakdown.local_currency,
    conversion_status:
      breakdown.exchange_status === "unavailable"
        ? "unavailable"
        : breakdown.exchange_status === "not_required"
          ? "not_required"
          : "estimated",
    estimated_total_cost: breakdown.calculated_total_display,
    budget_status: schemaStatus,
    budget_totals: {
      activity_total: breakdown.activity_total_display,
      day_total: breakdown.day_total_display,
      calculated_total: breakdown.calculated_total_display,
      cost_per_traveler: breakdown.cost_per_traveler_display,
      remaining_budget: breakdown.remaining_budget_display,
      percentage_used: breakdown.percentage_used,
    },
    budget_meta: {
      warning: breakdown.warning,
      exchange_rate: breakdown.exchange_rate,
      exchange_status: breakdown.exchange_status,
      extended_status: breakdown.budget_status,
      daily_average: breakdown.daily_average_display,
    },
  };
}

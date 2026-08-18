import { describe, expect, it } from "vitest";

import {
  applyBudgetToItinerary,
  budgetStatusFromUtilization,
  calculateTripBudget,
} from "@/lib/budget/calculate-trip-budget";
import type { ItineraryData } from "@/lib/gemini/schema";
import type { TripPlannerInput } from "@/lib/gemini/types";

function sampleItinerary(): ItineraryData {
  return {
    destination: "Tokyo",
    country: "Japan",
    summary: "Tokyo sample",
    currency: "USD",
    destination_local_currency: "JPY",
    estimated_total_cost: 0,
    budget_status: "within_budget",
    days: [
      {
        day_number: 1,
        title: "Day 1",
        summary: "Explore",
        estimated_day_cost: 0,
        activities: [
          {
            start_time: "10:00",
            title: "Museum",
            description: "Indoor museum",
            category: "Culture",
            estimated_cost: 2500,
            duration_minutes: 120,
            location_name: "Museum",
            neighborhood: "Ueno",
            indoor_outdoor: "indoor",
            reservation_required: false,
            notes: null,
            citation_ids: ["chunk-1"],
          },
          {
            start_time: "13:00",
            title: "Lunch",
            description: "Local lunch",
            category: "Food",
            estimated_cost: 1500,
            duration_minutes: 60,
            location_name: "Lunch spot",
            neighborhood: "Ueno",
            indoor_outdoor: "indoor",
            reservation_required: false,
            notes: null,
            citation_ids: ["chunk-1"],
          },
        ],
      },
      {
        day_number: 2,
        title: "Day 2",
        summary: "More",
        estimated_day_cost: 0,
        activities: [
          {
            start_time: "11:00",
            title: "Park",
            description: "Outdoor park",
            category: "Nature",
            estimated_cost: 0,
            duration_minutes: 90,
            location_name: "Park",
            neighborhood: "Shibuya",
            indoor_outdoor: "outdoor",
            reservation_required: false,
            notes: null,
            citation_ids: ["chunk-1"],
          },
        ],
      },
    ],
  };
}

const planner = {
  budget: 200,
  currency: "USD",
  travelers: 2,
  include_accommodation_in_budget: false,
  include_transport_to_destination_in_budget: false,
} satisfies Pick<
  TripPlannerInput,
  | "budget"
  | "currency"
  | "travelers"
  | "include_accommodation_in_budget"
  | "include_transport_to_destination_in_budget"
>;

describe("deterministic budget engine", () => {
  it("converts local costs before totaling", () => {
    const breakdown = calculateTripBudget({
      itinerary: sampleItinerary(),
      planner,
      localCurrency: "JPY",
      exchangeRate: 0.01,
      exchangeStatus: "live_or_latest",
    });

    // Day1: 4000 JPY * 0.01 = 40; Day2: 0
    expect(breakdown.day_costs_display[0]?.total).toBe(40);
    expect(breakdown.calculated_total_display).toBe(40);
    expect(breakdown.cost_per_traveler_display).toBe(20);
    expect(breakdown.remaining_budget_display).toBe(160);
    expect(breakdown.budget_status).toBe("comfortably_within_budget");
  });

  it("detects over-budget after conversion", () => {
    const breakdown = calculateTripBudget({
      itinerary: sampleItinerary(),
      planner: { ...planner, budget: 30 },
      localCurrency: "JPY",
      exchangeRate: 0.01,
      exchangeStatus: "live_or_latest",
    });
    expect(breakdown.budget_status).toBe("over_budget");
    expect(breakdown.warning).toContain("exceeds your budget");
  });

  it("maps utilization thresholds", () => {
    expect(budgetStatusFromUtilization(50)).toBe("comfortably_within_budget");
    expect(budgetStatusFromUtilization(80)).toBe("within_budget");
    expect(budgetStatusFromUtilization(95)).toBe("near_budget");
    expect(budgetStatusFromUtilization(110)).toBe("over_budget");
  });

  it("applies converted display costs onto itinerary", () => {
    const breakdown = calculateTripBudget({
      itinerary: sampleItinerary(),
      planner,
      localCurrency: "JPY",
      exchangeRate: 0.01,
      exchangeStatus: "live_or_latest",
    });
    const applied = applyBudgetToItinerary(sampleItinerary(), breakdown);
    expect(applied.days[0]?.activities[0]?.estimated_cost).toBe(2500);
    expect(applied.days[0]?.activities[0]?.estimated_cost_display).toBe(25);
    expect(applied.estimated_total_cost).toBe(40);
    expect(applied.budget_meta?.extended_status).toBe(
      "comfortably_within_budget",
    );
  });
});

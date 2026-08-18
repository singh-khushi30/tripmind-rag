import { describe, expect, it } from "vitest";

import {
  calculateBudgetTotals,
  reconcileItineraryBudget,
} from "@/lib/gemini/budget";
import type { ItineraryData } from "@/lib/gemini/schema";
import type { TripPlannerInput } from "@/lib/gemini/types";

const input: TripPlannerInput = {
  destination: "Paris",
  number_of_days: 1,
  budget: 500,
  currency: "EUR",
  travelers: 2,
  travel_style: "mid-range",
  travel_pace: "moderate",
  interests: ["food"],
  destination_scope: "city",
  selected_cities: [],
  include_accommodation_in_budget: false,
  include_transport_to_destination_in_budget: false,
};

function sampleItinerary(totalHint = 999): ItineraryData {
  return {
    destination: "Paris",
    country: "France",
    summary: "A one-day Paris plan.",
    currency: "EUR",
    estimated_total_cost: totalHint,
    budget_status: "within_budget",
    days: [
      {
        day_number: 1,
        title: "Central Paris",
        summary: "Landmarks and lunch.",
        estimated_day_cost: 80,
        activities: [
          {
            start_time: "09:00",
            title: "Louvre visit",
            description: "Morning museum time.",
            category: "Culture",
            estimated_cost: 20,
            duration_minutes: 120,
            location_name: "Louvre",
            neighborhood: "1st arrondissement",
            indoor_outdoor: "indoor",
            reservation_required: false,
            notes: null,
          },
          {
            start_time: "12:00",
            title: "Mid-range lunch near Louvre",
            description: "Casual lunch.",
            category: "Food",
            estimated_cost: 30,
            duration_minutes: 60,
            location_name: "Mid-range lunch near Louvre",
            neighborhood: "1st arrondissement",
            indoor_outdoor: "indoor",
            reservation_required: false,
            notes: null,
          },
          {
            start_time: "14:00",
            title: "Seine walk",
            description: "Afternoon stroll.",
            category: "Nature",
            estimated_cost: 0,
            duration_minutes: 90,
            location_name: "Seine walk",
            neighborhood: null,
            indoor_outdoor: "outdoor",
            reservation_required: false,
            notes: null,
          },
          {
            start_time: "17:00",
            title: "Cafe break",
            description: "Rest stop.",
            category: "Food",
            estimated_cost: 10,
            duration_minutes: 45,
            location_name: "Cafe break",
            neighborhood: null,
            indoor_outdoor: "indoor",
            reservation_required: false,
            notes: null,
          },
        ],
      },
    ],
  };
}

describe("budget reconciliation", () => {
  it("makes day totals equal activity totals", () => {
    const reconciled = reconcileItineraryBudget(sampleItinerary(), input);
    const day = reconciled.days[0]!;
    const activitySum = day.activities.reduce(
      (sum, activity) => sum + activity.estimated_cost,
      0,
    );
    expect(day.estimated_day_cost).toBe(activitySum);
  });

  it("makes final total equal day totals and ignores Gemini total", () => {
    const reconciled = reconcileItineraryBudget(sampleItinerary(9999), input);
    const dayTotal = reconciled.days.reduce(
      (sum, day) => sum + day.estimated_day_cost,
      0,
    );
    expect(reconciled.estimated_total_cost).toBe(dayTotal);
    expect(reconciled.estimated_total_cost).not.toBe(9999);

    const totals = calculateBudgetTotals(reconciled, input);
    expect(totals.day_total).toBe(totals.activity_total);
    expect(totals.calculated_total).toBe(totals.day_total);
  });

  it("keeps mid-range itineraries within budget after reconciliation", () => {
    const reconciled = reconcileItineraryBudget(sampleItinerary(), input);
    expect(reconciled.estimated_total_cost).toBeLessThanOrEqual(
      input.budget * 1.05,
    );
    expect(reconciled.budget_status).toBe("within_budget");
  });

  it("prefers deterministic local currency over Gemini display-currency mistakes", () => {
    const kyotoInput: TripPlannerInput = {
      ...input,
      destination: "Kyoto, Japan",
      currency: "USD",
      budget: 3200,
    };
    const reconciled = reconcileItineraryBudget(
      {
        ...sampleItinerary(99999),
        destination: "Kyoto",
        country: "Japan",
        // Gemini sometimes copies the user's display currency here incorrectly.
        destination_local_currency: "USD",
        currency: "USD",
        days: [
          {
            day_number: 1,
            title: "Temples",
            summary: "Day in Kyoto",
            estimated_day_cost: 12000,
            activities: [
              {
                start_time: "10:00",
                title: "Temple",
                description: "Visit",
                category: "Culture",
                estimated_cost: 12000,
                duration_minutes: 120,
                location_name: "Temple",
                neighborhood: null,
                indoor_outdoor: "outdoor",
                reservation_required: false,
                notes: null,
              },
            ],
          },
        ],
      },
      kyotoInput,
    );
    expect(reconciled.destination_local_currency).toBe("JPY");
  });
});

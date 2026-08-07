import { itineraryDataSchema } from "@/lib/gemini/schema";
import type { TripPlannerInput } from "@/lib/gemini/types";
import type { Trip } from "@/types/database";
import type { TripPlannerFormValues } from "@/types/planner";
import type { Currency, TripResult } from "@/types/trip";

export function toTripPlannerInput(
  form: TripPlannerFormValues,
  startDate?: string | null,
): TripPlannerInput {
  return {
    destination: form.destination.trim(),
    start_date: startDate ?? null,
    number_of_days: form.days,
    budget: form.budget,
    currency: form.currency,
    travelers: form.travelers,
    travel_style: form.travelStyle,
    travel_pace: form.pace,
    interests: form.interests,
    food_preference: form.foodPreference ?? null,
    special_notes: form.specialNotes?.trim() ? form.specialNotes.trim() : null,
    destination_scope: form.destinationScope,
    selected_cities: form.selectedCities ?? [],
    include_accommodation_in_budget: form.includeAccommodationInBudget,
    include_transport_to_destination_in_budget:
      form.includeTransportToDestinationInBudget,
  };
}

export function tripToTripResult(trip: Trip): TripResult {
  const parsed = itineraryDataSchema.safeParse(trip.itinerary_data);
  const data = parsed.success ? parsed.data : null;
  const currency = (trip.currency ||
    data?.display_currency ||
    data?.currency ||
    "USD") as Currency;
  const estimatedTotalCost = data?.estimated_total_cost ?? Number(trip.budget);
  const totals = data?.budget_totals;

  return {
    id: trip.id,
    destination: data?.destination || trip.destination,
    country: data?.country ?? null,
    summary: data?.summary ?? "Saved TripMind itinerary.",
    days: trip.number_of_days,
    travelers: trip.travelers,
    travelStyle: trip.travel_style,
    pace: trip.travel_pace,
    interests: trip.interests ?? [],
    budget: {
      total: Number(trip.budget),
      currency,
      estimatedTotalCost,
      budgetStatus: data?.budget_status ?? "within_budget",
      perPerson:
        totals?.cost_per_traveler ??
        Math.round(estimatedTotalCost / Math.max(trip.travelers, 1)),
      remainingBudget: totals?.remaining_budget,
      percentageUsed: totals?.percentage_used,
      conversionStatus: data?.conversion_status ?? "unavailable",
      destinationLocalCurrency: data?.destination_local_currency ?? null,
    },
    itinerary: data?.days ?? [],
  };
}

export function tripToSavedTripCard(trip: Trip) {
  return {
    id: trip.id,
    destination: trip.destination,
    date: trip.start_date ?? trip.created_at.slice(0, 10),
    budget: Number(trip.budget),
    currency: trip.currency,
    days: trip.number_of_days,
    status: trip.status,
    createdAt: trip.created_at,
  };
}

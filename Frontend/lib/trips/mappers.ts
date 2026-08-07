import type { ItineraryData, Trip } from "@/types/database";
import type { TripPlannerFormValues } from "@/types/planner";
import type { Currency, TripResult } from "@/types/trip";
import { buildTripResult } from "@/lib/trip/build-trip-result";

export function buildItineraryData(
  form: TripPlannerFormValues,
): ItineraryData {
  const result = buildTripResult(form);

  return {
    summary: result.summary,
    country: result.country,
    budget: result.budget,
    days: result.itinerary,
    sources: result.sources,
    map: {
      label: result.map.label,
      lat: result.map.lat,
      lng: result.map.lng,
      markers: result.map.markers,
    },
  };
}

export function tripToTripResult(trip: Trip): TripResult {
  const data = trip.itinerary_data;
  const currency = (trip.currency || data.budget.currency || "USD") as Currency;

  return {
    id: trip.id,
    destination: trip.destination,
    country: data.country ?? "",
    summary: data.summary,
    days: trip.number_of_days,
    travelers: trip.travelers,
    travelStyle: trip.travel_style,
    pace: trip.travel_pace,
    interests: trip.interests ?? [],
    budget: {
      total: Number(trip.budget),
      currency,
      perPerson:
        data.budget?.perPerson ??
        Math.round(Number(trip.budget) / Math.max(trip.travelers, 1)),
      breakdown: data.budget?.breakdown ?? [],
    },
    itinerary: data.days ?? [],
    sources: data.sources ?? [],
    map: {
      label: data.map?.label ?? trip.destination,
      lat: data.map?.lat ?? 0,
      lng: data.map?.lng ?? 0,
      markers: data.map?.markers,
    },
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

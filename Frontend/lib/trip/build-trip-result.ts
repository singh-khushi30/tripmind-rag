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

function buildSummary(
  form: TripPlannerFormValues,
  destinationLabel: string,
  isGeneric: boolean,
) {
  const style = form.travelStyle.replace("-", " ");
  const interestLabel = form.interests.slice(0, 3).join(", ");
  const notes = form.specialNotes?.trim();

  const base = isGeneric
    ? `A temporary mock itinerary for ${destinationLabel} across ${form.days} days — ${form.pace} pace, ${style} style, shaped around ${interestLabel}${form.interests.length > 3 ? ", and more" : ""}. Destination-specific activities will replace this preview later.`
    : `A ${form.pace}, ${style} plan for ${destinationLabel} across ${form.days} days — shaped around ${interestLabel}${form.interests.length > 3 ? ", and more" : ""}.`;

  if (!notes) return base;
  return `${base} Traveler notes: ${notes}`;
}

function buildBudgetBreakdown(total: number): BudgetBreakdownItem[] {
  return DEFAULT_BREAKDOWN.map((item) => ({
    ...item,
    amount: Math.round((item.percentage / 100) * total),
  }));
}

export function buildTripResult(form: TripPlannerFormValues): TripResult {
  const mock = getMockItinerary(
    form.destination,
    form.days,
    form.currency,
  );

  return {
    id: `trip_${mock.key}_${form.days}d`,
    destination: mock.destinationLabel,
    country: mock.country,
    summary: buildSummary(form, mock.destinationLabel, mock.isGeneric),
    days: form.days,
    travelers: form.travelers,
    travelStyle: form.travelStyle,
    pace: form.pace,
    interests: form.interests,
    budget: {
      total: form.budget,
      currency: form.currency,
      perPerson: Math.round(form.budget / form.travelers),
      breakdown: buildBudgetBreakdown(form.budget),
    },
    itinerary: mock.itinerary,
    sources: mock.sources,
    map: {
      label: mock.map.label,
      lat: mock.map.lat,
      lng: mock.map.lng,
      markers: mock.map.markers,
    },
  };
}

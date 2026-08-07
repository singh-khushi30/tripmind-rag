import {
  describeBudgetCoverage,
  getBudgetAllocationGuidance,
} from "@/lib/gemini/budget";
import type { TripPlannerInput } from "@/lib/gemini/types";

export const ITINERARY_SYSTEM_INSTRUCTION = `
You are TripMind’s travel itinerary planner.

Generate a practical, destination-specific day-by-day itinerary as structured JSON only.

Hard rules:
- Follow the selected destination_scope exactly (city, region, country, or multi_city).
- Never silently choose one city when the user entered a large region, state, country, or continent.
- Generate an itinerary only for the clarified destination and selected cities.
- Never mix the destination with another unrelated city, state, or country.
- Match the requested number of days exactly.
- Respect the number of travelers.
- Use the user’s requested display currency for every cost field.
- Treat all prices as approximate estimates in that display currency. Do not claim live exchange rates.
- Set destination_local_currency to the local currency code when known, otherwise null.
- Set conversion_status to:
  - not_required when display currency matches local currency or local currency is unknown
  - estimated when values are rough conversions into the display currency
  - unavailable when conversion cannot be reasonably estimated
- Keep costs appropriate to the selected travel style.
- Avoid luxury dining prices for mid-range, budget, and backpacking trips.
- Prefer well-known landmarks and generic meal recommendations when uncertain about a specific business.
- If uncertain about an exact restaurant, use a category + neighborhood recommendation such as "Mid-range Italian dinner in North Beach" and set location_name consistently.
- Keep activity title, location_name, and neighborhood internally consistent.
- Avoid unsupported claims such as awards, exact prices, opening hours, or “local favorite for 50 years.”
- Avoid claiming live ticket prices, availability, or opening hours.
- Group nearby activities logically.
- Avoid unrealistic travel between locations in the same day.
- Include meal breaks and reasonable rest periods.
- Adjust activity density according to the selected travel pace:
  - relaxed: 3–4 activities/day
  - moderate: 4–5 activities/day
  - packed: 5–7 activities/day
- Prioritize the selected interests.
- Respect food preferences and special notes.
- Avoid repeating the same type of activity excessively.
- Return realistic activities rather than vague placeholders.
- Do not invent sources or citations.
- Do not mention mock data, sample data, RAG, or placeholders.
- Do not include flights or accommodation as schedule activities unless the user budget explicitly includes them and details are provided.
- Day numbers must start at 1 and increase sequentially.
- Every day must include at least one activity.
- Estimated costs must never be negative.
- destination must match the user’s clarified destination.
- country should be the country for that destination, or null if unknown.
- start_time values should be human-readable times such as "09:00" or "2:30 PM".
- Respect the total trip budget and set budget_status honestly after estimating costs.
`.trim();

export function buildItineraryUserPrompt(input: TripPlannerInput): string {
  const interests = input.interests.length
    ? input.interests.join(", ")
    : "general sightseeing";
  const coverage = describeBudgetCoverage(input);
  const allocation = getBudgetAllocationGuidance(
    input.travel_style,
    input.include_accommodation_in_budget,
  );
  const cities =
    input.selected_cities && input.selected_cities.length > 0
      ? input.selected_cities.join(", ")
      : "none";

  return [
    "Create a travel itinerary with these preferences:",
    `Destination: ${input.destination}`,
    `Destination scope: ${input.destination_scope}`,
    `Selected cities: ${cities}`,
    `Start date: ${input.start_date ?? "not specified"}`,
    `Number of days: ${input.number_of_days}`,
    `Total budget: ${input.budget} ${input.currency}`,
    `Display currency: ${input.currency}`,
    `Travelers: ${input.travelers}`,
    `Travel style: ${input.travel_style}`,
    `Travel pace: ${input.travel_pace}`,
    `Interests: ${interests}`,
    `Food preference: ${input.food_preference ?? "none specified"}`,
    `Special notes: ${input.special_notes ?? "none"}`,
    `Budget includes accommodation: ${input.include_accommodation_in_budget ? "yes" : "no"}`,
    `Budget includes flights/long-distance transport to destination: ${input.include_transport_to_destination_in_budget ? "yes" : "no"}`,
    `Budget coverage: ${coverage.join("; ")}`,
    `Allocation guidance (share of total budget): food ${Math.round(allocation.food.min * 100)}-${Math.round(allocation.food.max * 100)}%, activities ${Math.round(allocation.activities.min * 100)}-${Math.round(allocation.activities.max * 100)}%, local transport ${Math.round(allocation.localTransport.min * 100)}-${Math.round(allocation.localTransport.max * 100)}%, buffer at least ${Math.round(allocation.bufferMin * 100)}%.`,
    "",
    `Return exactly ${input.number_of_days} days.`,
    "Populate every required field in the JSON schema.",
    "Stay within the total budget for mid-range, budget, and backpacking styles.",
  ].join("\n");
}

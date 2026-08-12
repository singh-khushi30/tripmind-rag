import "server-only";

import { getGeminiClient } from "@/lib/gemini/client";
import { GEMINI_MODEL, GEMINI_TIMEOUT_MS, isMockItineraryEnabled } from "@/lib/gemini/env";
import { getItineraryJsonSchema, type ItineraryData } from "@/lib/gemini/schema";
import type { TripPlannerInput } from "@/lib/gemini/types";
import { parseAndValidateItinerary } from "@/lib/gemini/validate-itinerary";
import { reorderItineraryForRoutes } from "@/lib/maps/reorder-day";
import type { RouteWarning } from "@/lib/maps/validate-route";

function repairPlannerStub(itinerary: ItineraryData): TripPlannerInput {
  return {
    destination: itinerary.destination,
    start_date: null,
    number_of_days: itinerary.days.length,
    budget: itinerary.estimated_total_cost,
    currency: itinerary.currency as TripPlannerInput["currency"],
    travelers: 1,
    travel_style: "mid-range",
    travel_pace: "moderate",
    interests: [],
    food_preference: null,
    special_notes: null,
    destination_scope: "city",
    selected_cities: [],
    include_accommodation_in_budget: false,
    include_transport_to_destination_in_budget: false,
  };
}

/**
 * Constrained repair: reorder first; only ask Gemini when major issues remain.
 * Repair must reuse existing activities/citations — no new attractions.
 */
export async function repairItineraryRoutes(input: {
  itinerary: ItineraryData;
  warnings: RouteWarning[];
  groundedContextBlock?: string | null;
}): Promise<ItineraryData> {
  const reordered = reorderItineraryForRoutes(input.itinerary);

  const major = input.warnings.filter(
    (warning) =>
      warning.severity === "error" || warning.code === "excessive_backtracking",
  );

  if (major.length === 0 || isMockItineraryEnabled()) {
    return reordered;
  }

  try {
    const ai = getGeminiClient();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    const warningText = major
      .map(
        (warning) =>
          `- Day ${warning.day_number}: ${warning.message} (${warning.code})`,
      )
      .join("\n");

    const prompt = [
      "Repair this travel itinerary for geographic realism.",
      "Rules:",
      "- Keep the same destination, days, and budget totals shape.",
      "- You may reorder activities within the same day.",
      "- You may drop at most one problematic activity per day if unavoidable.",
      "- Do NOT invent new attractions, neighborhoods, or citation_ids.",
      "- Every remaining activity must keep its existing citation_ids unchanged.",
      "- Prefer walking-friendly clusters in the same neighborhood.",
      "",
      "Route problems:",
      warningText,
      "",
      input.groundedContextBlock
        ? `Grounded source context (facts only):\n${input.groundedContextBlock}`
        : "",
      "",
      "Current itinerary JSON:",
      JSON.stringify(reordered),
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            "You repair TripMind itineraries for realistic same-day geography. Never add uncited places.",
          responseMimeType: "application/json",
          responseJsonSchema: getItineraryJsonSchema(),
          abortSignal: controller.signal,
          temperature: 0.3,
        },
      });

      const text = response.text?.trim();
      if (!text) return reordered;

      const allowed = new Set<string>();
      for (const day of reordered.days) {
        for (const activity of day.activities) {
          for (const id of activity.citation_ids ?? []) allowed.add(id);
        }
      }

      const repaired = parseAndValidateItinerary(
        text,
        repairPlannerStub(reordered),
        {
          allowedCitationKeys: [...allowed],
          requireCitations: allowed.size > 0,
        },
      );

      // Preserve geocoded coordinates by matching location_name + title.
      const coordLookup = new Map<string, {
        latitude: number | null | undefined;
        longitude: number | null | undefined;
        location_display_name: string | null | undefined;
        location_confidence: ItineraryData["days"][number]["activities"][number]["location_confidence"];
      }>();

      for (const day of reordered.days) {
        for (const activity of day.activities) {
          coordLookup.set(
            `${activity.title}::${activity.location_name}`.toLowerCase(),
            {
              latitude: activity.latitude,
              longitude: activity.longitude,
              location_display_name: activity.location_display_name,
              location_confidence: activity.location_confidence,
            },
          );
        }
      }

      const merged: ItineraryData = {
        ...repaired,
        days: repaired.days.map((day) => ({
          ...day,
          activities: day.activities.map((activity) => {
            const prior = coordLookup.get(
              `${activity.title}::${activity.location_name}`.toLowerCase(),
            );
            if (!prior) {
              return {
                ...activity,
                latitude: null,
                longitude: null,
                location_display_name: null,
                location_confidence: "unavailable" as const,
              };
            }
            return {
              ...activity,
              latitude: prior.latitude ?? null,
              longitude: prior.longitude ?? null,
              location_display_name: prior.location_display_name ?? null,
              location_confidence: prior.location_confidence ?? "unavailable",
            };
          }),
        })),
      };

      return reorderItineraryForRoutes(merged);
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return reordered;
  }
}

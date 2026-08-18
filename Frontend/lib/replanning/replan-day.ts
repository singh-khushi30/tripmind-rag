import "server-only";

import {
  applyBudgetToItinerary,
  calculateTripBudget,
} from "@/lib/budget/calculate-trip-budget";
import { fetchExchangeRate } from "@/lib/currency/exchange-rate";
import { resolveLocalCurrency } from "@/lib/currency/local-currency";
import { formatCurrency } from "@/lib/format";
import { getGeminiClient } from "@/lib/gemini/client";
import { GEMINI_TIMEOUT_MS } from "@/lib/gemini/env";
import { withGeminiModelFallback } from "@/lib/gemini/model-fallback";
import {
  getItineraryJsonSchema,
  itineraryDaySchema,
  type ItineraryData,
  type ItineraryDay,
} from "@/lib/gemini/schema";
import type { TripPlannerInput } from "@/lib/gemini/types";
import { geocodeActivityLocation } from "@/lib/maps/geocode";
import { assertValidCitationIds } from "@/lib/rag/citations";
import { retrieveTravelContext } from "@/lib/rag/retrieve";
import type { Currency } from "@/types/trip";

export { mergeReplannedDay, restoreDayFromRevision } from "@/lib/replanning/day-revision";

export type ReplanReasonCode =
  | "raining"
  | "running_late"
  | "tired"
  | "spend_less"
  | "less_busy"
  | "more_food"
  | "more_culture"
  | "more_indoor"
  | "custom";

export type ReplanDayInput = {
  itinerary: ItineraryData;
  planner: TripPlannerInput;
  dayNumber: number;
  reasonCode: ReplanReasonCode;
  reasonText: string;
  hoursLate?: number | null;
  targetDayBudget?: number | null;
  allowedCitationKeys: string[];
};

export type ReplanDayResult =
  | {
      ok: true;
      itinerary: ItineraryData;
      previousDay: ItineraryDay;
      updatedDay: ItineraryDay;
    }
  | {
      ok: false;
      error: string;
      itinerary: ItineraryData;
    };

function reasonPrompt(input: ReplanDayInput): string {
  const parts = [`Reason code: ${input.reasonCode}`, `Details: ${input.reasonText}`];
  if (input.reasonCode === "running_late" && input.hoursLate != null) {
    parts.push(`Running approximately ${input.hoursLate} hours late.`);
  }
  if (input.reasonCode === "spend_less" && input.targetDayBudget != null) {
    parts.push(`Target day budget (display currency): ${input.targetDayBudget}`);
  }
  return parts.join("\n");
}

async function geocodeDayActivities(
  day: ItineraryDay,
  destination: string,
): Promise<ItineraryDay> {
  const activities = [];
  for (const activity of day.activities) {
    if (
      activity.latitude != null &&
      activity.longitude != null &&
      activity.location_confidence !== "unavailable"
    ) {
      activities.push(activity);
      continue;
    }
    try {
      const result = await geocodeActivityLocation({
        locationName: activity.location_name,
        neighborhood: activity.neighborhood,
        destination,
      });
      if (!result) {
        activities.push({
          ...activity,
          latitude: null,
          longitude: null,
          location_confidence: "unavailable" as const,
        });
        continue;
      }
      activities.push({
        ...activity,
        latitude: result.latitude,
        longitude: result.longitude,
        location_display_name: result.display_name,
        location_confidence: result.confidence,
      });
    } catch {
      activities.push(activity);
    }
  }
  return { ...day, activities };
}

/**
 * Constrained single-day replan. Other days remain byte-identical.
 */
export async function replanDay(
  input: ReplanDayInput,
): Promise<ReplanDayResult> {
  const original = input.itinerary;
  const dayIndex = original.days.findIndex(
    (day) => day.day_number === input.dayNumber,
  );
  if (dayIndex < 0) {
    return {
      ok: false,
      error: "That day could not be found on this itinerary.",
      itinerary: original,
    };
  }

  const previousDay = original.days[dayIndex]!;

  try {
    const retrieval = await retrieveTravelContext(input.planner);
    const allowed = new Set([
      ...input.allowedCitationKeys,
      ...retrieval.citationKeys,
    ]);

    const ai = getGeminiClient();
    const prompt = [
      "Repair ONLY one day of this TripMind itinerary.",
      "Rules:",
      "- Modify only the selected day. Preserve all other days exactly.",
      "- Prefer existing cited attractions where possible.",
      "- Only use attractions supported by retrieved RAG context.",
      "- Never fabricate citation_ids. Use only provided Chunk ID UUIDs.",
      "- Preserve reservations when possible.",
      "- Respect geography, pace, food preferences, weather, and remaining budget.",
      "- Estimate activity costs in DESTINATION LOCAL CURRENCY.",
      "- Treat prices as estimates.",
      "",
      reasonPrompt(input),
      "",
      `Selected day_number: ${input.dayNumber}`,
      "",
      "Current selected day JSON:",
      JSON.stringify(previousDay),
      "",
      "Full itinerary JSON (other days must stay unchanged):",
      JSON.stringify(original),
      "",
      retrieval.contextBlock
        ? `Grounded source context:\n${retrieval.contextBlock}`
        : "No additional grounded context.",
      "",
      "Return the FULL itinerary JSON schema with only the selected day changed.",
    ].join("\n");

    const text = await withGeminiModelFallback({
      maxAttemptsPerModel: 2,
      retryDelayMs: 800,
      run: async (model) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction:
                "You perform constrained one-day itinerary repairs for TripMind. Never invent uncited places or citation IDs.",
              responseMimeType: "application/json",
              responseJsonSchema: getItineraryJsonSchema(),
              abortSignal: controller.signal,
              temperature: 0.35,
            },
          });
          const value = response.text?.trim();
          if (!value) {
            throw new Error("EMPTY_RESPONSE");
          }
          return value;
        } finally {
          clearTimeout(timeout);
        }
      },
    });

    if (!text) {
      return {
        ok: false,
        error: "We couldn’t re-plan this day right now. Your itinerary is unchanged.",
        itinerary: original,
      };
    }

    const parsed = JSON.parse(text) as ItineraryData;
    if (!parsed?.days || parsed.days.length !== original.days.length) {
      return {
        ok: false,
        error: "Re-plan returned an invalid itinerary shape. Original kept.",
        itinerary: original,
      };
    }

    // Force non-selected days to remain identical.
    const mergedDays = original.days.map((day, index) => {
      if (day.day_number !== input.dayNumber) return day;
      const candidate = parsed.days[index] ?? parsed.days.find(
        (entry) => entry.day_number === input.dayNumber,
      );
      if (!candidate) return day;
      const dayParsed = itineraryDaySchema.safeParse(candidate);
      return dayParsed.success ? dayParsed.data : day;
    });

    let nextItinerary: ItineraryData = {
      ...original,
      days: mergedDays,
    };

    nextItinerary = assertValidCitationIds(nextItinerary, [...allowed]);

    const updatedDayRaw = nextItinerary.days.find(
      (day) => day.day_number === input.dayNumber,
    );
    if (!updatedDayRaw) {
      return {
        ok: false,
        error: "Re-plan did not return the selected day. Original kept.",
        itinerary: original,
      };
    }

    const geocodedDay = await geocodeDayActivities(
      updatedDayRaw,
      original.destination,
    );

    nextItinerary = {
      ...nextItinerary,
      days: nextItinerary.days.map((day) =>
        day.day_number === input.dayNumber ? geocodedDay : day,
      ),
    };

    const localCurrency =
      resolveLocalCurrency(nextItinerary.destination, nextItinerary.country) ??
      nextItinerary.destination_local_currency ??
      null;
    const exchange = localCurrency
      ? await fetchExchangeRate({
          sourceCurrency: localCurrency,
          targetCurrency: input.planner.currency,
        })
      : {
          rate: 1,
          status: "not_required" as const,
        };

    const breakdown = calculateTripBudget({
      itinerary: nextItinerary,
      planner: input.planner,
      localCurrency,
      exchangeRate: exchange.rate,
      exchangeStatus: exchange.status,
      formatMoney: (amount, currency) =>
        formatCurrency(amount, currency as Currency),
    });
    nextItinerary = applyBudgetToItinerary(nextItinerary, breakdown);

    const updatedDay = nextItinerary.days.find(
      (day) => day.day_number === input.dayNumber,
    )!;

    return {
      ok: true,
      itinerary: nextItinerary,
      previousDay,
      updatedDay,
    };
  } catch {
    return {
      ok: false,
      error: "We couldn’t re-plan this day right now. Your itinerary is unchanged.",
      itinerary: original,
    };
  }
}

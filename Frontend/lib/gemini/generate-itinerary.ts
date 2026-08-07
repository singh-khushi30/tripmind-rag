import "server-only";

import { getGeminiClient } from "@/lib/gemini/client";
import {
  classifyGeminiSdkError,
  TripGenerationError,
} from "@/lib/gemini/errors";
import {
  GEMINI_MODEL,
  GEMINI_TIMEOUT_MS,
  isMockItineraryEnabled,
} from "@/lib/gemini/env";
import { buildMockItineraryData } from "@/lib/gemini/mock-itinerary";
import {
  buildItineraryUserPrompt,
  ITINERARY_SYSTEM_INSTRUCTION,
} from "@/lib/gemini/prompts";
import { getItineraryJsonSchema, type ItineraryData } from "@/lib/gemini/schema";
import type { TripPlannerInput } from "@/lib/gemini/types";
import { parseAndValidateItinerary } from "@/lib/gemini/validate-itinerary";

export async function generateTripItinerary(
  input: TripPlannerInput,
): Promise<ItineraryData> {
  if (isMockItineraryEnabled()) {
    return buildMockItineraryData(input);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildItineraryUserPrompt(input),
      config: {
        systemInstruction: ITINERARY_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseJsonSchema: getItineraryJsonSchema(),
        abortSignal: controller.signal,
        httpOptions: {
          timeout: GEMINI_TIMEOUT_MS,
        },
        temperature: 0.7,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new TripGenerationError(
        "EMPTY_RESPONSE",
        "Gemini returned an empty response",
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (error) {
      throw new TripGenerationError(
        "INVALID_RESPONSE",
        "Gemini response was not valid JSON",
        error,
      );
    }

    return parseAndValidateItinerary(json, input);
  } catch (error) {
    if (error instanceof TripGenerationError) {
      throw error;
    }
    throw classifyGeminiSdkError(error);
  } finally {
    clearTimeout(timeout);
  }
}

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
import { assertValidCitationIds } from "@/lib/rag/citations";
import { ingestDestination } from "@/lib/rag/ingest-destination";
import {
  retrieveTravelContext,
  type TravelRetrievalResult,
} from "@/lib/rag/retrieve";

export type GenerateTripResult = {
  itinerary: ItineraryData;
  retrieval: TravelRetrievalResult | null;
};

export async function generateTripItinerary(
  input: TripPlannerInput,
): Promise<GenerateTripResult> {
  if (isMockItineraryEnabled()) {
    return {
      itinerary: buildMockItineraryData(input),
      retrieval: null,
    };
  }

  await ingestDestination(input.destination);
  const retrieval = await retrieveTravelContext(input);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildItineraryUserPrompt(input, retrieval.contextBlock),
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

    const validated = parseAndValidateItinerary(json, input, {
      allowedCitationKeys: retrieval.citationKeys,
      requireCitations: true,
    });

    const withCitations = assertValidCitationIds(
      validated,
      retrieval.citationKeys,
    );

    return {
      itinerary: {
        ...withCitations,
        grounding: {
          destination_key: retrieval.destination_key,
          source_count: retrieval.chunks.length,
          citation_keys: retrieval.citationKeys,
        },
      },
      retrieval,
    };
  } catch (error) {
    if (error instanceof TripGenerationError) {
      throw error;
    }
    throw classifyGeminiSdkError(error);
  } finally {
    clearTimeout(timeout);
  }
}

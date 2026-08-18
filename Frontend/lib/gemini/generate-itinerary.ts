import "server-only";

import { getGeminiClient } from "@/lib/gemini/client";
import {
  classifyGeminiSdkError,
  TripGenerationError,
} from "@/lib/gemini/errors";
import {
  GEMINI_TIMEOUT_MS,
  isMockItineraryEnabled,
} from "@/lib/gemini/env";
import { buildMockItineraryData } from "@/lib/gemini/mock-itinerary";
import { withGeminiModelFallback } from "@/lib/gemini/model-fallback";
import {
  buildItineraryUserPrompt,
  ITINERARY_SYSTEM_INSTRUCTION,
} from "@/lib/gemini/prompts";
import { getItineraryJsonSchema, type ItineraryData } from "@/lib/gemini/schema";
import type { TripPlannerInput } from "@/lib/gemini/types";
import { parseAndValidateItinerary } from "@/lib/gemini/validate-itinerary";
import { assertValidCitationIds } from "@/lib/rag/citations";
import { ingestDestination } from "@/lib/rag/ingest-destination";
import { ragLog } from "@/lib/rag/log";
import {
  retrieveTravelContext,
  type TravelRetrievalResult,
} from "@/lib/rag/retrieve";

export type GenerateTripResult = {
  itinerary: ItineraryData;
  retrieval: TravelRetrievalResult | null;
};

function toTripPipelineError(error: unknown): TripGenerationError {
  if (error instanceof TripGenerationError) {
    return error;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : String(error);

  if (message === "MISSING_GEMINI_API_KEY") {
    return new TripGenerationError(
      "MISSING_API_KEY",
      "Gemini API key is not configured",
      error,
    );
  }

  if (
    message.toLowerCase().includes("websocket") ||
    message.toLowerCase().includes("supabase_service_role_key")
  ) {
    return new TripGenerationError("UNKNOWN", message, error);
  }

  return classifyGeminiSdkError(error);
}

export async function generateTripItinerary(
  input: TripPlannerInput,
): Promise<GenerateTripResult> {
  if (isMockItineraryEnabled()) {
    return {
      itinerary: buildMockItineraryData(input),
      retrieval: null,
    };
  }

  try {
    await ingestDestination(input.destination);
    const retrieval = await retrieveTravelContext(input);
    const ai = getGeminiClient();
    const prompt = buildItineraryUserPrompt(input, retrieval.contextBlock);

    const { text, model } = await withGeminiModelFallback({
      maxAttemptsPerModel: 2,
      retryDelayMs: 1000,
      onAttemptError: ({ model: failedModel, attempt, error }) => {
        ragLog("gemini.generate.retry", {
          model: failedModel,
          attempt,
          code: error.code,
          message: error.message.slice(0, 120),
        });
      },
      run: async (model) => {
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          GEMINI_TIMEOUT_MS,
        );
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
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
          return { text, model };
        } finally {
          clearTimeout(timeout);
        }
      },
    });

    ragLog("gemini.generate.success", { model });

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
          source_count: retrieval.uniqueSourceCount,
          citation_keys: retrieval.citationKeys,
        },
      },
      retrieval,
    };
  } catch (error) {
    throw toTripPipelineError(error);
  }
}

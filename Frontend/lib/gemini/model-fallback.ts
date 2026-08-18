import "server-only";

import { GEMINI_MODEL } from "@/lib/gemini/env";
import {
  classifyGeminiSdkError,
  TripGenerationError,
  type GeminiErrorCode,
} from "@/lib/gemini/errors";

const DEFAULT_FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
];

const RETRYABLE_CODES = new Set<GeminiErrorCode>([
  "MODEL_UNAVAILABLE",
  "RATE_LIMIT",
  "TIMEOUT",
]);

export function getGeminiModelCandidates(primary = GEMINI_MODEL): string[] {
  const fromEnv = (process.env.GEMINI_MODEL_FALLBACKS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const ordered = [primary, ...fromEnv, ...DEFAULT_FALLBACK_MODELS];
  return [...new Set(ordered.filter(Boolean))];
}

export function isRetryableGeminiError(error: unknown): boolean {
  const classified =
    error instanceof TripGenerationError
      ? error
      : classifyGeminiSdkError(error);
  return RETRYABLE_CODES.has(classified.code);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run an async Gemini call across model candidates with short retries on
 * transient overload / rate-limit / timeout responses.
 */
export async function withGeminiModelFallback<T>(input: {
  run: (model: string, attempt: number) => Promise<T>;
  maxAttemptsPerModel?: number;
  retryDelayMs?: number;
  onAttemptError?: (info: {
    model: string;
    attempt: number;
    error: TripGenerationError;
  }) => void;
}): Promise<T> {
  const models = getGeminiModelCandidates();
  const maxAttemptsPerModel = input.maxAttemptsPerModel ?? 2;
  const retryDelayMs = input.retryDelayMs ?? 900;
  let lastError: TripGenerationError | null = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
      try {
        return await input.run(model, attempt);
      } catch (error) {
        const classified =
          error instanceof TripGenerationError
            ? error
            : classifyGeminiSdkError(error);
        lastError = classified;
        input.onAttemptError?.({ model, attempt, error: classified });

        // Validation / auth / empty JSON should not rotate models endlessly.
        if (!isRetryableGeminiError(classified)) {
          throw classified;
        }

        const shouldRetrySameModel = attempt < maxAttemptsPerModel;
        if (shouldRetrySameModel) {
          await sleep(retryDelayMs * attempt);
          continue;
        }
        // Move to next model after exhausting attempts.
        await sleep(retryDelayMs);
      }
    }
  }

  throw (
    lastError ??
    new TripGenerationError(
      "MODEL_UNAVAILABLE",
      "Gemini model unavailable after fallbacks",
    )
  );
}

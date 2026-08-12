export type GeminiErrorCode =
  | "MISSING_API_KEY"
  | "INVALID_API_KEY"
  | "MODEL_UNAVAILABLE"
  | "UNAUTHENTICATED"
  | "INVALID_INPUT"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "EMPTY_RESPONSE"
  | "INVALID_RESPONSE"
  | "DAY_COUNT_MISMATCH"
  | "DESTINATION_MISMATCH"
  | "SAVE_FAILED"
  | "UNKNOWN";

export class TripGenerationError extends Error {
  readonly code: GeminiErrorCode;
  readonly cause?: unknown;

  constructor(code: GeminiErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "TripGenerationError";
    this.code = code;
    this.cause = cause;
  }
}

const USER_MESSAGES: Record<GeminiErrorCode, string> = {
  MISSING_API_KEY:
    "TripMind can’t reach the AI service. Add a valid GEMINI_API_KEY from Google AI Studio, then restart the server.",
  INVALID_API_KEY:
    "TripMind can’t authenticate with Gemini. Replace GEMINI_API_KEY with a Gemini API key from Google AI Studio (aistudio.google.com/apikey), then restart the server.",
  MODEL_UNAVAILABLE:
    "The AI model is temporarily unavailable. Please try again in a moment.",
  UNAUTHENTICATED: "You must be signed in to generate a trip.",
  INVALID_INPUT:
    "Your trip preferences could not be processed. Review the form and try again.",
  RATE_LIMIT:
    "The AI service is temporarily busy. Please wait a moment and retry.",
  TIMEOUT:
    "We couldn’t generate your itinerary right now. Please try again.",
  EMPTY_RESPONSE:
    "We couldn’t generate your itinerary right now. Please try again.",
  INVALID_RESPONSE:
    "We couldn’t generate your itinerary right now. Please try again.",
  DAY_COUNT_MISMATCH:
    "We couldn’t generate your itinerary right now. Please try again.",
  DESTINATION_MISMATCH:
    "We couldn’t generate your itinerary right now. Please try again.",
  SAVE_FAILED:
    "Your itinerary was generated, but we couldn’t save it. Please try again.",
  UNKNOWN: "We couldn’t generate your itinerary right now. Please try again.",
};

const GROUNDING_MESSAGE =
  "We couldn’t find enough reliable destination information to create a grounded itinerary. Try a more specific city or region.";

export function toUserFacingTripError(error: unknown): string {
  if (
    error instanceof Error &&
    error.message === "INSUFFICIENT_GROUNDING_CONTEXT"
  ) {
    return GROUNDING_MESSAGE;
  }

  if (error instanceof TripGenerationError) {
    if (error.message === "INSUFFICIENT_GROUNDING_CONTEXT") {
      return GROUNDING_MESSAGE;
    }
    if (
      error.message.toLowerCase().includes("websocket") ||
      error.message.toLowerCase().includes("supabase_service_role_key")
    ) {
      return "TripMind couldn’t reach the travel knowledge service. Check SUPABASE_SERVICE_ROLE_KEY and restart the server, then try again.";
    }
    return USER_MESSAGES[error.code];
  }

  if (error instanceof Error && error.message === "MISSING_GEMINI_API_KEY") {
    return USER_MESSAGES.MISSING_API_KEY;
  }

  if (
    error instanceof Error &&
    error.message.toLowerCase().includes("websocket")
  ) {
    return "TripMind couldn’t reach the travel knowledge service. Restart the server after installing dependencies, or upgrade to Node 22+.";
  }

  return USER_MESSAGES.UNKNOWN;
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("status" in error && typeof error.status === "number") {
    return error.status;
  }
  return undefined;
}

export function classifyGeminiSdkError(error: unknown): TripGenerationError {
  if (error instanceof TripGenerationError) {
    return error;
  }

  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  const name = error instanceof Error ? error.name.toLowerCase() : "";
  const status = getErrorStatus(error);

  if (
    name.includes("abort") ||
    message.includes("abort") ||
    message.includes("timeout") ||
    message.includes("timed out")
  ) {
    return new TripGenerationError("TIMEOUT", "Gemini request timed out", error);
  }

  if (
    status === 401 ||
    status === 403 ||
    message.includes('"code":401') ||
    message.includes('"code":403') ||
    message.includes("unauthenticated") ||
    message.includes("access_token_type_unsupported") ||
    message.includes("invalid authentication") ||
    message.includes("api key not valid") ||
    message.includes("api_key_invalid") ||
    message.includes("permission_denied")
  ) {
    return new TripGenerationError(
      "INVALID_API_KEY",
      "Gemini rejected the API key",
      error,
    );
  }

  if (
    status === 429 ||
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("resource_exhausted") ||
    message.includes("quota")
  ) {
    return new TripGenerationError(
      "RATE_LIMIT",
      "Gemini rate limit exceeded",
      error,
    );
  }

  if (
    status === 404 ||
    status === 503 ||
    message.includes('"code":404') ||
    message.includes('"code":503') ||
    message.includes("no longer available") ||
    message.includes("not_found") ||
    message.includes("high demand") ||
    message.includes("currently experiencing")
  ) {
    return new TripGenerationError(
      "MODEL_UNAVAILABLE",
      "Gemini model unavailable",
      error,
    );
  }

  if (message === "missing_gemini_api_key") {
    return new TripGenerationError(
      "MISSING_API_KEY",
      "Gemini API key is not configured",
      error,
    );
  }

  return new TripGenerationError(
    "UNKNOWN",
    "Unexpected Gemini error",
    error,
  );
}

function summarizeCause(cause: unknown): string | undefined {
  if (!cause) return undefined;
  if (cause instanceof Error) return cause.message.slice(0, 180);
  if (typeof cause === "object") {
    try {
      const text = JSON.stringify(cause);
      return text.slice(0, 180);
    } catch {
      return undefined;
    }
  }
  return String(cause).slice(0, 180);
}

/** Safe server log helper — never logs secrets or full API payloads. */
export function logTripGenerationFailure(error: unknown) {
  if (error instanceof TripGenerationError) {
    console.error("[tripmind:gemini]", {
      code: error.code,
      message: error.message,
      status: getErrorStatus(error.cause),
      cause: summarizeCause(error.cause),
    });
    return;
  }

  const status = getErrorStatus(error);
  const name = error instanceof Error ? error.name : "Error";
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : String(error);

  console.error("[tripmind:gemini]", {
    code: "UNKNOWN",
    name,
    message: message.slice(0, 240),
    status,
    cause: summarizeCause(error),
  });
}

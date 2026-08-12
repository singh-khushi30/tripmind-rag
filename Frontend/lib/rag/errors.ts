import { TripGenerationError } from "@/lib/gemini/errors";

export class RagError extends TripGenerationError {
  constructor(
    code:
      | "INVALID_INPUT"
      | "INVALID_RESPONSE"
      | "UNKNOWN"
      | "EMPTY_RESPONSE",
    message: string,
    cause?: unknown,
  ) {
    super(code, message, cause);
    this.name = "RagError";
  }
}

export function groundingFailureError(cause?: unknown) {
  return new RagError(
    "EMPTY_RESPONSE",
    "INSUFFICIENT_GROUNDING_CONTEXT",
    cause,
  );
}

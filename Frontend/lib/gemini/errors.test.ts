import { describe, expect, it } from "vitest";

import {
  classifyGeminiSdkError,
  toUserFacingTripError,
  TripGenerationError,
} from "@/lib/gemini/errors";

describe("toUserFacingTripError", () => {
  it("never exposes raw Gemini details", () => {
    const error = new TripGenerationError(
      "INVALID_RESPONSE",
      "schema path days.0.activities failed with secret details",
    );

    const message = toUserFacingTripError(error);
    expect(message).not.toContain("schema");
    expect(message).not.toContain("secret");
    expect(message).toContain("couldn’t generate");
  });

  it("maps rate limits to a busy service message", () => {
    const error = new TripGenerationError("RATE_LIMIT", "429");
    expect(toUserFacingTripError(error)).toContain("temporarily busy");
  });
});

describe("classifyGeminiSdkError", () => {
  it("classifies timeout and abort errors", () => {
    const error = classifyGeminiSdkError(new Error("The operation was aborted"));
    expect(error.code).toBe("TIMEOUT");
  });

  it("classifies rate limit errors", () => {
    const error = classifyGeminiSdkError(new Error("429 RESOURCE_EXHAUSTED"));
    expect(error.code).toBe("RATE_LIMIT");
  });

  it("classifies invalid Gemini API credentials", () => {
    const error = classifyGeminiSdkError(
      Object.assign(new Error('{"error":{"code":401,"status":"UNAUTHENTICATED"}}'), {
        status: 401,
      }),
    );
    expect(error.code).toBe("INVALID_API_KEY");
    expect(toUserFacingTripError(error)).toContain("Google AI Studio");
  });

  it("classifies unavailable model errors", () => {
    const error = classifyGeminiSdkError(
      Object.assign(
        new Error(
          '{"error":{"code":404,"message":"This model models/gemini-2.5-flash is no longer available to new users."}}',
        ),
        { status: 404 },
      ),
    );
    expect(error.code).toBe("MODEL_UNAVAILABLE");
  });
});

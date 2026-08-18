import { describe, expect, it, vi } from "vitest";

import { TripGenerationError } from "@/lib/gemini/errors";
import {
  getGeminiModelCandidates,
  isRetryableGeminiError,
  withGeminiModelFallback,
} from "@/lib/gemini/model-fallback";

describe("gemini model fallback", () => {
  it("dedupes primary + fallback candidates", () => {
    const models = getGeminiModelCandidates("gemini-3.6-flash");
    expect(models[0]).toBe("gemini-3.6-flash");
    expect(new Set(models).size).toBe(models.length);
    expect(models.length).toBeGreaterThan(1);
  });

  it("retries transient model failures then succeeds on fallback", async () => {
    const run = vi
      .fn()
      .mockRejectedValueOnce(
        new TripGenerationError("MODEL_UNAVAILABLE", "busy"),
      )
      .mockRejectedValueOnce(
        new TripGenerationError("MODEL_UNAVAILABLE", "busy again"),
      )
      .mockResolvedValueOnce("ok");

    const result = await withGeminiModelFallback({
      maxAttemptsPerModel: 2,
      retryDelayMs: 1,
      run,
    });

    expect(result).toBe("ok");
    expect(run).toHaveBeenCalled();
  });

  it("does not rotate models for validation errors", async () => {
    const run = vi
      .fn()
      .mockRejectedValue(
        new TripGenerationError("INVALID_RESPONSE", "bad schema"),
      );

    await expect(
      withGeminiModelFallback({
        maxAttemptsPerModel: 2,
        retryDelayMs: 1,
        run,
      }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });

    expect(run).toHaveBeenCalledTimes(1);
  });

  it("marks overload as retryable", () => {
    expect(
      isRetryableGeminiError(
        new TripGenerationError("MODEL_UNAVAILABLE", "503"),
      ),
    ).toBe(true);
    expect(
      isRetryableGeminiError(
        new TripGenerationError("INVALID_RESPONSE", "schema"),
      ),
    ).toBe(false);
  });
});

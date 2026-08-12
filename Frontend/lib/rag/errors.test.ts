import { describe, expect, it } from "vitest";

import { toUserFacingTripError } from "@/lib/gemini/errors";
import { groundingFailureError } from "@/lib/rag/errors";

describe("grounding failure behavior", () => {
  it("surfaces a clear no-context failure message", () => {
    const error = groundingFailureError({ reason: "empty_context" });
    expect(toUserFacingTripError(error)).toContain(
      "enough reliable destination information",
    );
  });

  it("treats partial source failure as grounding failure when chunks are insufficient", () => {
    const error = groundingFailureError({
      failures: { wikipedia: "timeout" },
      chunks: 1,
    });
    expect(error.message).toBe("INSUFFICIENT_GROUNDING_CONTEXT");
  });
});

import { describe, expect, it } from "vitest";

import {
  assertEmbeddingDimension,
  GEMINI_EMBEDDING_DIMENSIONS,
} from "@/lib/rag/embedding-utils";

describe("assertEmbeddingDimension", () => {
  it("accepts vectors with the configured dimension", () => {
    const values = Array.from({ length: GEMINI_EMBEDDING_DIMENSIONS }, () => 0.1);
    expect(assertEmbeddingDimension(values)).toHaveLength(
      GEMINI_EMBEDDING_DIMENSIONS,
    );
  });

  it("rejects incorrect dimensions", () => {
    expect(() => assertEmbeddingDimension([1, 2, 3])).toThrow(
      /Invalid embedding dimension/,
    );
  });

  it("rejects non-finite values", () => {
    const values = Array.from({ length: GEMINI_EMBEDDING_DIMENSIONS }, () => 0.1);
    values[0] = Number.NaN;
    expect(() => assertEmbeddingDimension(values)).toThrow(/non-finite|non-number/);
  });

  it("rejects non-array embeddings", () => {
    expect(() => assertEmbeddingDimension("not-an-array")).toThrow(
      /non-array/,
    );
  });
});

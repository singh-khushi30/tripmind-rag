import { GEMINI_EMBEDDING_DIMENSIONS } from "@/lib/rag/constants-shared";

export { GEMINI_EMBEDDING_DIMENSIONS };

export function l2Normalize(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (!Number.isFinite(norm) || norm === 0) {
    throw new Error("Invalid embedding vector norm");
  }
  return values.map((value) => value / norm);
}

export function assertEmbeddingDimension(
  values: unknown,
  expected = GEMINI_EMBEDDING_DIMENSIONS,
): number[] {
  if (!Array.isArray(values)) {
    throw new Error(
      `Invalid embedding dimension: expected ${expected} numbers, received non-array`,
    );
  }

  if (values.length !== expected) {
    throw new Error(
      `Invalid embedding dimension: expected ${expected}, received ${values.length}`,
    );
  }

  if (
    !values.every(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    )
  ) {
    throw new Error("Embedding contains non-finite or non-number values");
  }

  return values;
}

export function assertAllEmbeddingsDimension(
  vectors: number[][],
  expected = GEMINI_EMBEDDING_DIMENSIONS,
): number[][] {
  if (!Array.isArray(vectors) || vectors.length === 0) {
    throw new Error("No embeddings generated");
  }

  for (const vector of vectors) {
    assertEmbeddingDimension(vector, expected);
  }

  return vectors;
}

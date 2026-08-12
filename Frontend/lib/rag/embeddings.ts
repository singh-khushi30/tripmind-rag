import "server-only";

import { TripGenerationError } from "@/lib/gemini/errors";
import { getGeminiClient } from "@/lib/gemini/client";
import {
  EMBEDDING_BATCH_DELAY_MS,
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_TIMEOUT_MS,
  GEMINI_EMBEDDING_DIMENSIONS,
  GEMINI_EMBEDDING_MODEL,
} from "@/lib/rag/constants";
import {
  assertAllEmbeddingsDimension,
  assertEmbeddingDimension,
  l2Normalize,
} from "@/lib/rag/embedding-utils";
import { ragLog } from "@/lib/rag/log";

export { assertEmbeddingDimension } from "@/lib/rag/embedding-utils";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isQuotaError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("resource_exhausted") ||
    message.includes("quota") ||
    message.includes("rate limit")
  );
}

async function embedTextsOnce(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const ai = getGeminiClient();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMBEDDING_TIMEOUT_MS);

  try {
    const response = await ai.models.embedContent({
      model: GEMINI_EMBEDDING_MODEL,
      contents: texts,
      config: {
        taskType,
        outputDimensionality: GEMINI_EMBEDDING_DIMENSIONS,
        abortSignal: controller.signal,
        httpOptions: {
          timeout: EMBEDDING_TIMEOUT_MS,
        },
      },
    });

    const embeddings = response.embeddings ?? [];
    if (embeddings.length !== texts.length) {
      throw new Error("Embedding response count mismatch");
    }

    const vectors = embeddings.map((item) => {
      const values = item.values ?? [];
      return assertEmbeddingDimension(l2Normalize(values));
    });

    return assertAllEmbeddingsDimension(vectors);
  } finally {
    clearTimeout(timeout);
  }
}

async function embedTexts(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
): Promise<number[][]> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await embedTextsOnce(texts, taskType);
    } catch (error) {
      lastError = error;
      if (!isQuotaError(error) || attempt === 2) break;
      await sleep(800 * (attempt + 1));
    }
  }

  if (isQuotaError(lastError)) {
    throw new TripGenerationError(
      "RATE_LIMIT",
      "Gemini embedding quota exceeded",
      lastError,
    );
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Embedding request failed");
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const vectors: number[][] = [];

  for (let index = 0; index < texts.length; index += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(index, index + EMBEDDING_BATCH_SIZE);
    const embedded = await embedTexts(batch, "RETRIEVAL_DOCUMENT");
    vectors.push(...embedded);

    if (index + EMBEDDING_BATCH_SIZE < texts.length) {
      await sleep(EMBEDDING_BATCH_DELAY_MS);
    }
  }

  const validated = assertAllEmbeddingsDimension(vectors);
  ragLog("embeddings.documents", {
    count: validated.length,
    dimensions: GEMINI_EMBEDDING_DIMENSIONS,
    model: GEMINI_EMBEDDING_MODEL,
    task_type: "RETRIEVAL_DOCUMENT",
  });
  return validated;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text], "RETRIEVAL_QUERY");
  if (!vector) {
    throw new Error("Query embedding failed");
  }
  const validated = assertEmbeddingDimension(vector);
  ragLog("embeddings.query", {
    count: 1,
    dimensions: validated.length,
    model: GEMINI_EMBEDDING_MODEL,
    task_type: "RETRIEVAL_QUERY",
  });
  return validated;
}

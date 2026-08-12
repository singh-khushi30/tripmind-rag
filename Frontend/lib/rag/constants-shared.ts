/** Shared RAG constants safe for unit tests (no server-only). */

export const GEMINI_EMBEDDING_DIMENSIONS = 768;

export const RAG_FRESHNESS_DAYS = 7;
export const RAG_MIN_CHUNKS = 4;
export const RAG_MAX_CHUNKS_PER_DESTINATION = 36;
export const RAG_MATCH_COUNT = 12;
export const RAG_SIMILARITY_THRESHOLD = 0.45;
export const RAG_MAX_CONTEXT_CHARS = 12_000;
export const EMBEDDING_BATCH_SIZE = 8;
export const EMBEDDING_BATCH_DELAY_MS = 400;

export const WIKIMEDIA_USER_AGENT =
  "TripMind/0.1 (travel planning app; contact: tripmind-dev@example.com)";

export const WIKIMEDIA_TIMEOUT_MS = 12_000;
export const EMBEDDING_TIMEOUT_MS = 45_000;

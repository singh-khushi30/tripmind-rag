type RagLogPayload = Record<
  string,
  string | number | boolean | null | undefined | string[] | number[]
>;

const BLOCKED_KEYS = new Set([
  "api_key",
  "apikey",
  "authorization",
  "content",
  "prompt",
  "response",
  "special_notes",
  "service_role",
  "service_role_key",
  "supabase_service_role_key",
  "gemini_api_key",
]);

function isDevLoggingEnabled() {
  if (
    process.env.RAG_DEBUG === "1" ||
    process.env.RAG_DEBUG === "true" ||
    process.env.MAPS_DEBUG === "1" ||
    process.env.MAPS_DEBUG === "true"
  ) {
    return true;
  }
  return process.env.NODE_ENV !== "production";
}

function sanitizePayload(payload: RagLogPayload): RagLogPayload {
  const clean: RagLogPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (BLOCKED_KEYS.has(key.toLowerCase())) continue;
    if (typeof value === "string" && value.length > 240) {
      clean[key] = `${value.slice(0, 240)}…`;
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

/** Safe development logging for RAG pipelines. Never logs secrets or full content. */
export function ragLog(event: string, payload: RagLogPayload = {}) {
  if (!isDevLoggingEnabled()) return;
  console.info(`[rag] ${event}`, sanitizePayload(payload));
}

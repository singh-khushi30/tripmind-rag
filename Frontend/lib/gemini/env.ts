import "server-only";

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();

  if (!key) {
    throw new Error("MISSING_GEMINI_API_KEY");
  }

  return key;
}

export function isMockItineraryEnabled(): boolean {
  return process.env.USE_MOCK_ITINERARY?.trim().toLowerCase() === "true";
}

// gemini-2.5-flash is blocked for many new API keys; use the stable latest alias.
export const GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest";

export const GEMINI_TIMEOUT_MS = 60_000;

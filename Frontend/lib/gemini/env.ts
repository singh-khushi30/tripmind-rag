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

// Prefer an explicit current flash model via GEMINI_MODEL when aliases are busy/retired.
export const GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";

export const GEMINI_TIMEOUT_MS = 60_000;

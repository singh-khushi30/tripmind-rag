import { afterEach, describe, expect, it, vi } from "vitest";

describe("getGeminiApiKey", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("throws when the API key is missing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const { getGeminiApiKey } = await import("@/lib/gemini/env");

    expect(() => getGeminiApiKey()).toThrow("MISSING_GEMINI_API_KEY");
  });

  it("returns the trimmed API key when present", async () => {
    vi.stubEnv("GEMINI_API_KEY", " test-key ");
    const { getGeminiApiKey } = await import("@/lib/gemini/env");

    expect(getGeminiApiKey()).toBe("test-key");
  });
});

describe("isMockItineraryEnabled", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("is false unless explicitly set to true", async () => {
    vi.stubEnv("USE_MOCK_ITINERARY", "false");
    const { isMockItineraryEnabled } = await import("@/lib/gemini/env");
    expect(isMockItineraryEnabled()).toBe(false);
  });

  it("is true only when USE_MOCK_ITINERARY=true", async () => {
    vi.stubEnv("USE_MOCK_ITINERARY", "true");
    const { isMockItineraryEnabled } = await import("@/lib/gemini/env");
    expect(isMockItineraryEnabled()).toBe(true);
  });
});

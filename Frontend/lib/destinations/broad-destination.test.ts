import { describe, expect, it } from "vitest";

import {
  analyzeDestination,
  isKnownCityDestination,
  requiresDestinationClarification,
} from "@/lib/destinations/broad-destination";

describe("broad destination detection", () => {
  it("requires clarification for California", () => {
    const analysis = analyzeDestination("California");
    expect(analysis.isBroad).toBe(true);
    expect(requiresDestinationClarification("California", "city")).toBe(true);
    expect(analysis.suggestions.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "San Francisco",
        "Los Angeles",
        "San Diego",
        "Northern California",
        "Southern California",
        "Multi-city California",
      ]),
    );
  });

  it("accepts Paris as a city", () => {
    expect(analyzeDestination("Paris").isBroad).toBe(false);
    expect(analyzeDestination("Paris, France").isBroad).toBe(false);
    expect(isKnownCityDestination("Paris")).toBe(true);
    expect(requiresDestinationClarification("Paris", "city")).toBe(false);
  });

  it("preserves an exact selected city after clarification", () => {
    expect(requiresDestinationClarification("San Francisco", "city")).toBe(
      false,
    );
    expect(analyzeDestination("San Francisco").isBroad).toBe(false);
  });

  it("allows intentional region scope after clarification", () => {
    expect(
      requiresDestinationClarification("Northern California", "region"),
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import {
  buildGeocodeAttempts,
  isApproximateQuery,
  normalizeGeocodeQuery,
} from "@/lib/maps/normalize-query";

describe("geocode query helpers", () => {
  it("adds destination context to geocoding attempts", () => {
    const attempts = buildGeocodeAttempts({
      locationName: "Ferry Building Marketplace",
      neighborhood: "Embarcadero",
      destination: "San Francisco, California",
    });

    expect(attempts[0]).toBe(
      "Ferry Building Marketplace, San Francisco, California",
    );
    expect(attempts.some((q) => q.includes("San Francisco"))).toBe(true);
    expect(attempts).not.toContain("Ferry Building Marketplace");
  });

  it("normalizes cache keys consistently", () => {
    expect(normalizeGeocodeQuery("  Louvre Museum,  Paris ")).toBe(
      "louvre museum, paris",
    );
  });

  it("labels neighborhood-only queries as approximate", () => {
    expect(
      isApproximateQuery("Le Marais, Paris", "Le Marais"),
    ).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import { normalizeDestinationKey } from "@/lib/rag/destination";

describe("normalizeDestinationKey", () => {
  it("normalizes common destination forms", () => {
    expect(normalizeDestinationKey(" Paris ").destination_key).toBe("paris");
    expect(normalizeDestinationKey("New York City").destination_key).toBe(
      "new-york-city",
    );
    expect(
      normalizeDestinationKey("San Francisco, California").destination_key,
    ).toBe("san-francisco-california");
  });

  it("preserves display name separately from the key", () => {
    const result = normalizeDestinationKey("  Kyoto, Japan ");
    expect(result.display_name).toBe("Kyoto, Japan");
    expect(result.destination_name).toBe("Kyoto, Japan");
    expect(result.destination_key).toBe("kyoto-japan");
  });

  it("does not remap unrelated destinations onto each other", () => {
    const paris = normalizeDestinationKey("Paris");
    const london = normalizeDestinationKey("London");
    expect(paris.destination_key).not.toBe(london.destination_key);
  });
});

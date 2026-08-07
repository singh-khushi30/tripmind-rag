import { describe, expect, it } from "vitest";

import { isPlaceholderCoordinate } from "@/lib/geo/coordinates";

describe("isPlaceholderCoordinate", () => {
  it("treats 0,0 as unavailable", () => {
    expect(isPlaceholderCoordinate(0, 0)).toBe(true);
  });

  it("treats nullish values as unavailable", () => {
    expect(isPlaceholderCoordinate(null, null)).toBe(true);
    expect(isPlaceholderCoordinate(undefined, 12)).toBe(true);
  });

  it("accepts real coordinates", () => {
    expect(isPlaceholderCoordinate(48.8566, 2.3522)).toBe(false);
  });
});

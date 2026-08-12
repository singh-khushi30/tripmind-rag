import { describe, expect, it } from "vitest";

import {
  haversineKm,
  isPlaceholderCoordinate,
  isValidCoordinate,
} from "@/lib/geo/coordinates";

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

describe("isValidCoordinate", () => {
  it("rejects invalid ranges and null island", () => {
    expect(isValidCoordinate(0, 0)).toBe(false);
    expect(isValidCoordinate(91, 2)).toBe(false);
    expect(isValidCoordinate(48, 200)).toBe(false);
  });

  it("accepts Paris coordinates", () => {
    expect(isValidCoordinate(48.8566, 2.3522)).toBe(true);
  });
});

describe("haversineKm", () => {
  it("estimates Louvre to Notre-Dame under 2 km", () => {
    const km = haversineKm(48.8606, 2.3376, 48.853, 2.3499);
    expect(km).toBeGreaterThan(0.5);
    expect(km).toBeLessThan(2);
  });
});

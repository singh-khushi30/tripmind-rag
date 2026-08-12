import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/maps/constants", async () => {
  const actual = await vi.importActual<typeof import("@/lib/maps/constants-shared")>(
    "@/lib/maps/constants-shared",
  );
  return {
    ...actual,
    NOMINATIM_BASE_URL: "https://nominatim.openstreetmap.org",
    PHOTON_BASE_URL: "https://photon.komoot.io",
    OSRM_BASE_URL: "https://router.project-osrm.org",
    MAPS_USER_AGENT: "TripMind-test",
    GEOCODE_TIMEOUT_MS: 10_000,
    OSRM_TIMEOUT_MS: 12_000,
    NOMINATIM_MIN_INTERVAL_MS: 0,
  };
});

const cacheStore = new Map<
  string,
  {
    normalized_query: string;
    latitude: number;
    longitude: number;
    display_name: string | null;
    provider: string;
    confidence: string | null;
    fetched_at: string;
  }
>();

vi.mock("@/lib/maps/location-cache", () => ({
  getCachedGeocode: vi.fn(async (query: string) => cacheStore.get(query) ?? null),
  setCachedGeocode: vi.fn(async (row: {
    normalized_query: string;
    latitude: number;
    longitude: number;
    display_name?: string | null;
    provider?: string;
    confidence?: string | null;
  }) => {
    cacheStore.set(row.normalized_query, {
      normalized_query: row.normalized_query,
      latitude: row.latitude,
      longitude: row.longitude,
      display_name: row.display_name ?? null,
      provider: row.provider ?? "nominatim",
      confidence: row.confidence ?? null,
      fetched_at: new Date().toISOString(),
    });
  }),
}));

import { fetchNominatim, geocodeActivityLocation } from "@/lib/maps/geocode";
import { isValidCoordinate } from "@/lib/geo/coordinates";

describe("nominatim geocoding", () => {
  beforeEach(() => {
    cacheStore.clear();
    vi.clearAllMocks();
  });

  it("rejects 0,0 coordinates", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json([{ lat: "0", lon: "0", display_name: "Null Island" }]),
    );

    const result = await fetchNominatim("Null Island", fetchImpl as typeof fetch);
    expect(result).toBeNull();
  });

  it("reuses cache for repeated queries", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json([
        {
          lat: "48.8606",
          lon: "2.3376",
          display_name: "Louvre Museum, Paris",
          importance: 0.8,
        },
      ]),
    );

    const first = await fetchNominatim(
      "Louvre Museum, Paris",
      fetchImpl as typeof fetch,
    );
    const second = await fetchNominatim(
      "Louvre Museum, Paris",
      fetchImpl as typeof fetch,
    );

    expect(first?.from_cache).toBe(false);
    expect(second?.from_cache).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(isValidCoordinate(second!.latitude, second!.longitude)).toBe(true);
  });

  it("includes destination context and labels approximate neighborhood fallback", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      const query = new URL(url).searchParams.get("q") ?? "";
      if (query.toLowerCase().includes("ferry building marketplace")) {
        return Response.json([]);
      }
      return Response.json([
        {
          lat: "37.7955",
          lon: "-122.3937",
          display_name: "Embarcadero, San Francisco",
          importance: 0.4,
        },
      ]);
    });

    const result = await geocodeActivityLocation({
      locationName: "Ferry Building Marketplace",
      neighborhood: "Embarcadero",
      destination: "San Francisco, California",
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(result).not.toBeNull();
    expect(result?.confidence).toBe("approximate");
    const firstUrl = decodeURIComponent(
      String(fetchImpl.mock.calls[0]?.[0] ?? "").replace(/\+/g, " "),
    );
    expect(firstUrl).toContain("San Francisco");
    expect(firstUrl.toLowerCase()).toContain("ferry building marketplace");
  });
});


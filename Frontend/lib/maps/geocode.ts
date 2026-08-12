import "server-only";

import { isValidCoordinate } from "@/lib/geo/coordinates";
import {
  GEOCODE_TIMEOUT_MS,
  MAPS_USER_AGENT,
  NOMINATIM_BASE_URL,
  NOMINATIM_MIN_INTERVAL_MS,
  PHOTON_BASE_URL,
} from "@/lib/maps/constants";
import {
  getCachedGeocode,
  setCachedGeocode,
} from "@/lib/maps/location-cache";
import {
  buildGeocodeAttempts,
  isApproximateQuery,
  normalizeGeocodeQuery,
} from "@/lib/maps/normalize-query";

export type LocationConfidence = "exact" | "approximate" | "unavailable";
export type GeocodeProvider = "nominatim" | "photon";

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  display_name: string | null;
  confidence: LocationConfidence;
  provider: GeocodeProvider;
  query_used: string;
  from_cache: boolean;
};

type NominatimHit = {
  lat?: string;
  lon?: string;
  display_name?: string;
  importance?: number;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    city?: string;
    country?: string;
    street?: string;
  };
};

let lastNominatimAt = 0;

async function waitForNominatimSlot(): Promise<void> {
  const elapsed = Date.now() - lastNominatimAt;
  if (elapsed < NOMINATIM_MIN_INTERVAL_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, NOMINATIM_MIN_INTERVAL_MS - elapsed),
    );
  }
  lastNominatimAt = Date.now();
}

function rejectNullIsland(lat: number, lng: number): boolean {
  return !isValidCoordinate(lat, lng);
}

function mapsHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "User-Agent": MAPS_USER_AGENT,
  };
}

async function readJsonOrNull(response: Response): Promise<unknown | null> {
  const text = await response.text();
  if (!text || text.toLowerCase().includes("access denied")) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function fetchPhoton(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GeocodeResult | null> {
  const normalized = normalizeGeocodeQuery(query);
  if (!normalized) return null;

  const url = new URL(`${PHOTON_BASE_URL}/api/`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url.toString(), {
      headers: mapsHeaders(),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return null;

    const payload = (await readJsonOrNull(response)) as {
      features?: PhotonFeature[];
    } | null;
    const feature = payload?.features?.[0];
    const coords = feature?.geometry?.coordinates;
    if (!coords || coords.length < 2) return null;

    const longitude = Number(coords[0]);
    const latitude = Number(coords[1]);
    if (rejectNullIsland(latitude, longitude)) return null;

    const props = feature?.properties;
    const display_name = [props?.name, props?.street, props?.city, props?.country]
      .filter(Boolean)
      .join(", ");

    await setCachedGeocode({
      normalized_query: normalized,
      latitude,
      longitude,
      display_name: display_name || null,
      provider: "photon",
      confidence: "exact",
    });

    return {
      latitude,
      longitude,
      display_name: display_name || null,
      confidence: "exact",
      provider: "photon",
      query_used: query,
      from_cache: false,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchNominatim(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GeocodeResult | null> {
  const normalized = normalizeGeocodeQuery(query);
  if (!normalized) return null;

  const cached = await getCachedGeocode(normalized);
  if (cached) {
    if (rejectNullIsland(cached.latitude, cached.longitude)) return null;
    return {
      latitude: cached.latitude,
      longitude: cached.longitude,
      display_name: cached.display_name,
      confidence: (cached.confidence as LocationConfidence) ?? "exact",
      provider: (cached.provider as GeocodeProvider) || "nominatim",
      query_used: query,
      from_cache: true,
    };
  }

  await waitForNominatimSlot();

  const url = new URL(`${NOMINATIM_BASE_URL}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url.toString(), {
      headers: mapsHeaders(),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) return null;

    const payload = (await readJsonOrNull(response)) as NominatimHit[] | null;
    const hit = Array.isArray(payload) ? payload[0] : null;
    if (!hit?.lat || !hit?.lon) return null;

    const latitude = Number(hit.lat);
    const longitude = Number(hit.lon);
    if (rejectNullIsland(latitude, longitude)) return null;

    const confidence: LocationConfidence =
      typeof hit.importance === "number" && hit.importance < 0.2
        ? "approximate"
        : "exact";

    await setCachedGeocode({
      normalized_query: normalized,
      latitude,
      longitude,
      display_name: hit.display_name ?? null,
      provider: "nominatim",
      confidence,
    });

    return {
      latitude,
      longitude,
      display_name: hit.display_name ?? null,
      confidence,
      provider: "nominatim",
      query_used: query,
      from_cache: false,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function geocodeActivityLocation(input: {
  locationName: string;
  neighborhood: string | null;
  destination: string;
  fetchImpl?: typeof fetch;
}): Promise<GeocodeResult | null> {
  const attempts = buildGeocodeAttempts({
    locationName: input.locationName,
    neighborhood: input.neighborhood,
    destination: input.destination,
  });
  const fetchImpl = input.fetchImpl ?? fetch;

  for (const query of attempts) {
    const result =
      (await fetchNominatim(query, fetchImpl)) ??
      (await fetchPhoton(query, fetchImpl));
    if (!result) continue;

    const approximate =
      isApproximateQuery(query, input.neighborhood) ||
      result.confidence === "approximate";

    return {
      ...result,
      confidence: approximate ? "approximate" : "exact",
    };
  }

  return null;
}

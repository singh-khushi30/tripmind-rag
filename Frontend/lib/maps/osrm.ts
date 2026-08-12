import "server-only";

import {
  estimateWalkingMinutes,
  haversineKm,
  isValidCoordinate,
} from "@/lib/geo/coordinates";
import { MAPS_USER_AGENT, OSRM_BASE_URL, OSRM_TIMEOUT_MS } from "@/lib/maps/constants";
import type { DayRouteResult, LatLng, RouteSegment } from "@/lib/maps/route-types";

export type { DayRouteResult, LatLng, RouteSegment };

function sanitizePoints(points: LatLng[]): LatLng[] {
  return points.filter((point) => isValidCoordinate(point.lat, point.lng));
}

export function haversineDayRoute(points: LatLng[]): DayRouteResult {
  const safe = sanitizePoints(points);
  const segments: RouteSegment[] = [];
  const polyline: LatLng[] = [];

  for (let i = 0; i < safe.length; i += 1) {
    polyline.push(safe[i]!);
    if (i === 0) continue;
    const from = safe[i - 1]!;
    const to = safe[i]!;
    const distance_km = haversineKm(from.lat, from.lng, to.lat, to.lng);
    segments.push({
      from_index: i - 1,
      to_index: i,
      distance_km,
      duration_minutes: estimateWalkingMinutes(distance_km),
      geometry: [from, to],
      source: "haversine",
    });
  }

  return {
    segments,
    total_distance_km: segments.reduce((sum, s) => sum + s.distance_km, 0),
    total_duration_minutes: segments.reduce(
      (sum, s) => sum + s.duration_minutes,
      0,
    ),
    polyline,
    source: "haversine",
  };
}

export async function fetchOsrmDayRoute(
  points: LatLng[],
  fetchImpl: typeof fetch = fetch,
): Promise<DayRouteResult> {
  const safe = sanitizePoints(points);
  if (safe.length < 2) {
    return {
      segments: [],
      total_distance_km: 0,
      total_duration_minutes: 0,
      polyline: safe,
      source: "haversine",
    };
  }

  const coords = safe.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `${OSRM_BASE_URL}/route/v1/foot/${coords}?overview=full&geometries=geojson&steps=false`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": MAPS_USER_AGENT,
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) return haversineDayRoute(safe);

    const payload = (await response.json()) as {
      code?: string;
      routes?: Array<{
        distance?: number;
        duration?: number;
        geometry?: { coordinates?: Array<[number, number]> };
      }>;
    };
    const route = payload.routes?.[0];
    if (!route || payload.code !== "Ok") return haversineDayRoute(safe);

    const geometry =
      route.geometry?.coordinates?.map(([lng, lat]) => ({ lat, lng })) ?? [];

    const base = haversineDayRoute(safe);
    const total_distance_km =
      typeof route.distance === "number"
        ? route.distance / 1000
        : base.total_distance_km;
    const total_duration_minutes =
      typeof route.duration === "number"
        ? Math.round(route.duration / 60)
        : base.total_duration_minutes;

    const segments = base.segments.map((segment) => ({
      ...segment,
      distance_km:
        base.total_distance_km > 0
          ? segment.distance_km * (total_distance_km / base.total_distance_km)
          : segment.distance_km,
      duration_minutes: Math.max(
        1,
        Math.round(
          segment.duration_minutes *
            (total_duration_minutes /
              Math.max(1, base.total_duration_minutes)),
        ),
      ),
      source: "osrm" as const,
    }));

    return {
      segments,
      total_distance_km,
      total_duration_minutes,
      polyline: geometry.length > 1 ? geometry : base.polyline,
      source: "osrm",
    };
  } catch {
    return haversineDayRoute(safe);
  } finally {
    clearTimeout(timer);
  }
}

import {
  estimateWalkingMinutes,
  haversineKm,
  isValidCoordinate,
} from "@/lib/geo/coordinates";
import type { DayRouteResult, LatLng, RouteSegment } from "@/lib/maps/route-types";

export function buildHaversineDayRoute(points: LatLng[]): DayRouteResult {
  const safe = points.filter((point) => isValidCoordinate(point.lat, point.lng));
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

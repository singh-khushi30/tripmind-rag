import { haversineKm, isValidCoordinate } from "@/lib/geo/coordinates";
import {
  ROUTE_DAY_TRIP_MAX_KM,
  ROUTE_MAX_SEGMENT_KM,
  ROUTE_MAX_SEGMENT_MINUTES,
} from "@/lib/maps/constants-shared";
import type { DayRouteResult } from "@/lib/maps/route-types";
import type { ItineraryData, ItineraryDay } from "@/types/trip";

export type RouteWarningSeverity = "info" | "warning" | "error";

export type RouteWarning = {
  code:
    | "long_transfer"
    | "long_travel_time"
    | "excessive_backtracking"
    | "impossible_same_day"
    | "cross_city_spread"
    | "missing_coordinates";
  severity: RouteWarningSeverity;
  day_number: number;
  message: string;
  from_activity_index?: number;
  to_activity_index?: number;
  distance_km?: number;
  duration_minutes?: number;
};

export type RouteValidationThresholds = {
  maxSegmentKm: number;
  maxSegmentMinutes: number;
  dayTripMaxKm: number;
  backtrackRatio: number;
};

export const DEFAULT_ROUTE_THRESHOLDS: RouteValidationThresholds = {
  maxSegmentKm: ROUTE_MAX_SEGMENT_KM,
  maxSegmentMinutes: ROUTE_MAX_SEGMENT_MINUTES,
  dayTripMaxKm: ROUTE_DAY_TRIP_MAX_KM,
  backtrackRatio: 1.6,
};

export type LocatedActivity = {
  day_number: number;
  activity_index: number;
  title: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  confidence: "exact" | "approximate" | "unavailable" | null;
  looks_like_day_trip: boolean;
};

function dayTripLabel(day: ItineraryDay, activityTitle: string): boolean {
  const blob = `${day.title} ${day.summary} ${activityTitle}`.toLowerCase();
  return /\b(day trip|excursion|out of town|countryside|suburb)\b/.test(blob);
}

export function collectLocatedActivities(
  itinerary: ItineraryData,
): LocatedActivity[] {
  const items: LocatedActivity[] = [];
  for (const day of itinerary.days) {
    day.activities.forEach((activity, activityIndex) => {
      items.push({
        day_number: day.day_number,
        activity_index: activityIndex,
        title: activity.title,
        location_name: activity.location_name,
        latitude: activity.latitude ?? null,
        longitude: activity.longitude ?? null,
        confidence: activity.location_confidence ?? null,
        looks_like_day_trip: dayTripLabel(day, activity.title),
      });
    });
  }
  return items;
}

export function detectBacktracking(
  points: Array<{ lat: number; lng: number }>,
  ratioThreshold: number,
): boolean {
  if (points.length < 3) return false;
  let path = 0;
  for (let i = 1; i < points.length; i += 1) {
    path += haversineKm(
      points[i - 1]!.lat,
      points[i - 1]!.lng,
      points[i]!.lat,
      points[i]!.lng,
    );
  }
  const direct = haversineKm(
    points[0]!.lat,
    points[0]!.lng,
    points[points.length - 1]!.lat,
    points[points.length - 1]!.lng,
  );
  if (direct < 1) return path > 8;
  return path / direct >= ratioThreshold;
}

export function validateDayRoute(input: {
  day: ItineraryDay;
  route: DayRouteResult | null;
  thresholds?: Partial<RouteValidationThresholds>;
}): RouteWarning[] {
  const thresholds = { ...DEFAULT_ROUTE_THRESHOLDS, ...input.thresholds };
  const warnings: RouteWarning[] = [];
  const dayNumber = input.day.day_number;

  const located = input.day.activities.map((activity, index) => ({
    index,
    title: activity.title,
    lat: activity.latitude ?? null,
    lng: activity.longitude ?? null,
    dayTrip: dayTripLabel(input.day, activity.title),
  }));

  const missing = located.filter(
    (item) => !isValidCoordinate(item.lat, item.lng),
  );
  if (missing.length > 0) {
    warnings.push({
      code: "missing_coordinates",
      severity: "info",
      day_number: dayNumber,
      message: `${missing.length} stop${missing.length === 1 ? "" : "s"} missing verified coordinates`,
    });
  }

  const validPoints = located.filter((item) =>
    isValidCoordinate(item.lat, item.lng),
  );

  if (validPoints.length >= 2) {
    const lats = validPoints.map((p) => p.lat!);
    const lngs = validPoints.map((p) => p.lng!);
    const spanKm = haversineKm(
      Math.min(...lats),
      Math.min(...lngs),
      Math.max(...lats),
      Math.max(...lngs),
    );

    const allowsDayTrip = validPoints.some((p) => p.dayTrip);
    if (spanKm > thresholds.dayTripMaxKm && !allowsDayTrip) {
      warnings.push({
        code: "impossible_same_day",
        severity: "error",
        day_number: dayNumber,
        message: `Same-day stops span ~${spanKm.toFixed(0)} km — likely impossible without a day trip`,
        distance_km: spanKm,
      });
    } else if (spanKm > thresholds.maxSegmentKm * 2.5 && !allowsDayTrip) {
      warnings.push({
        code: "cross_city_spread",
        severity: "warning",
        day_number: dayNumber,
        message: `Activities spread across ~${spanKm.toFixed(0)} km in one day`,
        distance_km: spanKm,
      });
    }
  }

  const segments = input.route?.segments ?? [];
  for (const segment of segments) {
    const allowsDayTrip =
      dayTripLabel(
        input.day,
        input.day.activities[segment.from_index]?.title ?? "",
      ) ||
      dayTripLabel(
        input.day,
        input.day.activities[segment.to_index]?.title ?? "",
      );

    const maxKm = allowsDayTrip
      ? thresholds.dayTripMaxKm
      : thresholds.maxSegmentKm;

    if (segment.distance_km > maxKm) {
      warnings.push({
        code: "long_transfer",
        severity: allowsDayTrip ? "info" : "warning",
        day_number: dayNumber,
        from_activity_index: segment.from_index,
        to_activity_index: segment.to_index,
        distance_km: segment.distance_km,
        duration_minutes: segment.duration_minutes,
        message: `Long transfer: ~${segment.distance_km.toFixed(0)} km between stops`,
      });
    }

    if (
      segment.duration_minutes > thresholds.maxSegmentMinutes &&
      !allowsDayTrip
    ) {
      warnings.push({
        code: "long_travel_time",
        severity: "warning",
        day_number: dayNumber,
        from_activity_index: segment.from_index,
        to_activity_index: segment.to_index,
        distance_km: segment.distance_km,
        duration_minutes: segment.duration_minutes,
        message: `Long local travel: ~${segment.duration_minutes} min between stops`,
      });
    }
  }

  const routePoints = validPoints.map((p) => ({ lat: p.lat!, lng: p.lng! }));
  if (detectBacktracking(routePoints, thresholds.backtrackRatio)) {
    warnings.push({
      code: "excessive_backtracking",
      severity: "warning",
      day_number: dayNumber,
      message: "Day route appears to backtrack across the city",
    });
  }

  return warnings;
}

export function validateItineraryRoutes(input: {
  itinerary: ItineraryData;
  dayRoutes: Map<number, DayRouteResult>;
  thresholds?: Partial<RouteValidationThresholds>;
}): RouteWarning[] {
  const warnings: RouteWarning[] = [];
  for (const day of input.itinerary.days) {
    warnings.push(
      ...validateDayRoute({
        day,
        route: input.dayRoutes.get(day.day_number) ?? null,
        thresholds: input.thresholds,
      }),
    );
  }
  return warnings;
}

export function hasMajorRouteProblems(warnings: RouteWarning[]): boolean {
  return warnings.some(
    (warning) =>
      warning.severity === "error" ||
      warning.code === "excessive_backtracking" ||
      (warning.code === "long_transfer" &&
        (warning.distance_km ?? 0) > ROUTE_MAX_SEGMENT_KM * 1.5),
  );
}

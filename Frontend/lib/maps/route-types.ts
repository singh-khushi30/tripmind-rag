export type LatLng = { lat: number; lng: number };

export type RouteSegment = {
  from_index: number;
  to_index: number;
  distance_km: number;
  duration_minutes: number;
  geometry: LatLng[];
  source: "osrm" | "haversine";
};

export type DayRouteResult = {
  segments: RouteSegment[];
  total_distance_km: number;
  total_duration_minutes: number;
  polyline: LatLng[];
  source: "osrm" | "haversine" | "mixed";
};

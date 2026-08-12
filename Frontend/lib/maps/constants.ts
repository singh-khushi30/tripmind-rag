import "server-only";

export {
  ROUTE_DAY_TRIP_MAX_KM,
  ROUTE_MAX_SEGMENT_KM,
  ROUTE_MAX_SEGMENT_MINUTES,
} from "@/lib/maps/constants-shared";

export const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
export const PHOTON_BASE_URL = "https://photon.komoot.io";
export const OSRM_BASE_URL = "https://router.project-osrm.org";

/** Nominatim requires an identifying UA; fake example.com contacts get blocked. */
export const MAPS_USER_AGENT =
  "TripMind/0.1 (https://github.com/singh-khushi30/tripmind-rag; travel-planning)";

export const GEOCODE_TIMEOUT_MS = 10_000;
export const OSRM_TIMEOUT_MS = 12_000;

/** Nominatim usage policy: max ~1 request/second. */
export const NOMINATIM_MIN_INTERVAL_MS = 1100;

/** Shared weather constants (safe for tests). */

/** Open-Meteo free forecast typically covers ~16 days from today. */
export const OPEN_METEO_FORECAST_DAYS = 16;

export const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";

export const WEATHER_TIMEOUT_MS = 10_000;

export const WEATHER_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

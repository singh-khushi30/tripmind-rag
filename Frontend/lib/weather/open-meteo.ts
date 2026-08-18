import "server-only";

import {
  OPEN_METEO_BASE_URL,
  OPEN_METEO_FORECAST_DAYS,
  WEATHER_CACHE_TTL_MS,
  WEATHER_TIMEOUT_MS,
} from "@/lib/weather/constants";
import {
  categoryFromWeatherCode,
  refineCategoryWithTemps,
  summarizeWeather,
} from "@/lib/weather/interpret-weather";
import type {
  DayWeatherForecast,
  TripWeatherResult,
  WeatherStatus,
} from "@/lib/weather/types";

type CacheEntry = {
  expires_at: number;
  payload: OpenMeteoDailyPayload;
};

type OpenMeteoDailyPayload = {
  daily?: {
    time?: string[];
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
    precipitation_probability_max?: Array<number | null>;
    precipitation_sum?: Array<number | null>;
    weather_code?: Array<number | null>;
    wind_speed_10m_max?: Array<number | null>;
  };
};

const memoryCache = new Map<string, CacheEntry>();

function toDateOnly(value: string | Date): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string): number {
  const a = new Date(`${start}T12:00:00Z`).getTime();
  const b = new Date(`${end}T12:00:00Z`).getTime();
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function isWithinForecastHorizon(forecastDate: string): boolean {
  const today = todayUtc();
  // Allow yesterday so timezone rollover (e.g. US evening vs UTC date) still works.
  // Open-Meteo continues to return recent/current daily rows for that window.
  const earliest = addDays(today, -1);
  if (forecastDate < earliest) return false;
  return daysBetween(today, forecastDate) < OPEN_METEO_FORECAST_DAYS;
}

function cacheKey(lat: number, lng: number, start: string, end: string): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}:${start}:${end}`;
}

async function fetchOpenMeteoDaily(input: {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  fetchImpl?: typeof fetch;
}): Promise<OpenMeteoDailyPayload | null> {
  const key = cacheKey(
    input.latitude,
    input.longitude,
    input.startDate,
    input.endDate,
  );
  const cached = memoryCache.get(key);
  if (cached && cached.expires_at > Date.now()) {
    return cached.payload;
  }

  const url = new URL(OPEN_METEO_BASE_URL);
  url.searchParams.set("latitude", String(input.latitude));
  url.searchParams.set("longitude", String(input.longitude));
  url.searchParams.set("start_date", input.startDate);
  url.searchParams.set("end_date", input.endDate);
  url.searchParams.set("timezone", "auto");
  url.searchParams.set(
    "daily",
    [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "weather_code",
      "wind_speed_10m_max",
    ].join(","),
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEATHER_TIMEOUT_MS);

  try {
    const response = await (input.fetchImpl ?? fetch)(url.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as OpenMeteoDailyPayload;
    memoryCache.set(key, {
      expires_at: Date.now() + WEATHER_CACHE_TTL_MS,
      payload,
    });
    return payload;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function emptyDay(
  dayNumber: number,
  forecastDate: string,
  status: WeatherStatus,
  message?: string,
): DayWeatherForecast {
  return {
    day_number: dayNumber,
    forecast_date: forecastDate,
    weather_status: status,
    temp_min: null,
    temp_max: null,
    precipitation_probability: null,
    precipitation_amount: null,
    weather_code: null,
    wind_speed_max: null,
    summary: message ?? null,
    category: "unknown",
  };
}

export function buildTripDayDates(
  startDate: string,
  numberOfDays: number,
): string[] {
  const start = toDateOnly(startDate);
  return Array.from({ length: numberOfDays }, (_, index) =>
    addDays(start, index),
  );
}

/**
 * Fetch daily weather for a trip window. Never throws for service failures.
 */
export async function fetchTripWeather(input: {
  latitude: number | null;
  longitude: number | null;
  startDate: string | null;
  numberOfDays: number;
  fetchImpl?: typeof fetch;
}): Promise<TripWeatherResult> {
  const fetched_at = new Date().toISOString();

  if (!input.startDate) {
    return {
      status: "no_start_date",
      days: [],
      fetched_at: null,
      message: "Add travel dates to include weather-aware planning.",
    };
  }

  if (
    input.latitude == null ||
    input.longitude == null ||
    !Number.isFinite(input.latitude) ||
    !Number.isFinite(input.longitude)
  ) {
    const dates = buildTripDayDates(input.startDate, input.numberOfDays);
    return {
      status: "no_coordinates",
      days: dates.map((date, index) =>
        emptyDay(index + 1, date, "no_coordinates", "Coordinates unavailable"),
      ),
      fetched_at: null,
      message: "Weather needs verified activity coordinates.",
    };
  }

  const dates = buildTripDayDates(input.startDate, input.numberOfDays);
  const inHorizon = dates.filter((date) => isWithinForecastHorizon(date));

  if (inHorizon.length === 0) {
    return {
      status: "forecast_unavailable",
      days: dates.map((date, index) =>
        emptyDay(
          index + 1,
          date,
          "forecast_unavailable",
          "Outside live forecast horizon",
        ),
      ),
      fetched_at,
      message: "Travel dates are outside the live forecast window.",
    };
  }

  const payload = await fetchOpenMeteoDaily({
    latitude: input.latitude,
    longitude: input.longitude,
    startDate: inHorizon[0]!,
    endDate: inHorizon[inHorizon.length - 1]!,
    fetchImpl: input.fetchImpl,
  });

  if (!payload?.daily?.time) {
    return {
      status: "service_unavailable",
      days: dates.map((date, index) =>
        emptyDay(
          index + 1,
          date,
          "service_unavailable",
          "Weather service unavailable",
        ),
      ),
      fetched_at,
      message: "Weather service unavailable. Itinerary remains usable.",
    };
  }

  const byDate = new Map<string, number>();
  payload.daily.time.forEach((date, index) => byDate.set(date, index));

  const days: DayWeatherForecast[] = dates.map((date, index) => {
    if (!isWithinForecastHorizon(date)) {
      return emptyDay(
        index + 1,
        date,
        "forecast_unavailable",
        "Outside live forecast horizon",
      );
    }

    const rowIndex = byDate.get(date);
    if (rowIndex == null) {
      return emptyDay(
        index + 1,
        date,
        "forecast_unavailable",
        "No forecast row for this date",
      );
    }

    const temp_max = payload.daily?.temperature_2m_max?.[rowIndex] ?? null;
    const temp_min = payload.daily?.temperature_2m_min?.[rowIndex] ?? null;
    const precipitation_probability =
      payload.daily?.precipitation_probability_max?.[rowIndex] ?? null;
    const precipitation_amount =
      payload.daily?.precipitation_sum?.[rowIndex] ?? null;
    const weather_code = payload.daily?.weather_code?.[rowIndex] ?? null;
    const wind_speed_max = payload.daily?.wind_speed_10m_max?.[rowIndex] ?? null;

    const baseCategory = categoryFromWeatherCode(weather_code);
    const category = refineCategoryWithTemps(
      baseCategory,
      temp_max,
      temp_min,
      wind_speed_max,
    );

    return {
      day_number: index + 1,
      forecast_date: date,
      weather_status: "available",
      temp_min,
      temp_max,
      precipitation_probability,
      precipitation_amount,
      weather_code,
      wind_speed_max,
      category,
      summary: summarizeWeather({
        category,
        temp_min,
        temp_max,
        precipitation_probability,
      }),
    };
  });

  const anyAvailable = days.some((day) => day.weather_status === "available");

  return {
    status: anyAvailable ? "available" : "forecast_unavailable",
    days,
    fetched_at,
    message: anyAvailable
      ? null
      : "Travel dates are outside the live forecast window.",
  };
}

/** Test helper: expose horizon check without network. */
export function __testIsWithinForecastHorizon(date: string): boolean {
  return isWithinForecastHorizon(date);
}

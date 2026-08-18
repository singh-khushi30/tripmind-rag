import "server-only";

import {
  applyBudgetToItinerary,
  calculateTripBudget,
} from "@/lib/budget/calculate-trip-budget";
import { fetchExchangeRate } from "@/lib/currency/exchange-rate";
import { resolveLocalCurrency } from "@/lib/currency/local-currency";
import { formatCurrency } from "@/lib/format";
import type { ItineraryData } from "@/lib/gemini/schema";
import type { TripPlannerInput } from "@/lib/gemini/types";
import { isValidCoordinate } from "@/lib/geo/coordinates";
import { activityWeatherFit } from "@/lib/weather/activity-fit";
import { buildTripDayDates, fetchTripWeather } from "@/lib/weather/open-meteo";
import type { DayWeatherForecast } from "@/lib/weather/types";
import type { Currency } from "@/types/trip";

function tripCentroid(itinerary: ItineraryData): {
  lat: number | null;
  lng: number | null;
} {
  const points: Array<{ lat: number; lng: number }> = [];
  for (const day of itinerary.days) {
    for (const activity of day.activities) {
      if (isValidCoordinate(activity.latitude, activity.longitude)) {
        points.push({ lat: activity.latitude!, lng: activity.longitude! });
      }
    }
  }
  if (points.length === 0) return { lat: null, lng: null };
  return {
    lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
    lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length,
  };
}

function attachWeatherToItinerary(
  itinerary: ItineraryData,
  weatherDays: DayWeatherForecast[],
  weatherStatus: string,
  weatherMessage: string | null,
): ItineraryData {
  const byDay = new Map(weatherDays.map((day) => [day.day_number, day]));

  return {
    ...itinerary,
    weather_meta: {
      status: weatherStatus,
      message: weatherMessage,
    },
    days: itinerary.days.map((day) => {
      const forecast = byDay.get(day.day_number);
      const available = forecast?.weather_status === "available";
      return {
        ...day,
        calendar_date: forecast?.forecast_date ?? day.calendar_date ?? null,
        weather: forecast
          ? {
              weather_status: forecast.weather_status,
              temp_min: forecast.temp_min,
              temp_max: forecast.temp_max,
              precipitation_probability: forecast.precipitation_probability,
              summary: forecast.summary,
              category: forecast.category,
            }
          : day.weather,
        activities: day.activities.map((activity) => ({
          ...activity,
          weather_fit: activityWeatherFit({
            indoorOutdoor: activity.indoor_outdoor,
            category: forecast?.category,
            weatherAvailable: Boolean(available),
            startTime: activity.start_time,
          }),
        })),
      };
    }),
  };
}

/**
 * Post-process itinerary: currency conversion, budget, weather, weather_fit.
 * Never fails the trip — returns best-effort enrichment.
 */
export async function enrichItineraryAdaptive(input: {
  itinerary: ItineraryData;
  planner: TripPlannerInput;
}): Promise<{
  itinerary: ItineraryData;
  weatherDays: DayWeatherForecast[];
}> {
  let itinerary = { ...input.itinerary };

  const localCurrency =
    resolveLocalCurrency(itinerary.destination, itinerary.country) ??
    itinerary.destination_local_currency ??
    null;

  itinerary = {
    ...itinerary,
    destination_local_currency: localCurrency,
    display_currency: input.planner.currency,
  };

  if (input.planner.start_date) {
    const dates = buildTripDayDates(
      input.planner.start_date,
      input.planner.number_of_days,
    );
    itinerary = {
      ...itinerary,
      days: itinerary.days.map((day, index) => ({
        ...day,
        calendar_date: dates[index] ?? null,
      })),
    };
  }

  const exchange = localCurrency
    ? await fetchExchangeRate({
        sourceCurrency: localCurrency,
        targetCurrency: input.planner.currency,
      })
    : {
        source_currency: input.planner.currency,
        target_currency: input.planner.currency,
        rate: 1,
        fetched_date: null,
        status: "not_required" as const,
      };

  const breakdown = calculateTripBudget({
    itinerary,
    planner: input.planner,
    localCurrency,
    exchangeRate: exchange.rate,
    exchangeStatus: exchange.status,
    formatMoney: (amount, currency) =>
      formatCurrency(amount, currency as Currency),
  });

  itinerary = applyBudgetToItinerary(itinerary, breakdown);

  const centroid = tripCentroid(itinerary);
  const weather = await fetchTripWeather({
    latitude: centroid.lat,
    longitude: centroid.lng,
    startDate: input.planner.start_date ?? null,
    numberOfDays: input.planner.number_of_days,
  });

  itinerary = attachWeatherToItinerary(
    itinerary,
    weather.days,
    weather.status,
    weather.message,
  );

  const { ragLog } = await import("@/lib/rag/log");
  ragLog("weather.enriched", {
    status: weather.status,
    day_count: weather.days.length,
    available_days: weather.days.filter((day) => day.weather_status === "available")
      .length,
    has_coords: centroid.lat != null && centroid.lng != null,
    start_date: input.planner.start_date ?? null,
  });

  return { itinerary, weatherDays: weather.days };
}

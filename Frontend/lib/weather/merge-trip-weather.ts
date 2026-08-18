import type { ItineraryData } from "@/lib/gemini/schema";
import type { TripDayWeather } from "@/types/database";
import { activityWeatherFit } from "@/lib/weather/activity-fit";
import type { WeatherCategory } from "@/lib/weather/types";

/**
 * Merge persisted trip_day_weather rows into itinerary days when inline
 * weather is missing (e.g. older saves or partial enrich).
 */
export function mergeTripDayWeatherIntoItinerary(
  itinerary: ItineraryData,
  rows: TripDayWeather[],
): ItineraryData {
  if (!rows.length) return itinerary;

  const byDay = new Map(rows.map((row) => [row.day_number, row]));
  const anyAvailable = rows.some((row) => row.weather_status === "available");

  return {
    ...itinerary,
    weather_meta: itinerary.weather_meta ?? {
      status: anyAvailable ? "available" : (rows[0]?.weather_status ?? "forecast_unavailable"),
      message: null,
    },
    days: itinerary.days.map((day) => {
      const existing = day.weather;
      const hasInline =
        existing &&
        (existing.summary ||
          existing.temp_max != null ||
          existing.temp_min != null);
      if (hasInline) return day;

      const row = byDay.get(day.day_number);
      if (!row) return day;

      const available = row.weather_status === "available";
      const category = (row.category as WeatherCategory | null) ?? "unknown";

      return {
        ...day,
        calendar_date: day.calendar_date ?? row.forecast_date,
        weather: {
          weather_status: row.weather_status,
          temp_min: row.temp_min,
          temp_max: row.temp_max,
          precipitation_probability: row.precipitation_probability,
          summary: row.summary,
          category,
        },
        activities: day.activities.map((activity) => ({
          ...activity,
          weather_fit:
            activity.weather_fit ??
            activityWeatherFit({
              indoorOutdoor: activity.indoor_outdoor,
              category,
              weatherAvailable: available,
              startTime: activity.start_time,
            }),
        })),
      };
    }),
  };
}

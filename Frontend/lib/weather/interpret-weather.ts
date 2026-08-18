import type { WeatherCategory } from "@/lib/weather/types";

/** WMO weather interpretation codes → planning category. */
export function categoryFromWeatherCode(code: number | null | undefined): WeatherCategory {
  if (code == null || !Number.isFinite(code)) return "unknown";
  if (code === 0) return "clear";
  if (code >= 1 && code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "cloudy";
  if (code >= 51 && code <= 57) return "rain";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 80 && code <= 82) return "heavy_rain";
  if (code >= 95 && code <= 99) return "heavy_rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 85 && code <= 86) return "snow";
  return "unknown";
}

export function refineCategoryWithTemps(
  category: WeatherCategory,
  tempMax: number | null,
  tempMin: number | null,
  windSpeedMax: number | null,
): WeatherCategory {
  if (tempMax != null && tempMax >= 33) return "hot";
  if (tempMin != null && tempMin <= 2) return "cold";
  if (windSpeedMax != null && windSpeedMax >= 45 && category === "clear") {
    return "windy";
  }
  if (windSpeedMax != null && windSpeedMax >= 55) return "windy";
  return category;
}

export function summarizeWeather(input: {
  category: WeatherCategory;
  temp_min: number | null;
  temp_max: number | null;
  precipitation_probability: number | null;
}): string {
  const temp =
    input.temp_min != null && input.temp_max != null
      ? `${Math.round(input.temp_min)}–${Math.round(input.temp_max)}°C`
      : input.temp_max != null
        ? `up to ${Math.round(input.temp_max)}°C`
        : null;

  const rain =
    input.precipitation_probability != null
      ? `${Math.round(input.precipitation_probability)}% chance of precipitation`
      : null;

  const label: Record<WeatherCategory, string> = {
    clear: "Clear conditions",
    cloudy: "Cloudy",
    rain: "Rain likely",
    heavy_rain: "Heavy rain expected",
    snow: "Snow likely",
    hot: "Hot conditions",
    cold: "Cold conditions",
    windy: "Windy",
    unknown: "Weather uncertain",
  };

  return [label[input.category], temp, rain].filter(Boolean).join(" · ");
}

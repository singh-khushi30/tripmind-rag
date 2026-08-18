import type { IndoorOutdoor } from "@/lib/gemini/schema";
import type { WeatherCategory, WeatherFit } from "@/lib/weather/types";

export function activityWeatherFit(input: {
  indoorOutdoor: IndoorOutdoor;
  category: WeatherCategory | null | undefined;
  weatherAvailable: boolean;
  startTime?: string | null;
}): WeatherFit {
  if (!input.weatherAvailable || !input.category || input.category === "unknown") {
    return "unavailable";
  }

  const category = input.category;
  const place = input.indoorOutdoor;
  const midday = isMidday(input.startTime);

  if (category === "heavy_rain" || category === "snow") {
    if (place === "indoor") return "good";
    if (place === "mixed") return "caution";
    return "poor";
  }

  if (category === "rain") {
    if (place === "indoor") return "good";
    if (place === "mixed") return "caution";
    return "caution";
  }

  if (category === "hot") {
    if (place === "indoor") return "good";
    if (place === "outdoor" && midday) return "caution";
    if (place === "mixed" && midday) return "caution";
    return "good";
  }

  if (category === "cold" || category === "windy") {
    if (place === "outdoor") return "caution";
    return "good";
  }

  return "good";
}

function isMidday(startTime: string | null | undefined): boolean {
  if (!startTime) return false;
  const match = /^(\d{1,2})/.exec(startTime);
  if (!match) return false;
  const hour = Number(match[1]);
  return hour >= 11 && hour <= 15;
}

export type WeatherStatus =
  | "available"
  | "forecast_unavailable"
  | "service_unavailable"
  | "no_coordinates"
  | "no_start_date";

export type WeatherCategory =
  | "clear"
  | "cloudy"
  | "rain"
  | "heavy_rain"
  | "snow"
  | "hot"
  | "cold"
  | "windy"
  | "unknown";

export type WeatherFit = "good" | "caution" | "poor" | "unavailable";

export type DayWeatherForecast = {
  day_number: number;
  forecast_date: string;
  weather_status: WeatherStatus;
  temp_min: number | null;
  temp_max: number | null;
  precipitation_probability: number | null;
  precipitation_amount: number | null;
  weather_code: number | null;
  wind_speed_max: number | null;
  summary: string | null;
  category: WeatherCategory;
};

export type TripWeatherResult = {
  status: WeatherStatus;
  days: DayWeatherForecast[];
  fetched_at: string | null;
  message: string | null;
};

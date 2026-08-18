import { describe, expect, it, vi } from "vitest";

import {
  categoryFromWeatherCode,
  refineCategoryWithTemps,
  summarizeWeather,
} from "@/lib/weather/interpret-weather";
import { activityWeatherFit } from "@/lib/weather/activity-fit";
import {
  __testIsWithinForecastHorizon,
  buildTripDayDates,
  fetchTripWeather,
} from "@/lib/weather/open-meteo";

describe("weather interpretation", () => {
  it("maps weather codes to planning categories", () => {
    expect(categoryFromWeatherCode(0)).toBe("clear");
    expect(categoryFromWeatherCode(3)).toBe("cloudy");
    expect(categoryFromWeatherCode(61)).toBe("rain");
    expect(categoryFromWeatherCode(95)).toBe("heavy_rain");
    expect(categoryFromWeatherCode(71)).toBe("snow");
    expect(categoryFromWeatherCode(null)).toBe("unknown");
  });

  it("refines with hot and cold temps", () => {
    expect(refineCategoryWithTemps("clear", 35, 22, 5)).toBe("hot");
    expect(refineCategoryWithTemps("clear", 10, 0, 5)).toBe("cold");
  });

  it("builds a readable summary", () => {
    const summary = summarizeWeather({
      category: "rain",
      temp_min: 12,
      temp_max: 18,
      precipitation_probability: 70,
    });
    expect(summary).toContain("Rain likely");
    expect(summary).toContain("12–18°C");
    expect(summary).toContain("70%");
  });
});

describe("activity weather fit", () => {
  it("marks outdoor as poor in heavy rain", () => {
    expect(
      activityWeatherFit({
        indoorOutdoor: "outdoor",
        category: "heavy_rain",
        weatherAvailable: true,
      }),
    ).toBe("poor");
    expect(
      activityWeatherFit({
        indoorOutdoor: "indoor",
        category: "heavy_rain",
        weatherAvailable: true,
      }),
    ).toBe("good");
  });

  it("cautions outdoor midday in heat", () => {
    expect(
      activityWeatherFit({
        indoorOutdoor: "outdoor",
        category: "hot",
        weatherAvailable: true,
        startTime: "13:00",
      }),
    ).toBe("caution");
    expect(
      activityWeatherFit({
        indoorOutdoor: "indoor",
        category: "hot",
        weatherAvailable: true,
        startTime: "13:00",
      }),
    ).toBe("good");
  });

  it("returns unavailable without weather", () => {
    expect(
      activityWeatherFit({
        indoorOutdoor: "outdoor",
        category: "rain",
        weatherAvailable: false,
      }),
    ).toBe("unavailable");
  });
});

describe("open-meteo forecast horizon", () => {
  it("derives calendar dates from start_date", () => {
    expect(buildTripDayDates("2026-08-20", 3)).toEqual([
      "2026-08-20",
      "2026-08-21",
      "2026-08-22",
    ]);
  });

  it("marks far-future dates as outside live horizon", () => {
    expect(__testIsWithinForecastHorizon("2099-01-01")).toBe(false);
  });

  it("returns forecast_unavailable without fabricating data", async () => {
    const result = await fetchTripWeather({
      latitude: 48.85,
      longitude: 2.35,
      startDate: "2099-06-01",
      numberOfDays: 2,
      fetchImpl: vi.fn(),
    });
    expect(result.status).toBe("forecast_unavailable");
    expect(result.days.every((day) => day.weather_status === "forecast_unavailable")).toBe(
      true,
    );
    expect(result.days.every((day) => day.temp_max == null)).toBe(true);
  });

  it("parses available forecast rows from mocked API", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const fetchImpl = vi.fn(async () =>
      Response.json({
        daily: {
          time: [today],
          temperature_2m_max: [24],
          temperature_2m_min: [16],
          precipitation_probability_max: [80],
          precipitation_sum: [4.2],
          weather_code: [61],
          wind_speed_10m_max: [12],
        },
      }),
    );

    const result = await fetchTripWeather({
      latitude: 48.85,
      longitude: 2.35,
      startDate: today,
      numberOfDays: 1,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result.status).toBe("available");
    expect(result.days[0]?.category).toBe("rain");
    expect(result.days[0]?.temp_max).toBe(24);
  });
});

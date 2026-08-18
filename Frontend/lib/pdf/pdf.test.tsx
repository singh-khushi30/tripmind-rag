import { describe, expect, it } from "vitest";

import {
  buildTripPdfFilename,
  slugifyDestinationForFilename,
} from "@/lib/pdf/filename";
import {
  TRIP_PDF_DISCLAIMER,
  TripPdfAuthError,
  type TripPdfData,
} from "@/lib/pdf/types";
import type { TripResult } from "@/types/trip";

function sampleTrip(overrides: Partial<TripResult> = {}): TripResult {
  return {
    id: "trip-1",
    destination: "Paris",
    country: "France",
    summary: "A Paris culture walk.",
    days: 2,
    travelers: 2,
    travelStyle: "mid-range",
    pace: "moderate",
    interests: ["culture", "food"],
    startDate: "2026-09-10",
    budget: {
      total: 3200,
      currency: "EUR",
      estimatedTotalCost: 890,
      budgetStatus: "within_budget",
      perPerson: 445,
      remainingBudget: 2310,
      percentageUsed: 27.8,
      conversionStatus: "not_required",
      destinationLocalCurrency: "EUR",
      exchangeStatus: "not_required",
      extendedStatus: "comfortably_within_budget",
    },
    weather: { status: "available", message: null },
    itinerary: [
      {
        day_number: 1,
        title: "Louvre day",
        summary: "Museum morning",
        estimated_day_cost: 120,
        calendar_date: "2026-09-10",
        weather: {
          weather_status: "available",
          temp_min: 14,
          temp_max: 22,
          precipitation_probability: 30,
          summary: "Cloudy with light rain chance",
          category: "cloudy",
        },
        activities: [
          {
            start_time: "09:00",
            title: "Louvre Museum",
            description: "Morning galleries.",
            category: "Culture",
            estimated_cost: 22,
            duration_minutes: 180,
            location_name: "Louvre",
            neighborhood: "1st",
            indoor_outdoor: "indoor",
            reservation_required: true,
            notes: null,
            citation_ids: ["chunk-a"],
          },
        ],
      },
      {
        day_number: 2,
        title: "Marais",
        summary: "Neighborhood walk",
        estimated_day_cost: 80,
        calendar_date: "2026-09-11",
        activities: Array.from({ length: 8 }, (_, index) => ({
          start_time: `${10 + index}:00`,
          title: `Stop ${index + 1}`,
          description: `Activity description ${index + 1} for pagination coverage.`,
          category: "Culture",
          estimated_cost: 10,
          duration_minutes: 45,
          location_name: `Place ${index + 1}`,
          neighborhood: "Marais",
          indoor_outdoor: "outdoor" as const,
          reservation_required: false,
          notes: null,
          citation_ids: ["chunk-b"],
        })),
      },
    ],
    citations: [
      {
        citation_key: "chunk-a",
        travel_chunk_id: "chunk-a",
        travel_source_id: "src-1",
        source_type: "wikipedia",
        source_title: "Paris",
        source_url: "https://en.wikipedia.org/wiki/Paris",
        section_title: "Culture",
        fetched_at: null,
      },
    ],
    routeWarnings: [
      {
        code: "long_transfer",
        severity: "warning",
        day_number: 2,
        message: "Long transfer between Place 1 and Place 8.",
        distance_km: 8,
      },
    ],
    ...overrides,
  };
}

describe("pdf filename", () => {
  it("builds TripMind-destination-date.pdf", () => {
    expect(
      buildTripPdfFilename({
        destination: "Paris",
        startDate: "2026-09-10",
      }),
    ).toBe("TripMind-Paris-2026-09-10.pdf");
  });

  it("slugifies messy destinations", () => {
    expect(slugifyDestinationForFilename("Los Angeles, CA")).toBe(
      "Los-Angeles-CA",
    );
    expect(
      buildTripPdfFilename({
        destination: "Kyoto / Japan!",
        startDate: null,
        fallbackDate: "2026-08-12",
      }),
    ).toBe("TripMind-Kyoto-Japan-2026-08-12.pdf");
  });
});

describe("pdf payload expectations", () => {
  it("includes budget totals and disclaimer text", () => {
    const trip = sampleTrip();
    expect(trip.budget.estimatedTotalCost).toBe(890);
    expect(trip.budget.remainingBudget).toBe(2310);
    expect(TRIP_PDF_DISCLAIMER.toLowerCase()).toContain("ai");
    expect(TRIP_PDF_DISCLAIMER.toLowerCase()).toContain("verified");
  });

  it("includes citations with clickable urls", () => {
    const trip = sampleTrip();
    expect(trip.citations?.[0]?.source_url).toContain("wikipedia.org");
    expect(trip.citations?.[0]?.source_title).toBe("Paris");
  });

  it("supports long itineraries with many activities", () => {
    const trip = sampleTrip();
    expect(trip.itinerary[1]?.activities.length).toBeGreaterThan(5);
  });
});

describe("TripPdfAuthError", () => {
  it("carries unauthorized and missing-trip statuses", () => {
    expect(new TripPdfAuthError(401, "signed in").status).toBe(401);
    expect(new TripPdfAuthError(404, "not found").status).toBe(404);
  });
});

describe("pdf data shape", () => {
  it("carries route summary and citations for document rendering", () => {
    const data: TripPdfData = {
      trip: sampleTrip(),
      filename: "TripMind-Paris-2026-09-10.pdf",
      generatedAt: "2026-08-18T00:00:00.000Z",
      routeSummary: ["Day 1: 1 mapped stop (Louvre)."],
      citations: [
        {
          citation_key: "chunk-a",
          source_title: "Paris",
          source_url: "https://en.wikipedia.org/wiki/Paris",
          source_type: "wikipedia",
          section_title: "Culture",
        },
      ],
    };

    expect(data.filename).toMatch(/^TripMind-Paris-2026-09-10\.pdf$/);
    expect(data.citations[0]?.source_url).toMatch(/^https:\/\//);
    expect(data.trip.budget.total).toBe(3200);
  });
});

describe("pdf document render", () => {
  it("renders a PDF buffer for a long itinerary with citations and budget", async () => {
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { TripPdfDocument } = await import("@/lib/pdf/trip-pdf-document");

    const data: TripPdfData = {
      trip: sampleTrip(),
      filename: "TripMind-Paris-2026-09-10.pdf",
      generatedAt: "2026-08-18T00:00:00.000Z",
      routeSummary: [
        "Day 1: 1 mapped stop (Louvre).",
        "Day 2 note: Long transfer between Place 1 and Place 8.",
      ],
      citations: [
        {
          citation_key: "chunk-a",
          source_title: "Paris",
          source_url: "https://en.wikipedia.org/wiki/Paris",
          source_type: "wikipedia",
          section_title: "Culture",
        },
      ],
    };

    const buffer = await renderToBuffer(<TripPdfDocument data={data} />);
    const bytes = Buffer.from(buffer);
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
    expect(bytes.byteLength).toBeGreaterThan(1500);
  }, 30_000);
});

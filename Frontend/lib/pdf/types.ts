import type { TripResult } from "@/types/trip";

export const TRIP_PDF_DISCLAIMER =
  "This itinerary was generated with AI and grounded travel sources. Prices, weather, timings, and availability may change and should be verified before booking.";

export class TripPdfAuthError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "TripPdfAuthError";
    this.status = status;
  }
}

export type TripPdfCitation = {
  citation_key: string;
  source_title: string;
  source_url: string;
  source_type: string;
  section_title: string | null;
};

export type TripPdfData = {
  trip: TripResult;
  filename: string;
  generatedAt: string;
  routeSummary: string[];
  citations: TripPdfCitation[];
};

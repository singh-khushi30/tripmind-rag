import type { Metadata } from "next";

import tripResult from "@/data/mock/trip-result.json";
import { ResultsView } from "@/components/trip/results-view";
import type { TripResult } from "@/types/trip";

export const metadata: Metadata = {
  title: "Trip Results",
  description:
    "A personalized itinerary designed around your budget, interests, and travel pace.",
};

type ResultsPageProps = {
  searchParams: Promise<{ demo?: string }>;
};

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const trip = tripResult as TripResult;
  const initialState =
    params.demo === "error"
      ? "error"
      : params.demo === "ready"
        ? "ready"
        : "loading";

  return <ResultsView trip={trip} initialState={initialState} />;
}

import type { Metadata } from "next";

import { ResultsView } from "@/components/trip/results-view";

export const metadata: Metadata = {
  title: "Trip Results",
  description:
    "A personalized itinerary designed around your budget, interests, and travel pace.",
};

type TripResultsPageProps = {
  searchParams: Promise<{ demo?: string }>;
};

export default async function TripResultsPage({
  searchParams,
}: TripResultsPageProps) {
  const params = await searchParams;
  const initialState =
    params.demo === "error"
      ? "error"
      : params.demo === "ready"
        ? "ready"
        : "loading";

  return <ResultsView initialState={initialState} />;
}

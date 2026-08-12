import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { ErrorState } from "@/components/states/error-state";
import { ResultsView } from "@/components/trip/results-view";
import { tripToTripResult } from "@/lib/trips/mappers";
import { getTripCitations, getUserTripById } from "@/lib/trips/queries";
import type { Trip } from "@/types/database";

type TripPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: TripPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const trip = await getUserTripById(id);
    if (!trip) {
      return { title: "Trip not found" };
    }
    return {
      title: `${trip.destination} itinerary`,
      description: `Saved TripMind itinerary for ${trip.destination}.`,
    };
  } catch {
    return { title: "Trip" };
  }
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;

  let trip: Trip | null = null;
  let loadError = false;
  let citations = [] as Awaited<ReturnType<typeof getTripCitations>>;

  try {
    trip = await getUserTripById(id);
    if (trip) {
      citations = await getTripCitations(id);
    }
  } catch {
    loadError = true;
  }

  if (loadError) {
    return (
      <Container className="py-16">
        <ErrorState
          title="Couldn’t load this trip"
          description="Something went wrong while loading your itinerary. Please try again."
        />
      </Container>
    );
  }

  if (!trip) {
    notFound();
  }

  return (
    <ResultsView
      trip={tripToTripResult(trip, citations)}
      initialState="ready"
    />
  );
}

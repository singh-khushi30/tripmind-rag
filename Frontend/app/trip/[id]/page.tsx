import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { ErrorState } from "@/components/states/error-state";
import { ResultsView } from "@/components/trip/results-view";
import { Button } from "@/components/ui/button";
import { itineraryDataSchema } from "@/lib/gemini/schema";
import { ensureTripLocations } from "@/lib/maps/ensure-trip-locations";
import { tripToTripResult } from "@/lib/trips/mappers";
import {
  getTripCitations,
  getTripDayWeather,
  getUserTripById,
} from "@/lib/trips/queries";
import { mergeTripDayWeatherIntoItinerary } from "@/lib/weather/merge-trip-weather";
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
  let citations = [] as Awaited<ReturnType<typeof getTripCitations>>;

  try {
    trip = await getUserTripById(id);
  } catch {
    return (
      <Container className="py-16">
        <ErrorState
          title="Couldn’t load this trip"
          description="Something went wrong while loading your itinerary. Please try again."
          action={
            <Button render={<Link href={`/trip/${id}`} />}>Try again</Button>
          }
        />
      </Container>
    );
  }

  if (!trip) {
    notFound();
  }

  // Geocode backfill is best-effort and must not block/fail the trip page.
  try {
    trip = await ensureTripLocations(trip);
  } catch {
    // Keep original trip data.
  }

  try {
    citations = await getTripCitations(id);
  } catch {
    citations = [];
  }

  try {
    const weatherRows = await getTripDayWeather(id);
    if (weatherRows.length > 0) {
      const parsed = itineraryDataSchema.safeParse(trip.itinerary_data);
      const base = parsed.success
        ? parsed.data
        : trip.itinerary_data &&
            typeof trip.itinerary_data === "object" &&
            Array.isArray((trip.itinerary_data as { days?: unknown }).days)
          ? trip.itinerary_data
          : null;
      if (base?.days?.length) {
        trip = {
          ...trip,
          itinerary_data: mergeTripDayWeatherIntoItinerary(base, weatherRows),
        };
      }
    }
  } catch {
    // Weather hydrate is optional.
  }

  return (
    <ResultsView
      trip={tripToTripResult(trip, citations)}
      initialState="ready"
    />
  );
}

import type { Metadata } from "next";

import { SavedTripsGrid } from "@/components/dashboard/saved-trips-grid";
import { tripToSavedTripCard } from "@/lib/trips/mappers";
import { listUserTrips } from "@/lib/trips/queries";
import type { SavedTrip } from "@/types/trip";

export const metadata: Metadata = {
  title: "Saved Trips",
  description: "Browse and manage your saved TripMind itineraries.",
};

export default async function SavedTripsPage() {
  let trips: SavedTrip[] = [];
  let error: string | null = null;

  try {
    const rows = await listUserTrips();
    trips = rows.map(tripToSavedTripCard);
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "We couldn’t load your saved trips. Please try again.";
  }

  return <SavedTripsGrid trips={trips} error={error} />;
}

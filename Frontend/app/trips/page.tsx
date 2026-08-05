import type { Metadata } from "next";

import savedTrips from "@/data/mock/saved-trips.json";
import { SavedTripsGrid } from "@/components/dashboard/saved-trips-grid";
import type { SavedTrip } from "@/types/trip";

export const metadata: Metadata = {
  title: "Saved Trips",
  description: "Browse and manage your saved TripMind itineraries.",
};

export default function TripsPage() {
  return <SavedTripsGrid trips={savedTrips as SavedTrip[]} />;
}

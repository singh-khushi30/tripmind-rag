"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { SavedTripCard } from "@/components/dashboard/saved-trip-card";
import { Container } from "@/components/layout/container";
import { DashboardSkeleton } from "@/components/loading/dashboard-skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import type { SavedTrip } from "@/types/trip";

type SavedTripsGridProps = {
  trips: SavedTrip[];
};

export function SavedTripsGrid({ trips }: SavedTripsGridProps) {
  const [items, setItems] = useState<SavedTrip[]>(trips);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <Container className="space-y-8 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="text-brand text-xs font-medium tracking-[0.16em] uppercase">
            Dashboard
          </p>
          <h1 className="font-heading text-foreground text-4xl tracking-tight sm:text-5xl">
            Saved trips
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
            Your saved itineraries, all in one place.
          </p>
        </div>
        <Button render={<Link href="/trip/plan" />}>Plan another trip</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No trips saved yet"
          description="When you generate itineraries, they’ll land here as calm, glanceable cards. Start a plan to fill this space."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button render={<Link href="/trip/plan" />}>Plan Your Trip</Button>
              <Button
                variant="outline"
                onClick={() => setItems(trips)}
                disabled={trips.length === 0}
              >
                Restore saved trips
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((trip) => (
            <SavedTripCard
              key={trip.id}
              trip={trip}
              onDelete={(id) =>
                setItems((current) => current.filter((item) => item.id !== id))
              }
            />
          ))}
        </div>
      )}
    </Container>
  );
}

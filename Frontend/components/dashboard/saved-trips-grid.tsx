"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { deleteTripAction } from "@/app/trips/actions";
import { SavedTripCard } from "@/components/dashboard/saved-trip-card";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import type { SavedTrip } from "@/types/trip";

type SavedTripsGridProps = {
  trips: SavedTrip[];
  error?: string | null;
};

export function SavedTripsGrid({ trips, error = null }: SavedTripsGridProps) {
  const router = useRouter();
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const items = trips.filter((trip) => !removedIds.includes(trip.id));

  function handleDelete(id: string) {
    setActionError(null);
    setDeletingId(id);

    startTransition(async () => {
      const result = await deleteTripAction(id);

      if (result.error) {
        setActionError(result.error);
        setDeletingId(null);
        return;
      }

      setRemovedIds((current) =>
        current.includes(id) ? current : [...current, id],
      );
      setDeletingId(null);
      router.refresh();
    });
  }

  if (error) {
    return (
      <Container className="py-16">
        <ErrorState
          title="Couldn’t load saved trips"
          description={error}
          onRetry={() => router.refresh()}
        />
      </Container>
    );
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

      {actionError ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-2xl border px-4 py-3 text-sm"
        >
          {actionError}
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="No trips saved yet"
          description="When you generate itineraries, they’ll land here as calm, glanceable cards. Start a plan to fill this space."
          action={
            <Button render={<Link href="/trip/plan" />}>Plan Your Trip</Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((trip) => (
            <SavedTripCard
              key={trip.id}
              trip={trip}
              deleting={isPending && deletingId === trip.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </Container>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DestinationImage } from "@/components/ui/destination-image";
import { resolveDestinationImage } from "@/lib/destinations";
import { formatCurrency, formatTripDate } from "@/lib/format";
import type { SavedTrip } from "@/types/trip";

type SavedTripCardProps = {
  trip: SavedTrip;
  deleting?: boolean;
  onDelete: (id: string) => void;
};

export function SavedTripCard({
  trip,
  deleting = false,
  onDelete,
}: SavedTripCardProps) {
  const image = resolveDestinationImage(trip.destination);

  return (
    <article className="surface-card group overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <DestinationImage
        src={image.src}
        alt={image.alt}
        className="h-36 w-full"
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
      />
      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-foreground text-lg font-medium tracking-tight">
            {trip.destination}
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {formatTripDate(trip.date)} · {trip.days} days
          </p>
        </div>
        <p className="font-heading text-foreground text-2xl tracking-tight">
          {formatCurrency(trip.budget, trip.currency)}
        </p>
        <div className="flex items-center gap-2">
          <Button
            className="flex-1"
            disabled={deleting}
            render={<Link href={`/trip/${trip.id}`} />}
          >
            Continue
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={`Delete ${trip.destination}`}
            disabled={deleting}
            onClick={() => onDelete(trip.id)}
          >
            {deleting ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Trash2 />
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}

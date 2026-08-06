"use client";

import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DestinationImage } from "@/components/ui/destination-image";
import { DESTINATION_IMAGES } from "@/lib/destinations";
import { formatCurrency, formatTripDate } from "@/lib/format";
import type { SavedTrip } from "@/types/trip";

type SavedTripCardProps = {
  trip: SavedTrip;
  onDelete: (id: string) => void;
};

export function SavedTripCard({ trip, onDelete }: SavedTripCardProps) {
  const image = DESTINATION_IMAGES[trip.imageKey];

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
          <Button className="flex-1" render={<Link href="/trip/results" />}>
            Continue
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={`Delete ${trip.destination}`}
            onClick={() => onDelete(trip.id)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </article>
  );
}

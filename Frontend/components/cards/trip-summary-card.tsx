import { CalendarDays, Compass, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TripResult } from "@/types/trip";

type TripSummaryCardProps = {
  trip: TripResult;
  className?: string;
};

export function TripSummaryCard({ trip, className }: TripSummaryCardProps) {
  return (
    <article
      className={cn(
        "surface-card relative overflow-hidden p-6 sm:p-7",
        className,
      )}
    >
      <div className="from-brand/15 via-accent/40 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent" />
      <div className="relative space-y-4">
        <Badge variant="secondary">Trip summary</Badge>
        <div>
          <h2 className="font-heading text-foreground text-3xl tracking-tight sm:text-4xl">
            {trip.destination}
            {trip.country ? (
              <span className="text-muted-foreground">, {trip.country}</span>
            ) : null}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed sm:text-[15px]">
            {trip.summary}
          </p>
        </div>
        <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="text-brand size-4" />
            {trip.days} days
          </span>
          <span className="inline-flex items-center gap-2">
            <Users className="text-brand size-4" />
            {trip.travelers} travelers
          </span>
          <span className="inline-flex items-center gap-2 capitalize">
            <Compass className="text-brand size-4" />
            {trip.travelStyle.replace("-", " ")} · {trip.pace}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {trip.interests.map((interest) => (
            <Badge key={interest} variant="outline" className="capitalize">
              {interest}
            </Badge>
          ))}
        </div>
      </div>
    </article>
  );
}

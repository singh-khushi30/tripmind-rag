"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BudgetCard } from "@/components/cards/budget-card";
import { TripSummaryCard } from "@/components/cards/trip-summary-card";
import { Container } from "@/components/layout/container";
import { TripResultsSkeleton } from "@/components/loading/trip-results-skeleton";
import { MapPlaceholder } from "@/components/map/map-placeholder";
import { ErrorState } from "@/components/states/error-state";
import { BudgetBreakdown } from "@/components/trip/budget-breakdown";
import { DayTimeline } from "@/components/trip/day-timeline";
import { SourcesList } from "@/components/trip/sources-list";
import type { TripResult } from "@/types/trip";

type ResultsViewProps = {
  trip: TripResult;
  initialState?: "loading" | "ready" | "error";
};

export function ResultsView({
  trip,
  initialState = "loading",
}: ResultsViewProps) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready" | "error">(
    initialState,
  );

  useEffect(() => {
    if (initialState !== "loading") return;

    const timer = window.setTimeout(() => {
      setState("ready");
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [initialState]);

  if (state === "loading") {
    return <TripResultsSkeleton />;
  }

  if (state === "error") {
    return (
      <Container className="py-16">
        <ErrorState
          onRetry={() => {
            setState("loading");
            window.setTimeout(() => setState("ready"), 1200);
            router.replace("/results");
          }}
        />
      </Container>
    );
  }

  return (
    <Container className="space-y-8 py-10">
      <div className="space-y-2">
        <p className="text-brand text-xs font-medium tracking-[0.16em] uppercase">
          Generated itinerary
        </p>
        <h1 className="font-heading text-foreground text-4xl tracking-tight sm:text-5xl">
          Your trip preview
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed sm:text-base">
          A personalized itinerary designed around your budget, interests, and
          travel pace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TripSummaryCard trip={trip} />
        <BudgetCard trip={trip} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <DayTimeline days={trip.itinerary} />
        <aside className="space-y-4 lg:sticky lg:top-24">
          <MapPlaceholder
            label={trip.map.label}
            lat={trip.map.lat}
            lng={trip.map.lng}
          />
          <BudgetBreakdown
            items={trip.budget.breakdown}
            currency={trip.budget.currency}
          />
          <SourcesList sources={trip.sources} />
        </aside>
      </div>
    </Container>
  );
}

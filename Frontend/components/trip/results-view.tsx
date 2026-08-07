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
import { getMockItinerary } from "@/lib/mock-itineraries";
import type { TripResult } from "@/types/trip";

type ResultsViewProps = {
  trip?: TripResult;
  initialState?: "loading" | "ready" | "error";
};

function getDemoTrip(): TripResult {
  const mock = getMockItinerary("Kyoto, Japan", 5, "USD");

  return {
    id: "trip_demo_kyoto",
    destination: mock.destinationLabel,
    country: mock.country,
    summary:
      "A calm, culture-rich Kyoto itinerary balancing temples, seasonal gardens, and neighborhood food walks.",
    days: 5,
    travelers: 2,
    travelStyle: "mid-range",
    pace: "moderate",
    interests: ["culture", "food", "photography", "history", "nature"],
    budget: {
      total: 3200,
      currency: "USD",
      perPerson: 1600,
      breakdown: [
        { category: "Stay", amount: 1100, percentage: 34 },
        { category: "Food", amount: 720, percentage: 23 },
        { category: "Activities", amount: 540, percentage: 17 },
        { category: "Transport", amount: 480, percentage: 15 },
        { category: "Shopping", amount: 360, percentage: 11 },
      ],
    },
    itinerary: mock.itinerary,
    sources: mock.sources,
    map: mock.map,
  };
}

export function ResultsView({
  trip,
  initialState = "loading",
}: ResultsViewProps) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready" | "error">(
    trip ? "ready" : initialState,
  );

  useEffect(() => {
    if (trip || initialState !== "loading") return;

    const timer = window.setTimeout(() => {
      setState("ready");
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [initialState, trip]);

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
            router.replace("/trip/results");
          }}
        />
      </Container>
    );
  }

  return <ResultsReady trip={trip ?? getDemoTrip()} />;
}

function ResultsReady({ trip }: { trip: TripResult }) {
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
            markers={trip.map.markers}
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

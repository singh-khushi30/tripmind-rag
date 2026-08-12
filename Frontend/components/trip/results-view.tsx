"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BudgetCard } from "@/components/cards/budget-card";
import { TripSummaryCard } from "@/components/cards/trip-summary-card";
import { Container } from "@/components/layout/container";
import { TripResultsSkeleton } from "@/components/loading/trip-results-skeleton";
import { MapPlaceholder } from "@/components/map/map-placeholder";
import { ErrorState } from "@/components/states/error-state";
import { DayTimeline } from "@/components/trip/day-timeline";
import { SourcesUsedPanel } from "@/components/trip/sources-used-panel";
import type { ItineraryData } from "@/lib/gemini/schema";
import type { TripCitationSource, TripResult } from "@/types/trip";

type ResultsViewProps = {
  trip?: TripResult;
  initialState?: "loading" | "ready" | "error";
};

function getDemoTrip(): TripResult {
  const itinerary: ItineraryData = {
    destination: "Kyoto",
    country: "Japan",
    summary:
      "A calm, culture-rich Kyoto itinerary balancing temples, seasonal gardens, and neighborhood food walks.",
    currency: "USD",
    estimated_total_cost: 1450,
    budget_status: "within_budget",
    days: [
      {
        day_number: 1,
        title: "Temples and quiet lanes",
        summary: "Ease into Kyoto with classic temple walks and a local lunch.",
        estimated_day_cost: 180,
        activities: [
          {
            start_time: "09:00",
            title: "Morning at Kiyomizu-dera",
            description:
              "Start with hillside temple views and a stroll through nearby pottery streets.",
            category: "Culture",
            estimated_cost: 10,
            duration_minutes: 120,
            location_name: "Kiyomizu-dera",
            neighborhood: "Higashiyama",
            indoor_outdoor: "outdoor",
            reservation_required: false,
            notes: null,
            citation_ids: [],
          },
          {
            start_time: "12:30",
            title: "Neighborhood lunch",
            description:
              "Take a relaxed lunch break with local dishes near the temple approach.",
            category: "Food",
            estimated_cost: 25,
            duration_minutes: 75,
            location_name: "Higashiyama lunch street",
            neighborhood: "Higashiyama",
            indoor_outdoor: "indoor",
            reservation_required: false,
            notes: "Confirm dietary needs on arrival.",
            citation_ids: [],
          },
        ],
      },
    ],
  };

  return {
    id: "trip_demo_kyoto",
    destination: itinerary.destination,
    country: itinerary.country,
    summary: itinerary.summary,
    days: 1,
    travelers: 2,
    travelStyle: "mid-range",
    pace: "moderate",
    interests: ["culture", "food", "photography"],
    budget: {
      total: 3200,
      currency: "USD",
      estimatedTotalCost: itinerary.estimated_total_cost,
      budgetStatus: itinerary.budget_status,
      perPerson: Math.round(itinerary.estimated_total_cost / 2),
      remainingBudget: 3200 - itinerary.estimated_total_cost,
      percentageUsed: (itinerary.estimated_total_cost / 3200) * 100,
      conversionStatus: "not_required",
      destinationLocalCurrency: "JPY",
    },
    itinerary: itinerary.days,
    citations: [],
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
  const citations = trip.citations ?? [];
  const citationsByKey = new Map<string, TripCitationSource>(
    citations.map((citation) => [citation.citation_key, citation]),
  );

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

      <div
        role="note"
        className="border-border/80 bg-secondary/40 text-muted-foreground rounded-2xl border px-4 py-3 text-sm leading-relaxed"
      >
        Recommendations are grounded in retrieved Wikipedia and Wikivoyage
        travel information. Prices and availability remain estimates.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TripSummaryCard trip={trip} />
        <BudgetCard trip={trip} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <DayTimeline
          days={trip.itinerary}
          currency={trip.budget.currency}
          citationsByKey={citationsByKey}
        />
        <aside className="space-y-4 lg:sticky lg:top-24">
          <MapPlaceholder label={trip.destination} />
          <SourcesUsedPanel citations={citations} />
        </aside>
      </div>
    </Container>
  );
}

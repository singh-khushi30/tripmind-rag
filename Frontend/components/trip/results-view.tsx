"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, Wallet } from "lucide-react";

import { BudgetCard } from "@/components/cards/budget-card";
import { TripSummaryCard } from "@/components/cards/trip-summary-card";
import { Container } from "@/components/layout/container";
import { TripResultsSkeleton } from "@/components/loading/trip-results-skeleton";
import { TripMapPanel } from "@/components/map/trip-map-panel";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { InlineEmpty } from "@/components/states/inline-empty";
import { DayTimeline } from "@/components/trip/day-timeline";
import { ExportPdfButton } from "@/components/trip/export-pdf-button";
import { SourcesUsedPanel } from "@/components/trip/sources-used-panel";
import type { ItineraryData } from "@/lib/gemini/schema";
import type { RouteWarning } from "@/lib/maps/validate-route";
import type { TripCitationSource, TripResult } from "@/types/trip";

type ResultsViewProps = {
  trip?: TripResult;
  initialState?: "loading" | "ready" | "error";
};

function getDemoTrip(): TripResult {
  const startDate = new Date().toISOString().slice(0, 10);
  const itinerary: ItineraryData = {
    destination: "Kyoto",
    country: "Japan",
    summary:
      "A calm, culture-rich Kyoto itinerary balancing temples, seasonal gardens, and neighborhood food walks.",
    currency: "USD",
    display_currency: "USD",
    destination_local_currency: "JPY",
    conversion_status: "estimated",
    estimated_total_cost: 35,
    budget_status: "within_budget",
    weather_meta: {
      status: "available",
      message: null,
    },
    budget_meta: {
      warning: "You have approximately $3,165 remaining for flexibility.",
      exchange_rate: 0.0068,
      exchange_status: "live_or_latest",
      extended_status: "comfortably_within_budget",
      daily_average: 35,
    },
    days: [
      {
        day_number: 1,
        title: "Temples and quiet lanes",
        summary: "Ease into Kyoto with classic temple walks and a local lunch.",
        estimated_day_cost: 35,
        calendar_date: startDate,
        weather: {
          weather_status: "available",
          temp_min: 22,
          temp_max: 31,
          precipitation_probability: 20,
          summary: "Mostly clear · warm afternoon",
          category: "clear",
        },
        activities: [
          {
            start_time: "09:00",
            title: "Morning at Kiyomizu-dera",
            description:
              "Start with hillside temple views and a stroll through nearby pottery streets.",
            category: "Culture",
            estimated_cost: 400,
            estimated_cost_display: 3,
            duration_minutes: 120,
            location_name: "Kiyomizu-dera",
            neighborhood: "Higashiyama",
            indoor_outdoor: "outdoor",
            reservation_required: false,
            notes: null,
            citation_ids: [],
            latitude: 34.9949,
            longitude: 135.785,
            location_display_name: "Kiyomizu-dera, Kyoto",
            location_confidence: "exact",
            weather_fit: "good",
          },
          {
            start_time: "12:30",
            title: "Neighborhood lunch",
            description:
              "Take a relaxed lunch break with local dishes near the temple approach.",
            category: "Food",
            estimated_cost: 1500,
            estimated_cost_display: 10,
            duration_minutes: 75,
            location_name: "Higashiyama lunch street",
            neighborhood: "Higashiyama",
            indoor_outdoor: "indoor",
            reservation_required: false,
            notes: "Confirm dietary needs on arrival.",
            citation_ids: [],
            latitude: 34.9985,
            longitude: 135.7805,
            location_display_name: "Higashiyama, Kyoto",
            location_confidence: "approximate",
            weather_fit: "good",
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
    startDate,
    budget: {
      total: 3200,
      currency: "USD",
      estimatedTotalCost: itinerary.estimated_total_cost,
      budgetStatus: itinerary.budget_status,
      perPerson: Math.round(itinerary.estimated_total_cost / 2),
      remainingBudget: 3200 - itinerary.estimated_total_cost,
      percentageUsed: (itinerary.estimated_total_cost / 3200) * 100,
      conversionStatus: "estimated",
      destinationLocalCurrency: "JPY",
      exchangeRate: 0.0068,
      exchangeStatus: "live_or_latest",
      extendedStatus: "comfortably_within_budget",
      warning: itinerary.budget_meta?.warning ?? null,
    },
    weather: {
      status: "available",
      message: null,
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

function ResultsReady({ trip: initialTrip }: { trip: TripResult }) {
  const [trip, setTrip] = useState(initialTrip);
  const citations = trip.citations ?? [];
  const citationsByKey = new Map<string, TripCitationSource>(
    citations.map((citation) => [citation.citation_key, citation]),
  );
  const startDateMissing = !trip.startDate;
  const weatherStatus = trip.weather?.status ?? "no_start_date";
  const firstWeatherDay = trip.itinerary.find(
    (day) =>
      day.weather &&
      (day.weather.summary ||
        day.weather.temp_max != null ||
        day.weather.temp_min != null),
  );
  const weatherLabel =
    weatherStatus === "available"
      ? firstWeatherDay?.weather?.summary
        ? firstWeatherDay.weather.summary
        : "Weather available"
      : weatherStatus === "no_start_date"
        ? "Weather unavailable — add travel dates"
        : "Weather unavailable";
  const weatherDetail =
    firstWeatherDay?.weather &&
    firstWeatherDay.weather.temp_min != null &&
    firstWeatherDay.weather.temp_max != null
      ? `Day ${firstWeatherDay.day_number}: ${Math.round(firstWeatherDay.weather.temp_min)}–${Math.round(firstWeatherDay.weather.temp_max)}°C${
          firstWeatherDay.weather.precipitation_probability != null
            ? ` · ${Math.round(firstWeatherDay.weather.precipitation_probability)}% rain`
            : ""
        }`
      : trip.weather?.message;
  return (
    <Container className="animate-in fade-in space-y-8 py-10 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="section-eyebrow">Generated itinerary</p>
          <h1 className="section-title text-foreground text-4xl sm:text-5xl">
            Your trip preview
          </h1>
          <p className="section-copy max-w-2xl sm:text-base">
            A personalized itinerary designed around your budget, interests, and
            travel pace.
          </p>
        </div>
        {!trip.id.startsWith("trip_demo") ? (
          <ExportPdfButton tripId={trip.id} />
        ) : null}
      </div>

      <div role="note" className="field-note">
        Recommendations are grounded in retrieved Wikipedia and Wikivoyage
        travel information. Prices and availability remain estimates.
      </div>

      {weatherStatus !== "available" ? (
        <InlineEmpty
          icon={CloudOff}
          title={
            weatherStatus === "no_start_date"
              ? "Weather needs travel dates"
              : "Weather unavailable"
          }
          description={
            trip.weather?.message ??
            (weatherStatus === "no_start_date"
              ? "Add a start date when planning so we can fetch forecasts for each day."
              : "We couldn’t load a forecast for these dates. Outdoor tips may be less precise.")
          }
        />
      ) : null}

      <div className="border-border/80 bg-card/40 grid gap-3 rounded-2xl border px-4 py-4 text-sm sm:grid-cols-3">
        <div>
          <p className="section-eyebrow">Currency</p>
          <p className="text-foreground mt-1.5">
            Local {trip.budget.destinationLocalCurrency ?? "—"} · Display{" "}
            {trip.budget.currency}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Exchange:{" "}
            {trip.budget.exchangeStatus ?? trip.budget.conversionStatus ?? "—"}
          </p>
        </div>
        <div>
          <p className="section-eyebrow">Weather</p>
          <p className="text-foreground mt-1.5">{weatherLabel}</p>
          {weatherDetail ? (
            <p className="text-muted-foreground mt-1 text-xs">{weatherDetail}</p>
          ) : null}
        </div>
        <div>
          <p className="section-eyebrow">Utilization</p>
          <p className="text-foreground mt-1.5">
            {typeof trip.budget.percentageUsed === "number"
              ? `${Math.round(trip.budget.percentageUsed)}% of budget`
              : "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TripSummaryCard trip={trip} />
        {typeof trip.budget.estimatedTotalCost === "number" ? (
          <BudgetCard trip={trip} />
        ) : (
          <EmptyState
            compact
            icon={Wallet}
            title="Budget details unavailable"
            description="Cost estimates didn’t come through for this trip. You can still follow the day-by-day plan."
          />
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <DayTimeline
          tripId={trip.id.startsWith("trip_demo") ? undefined : trip.id}
          days={trip.itinerary}
          currency={trip.budget.currency}
          localCurrency={trip.budget.destinationLocalCurrency}
          startDateMissing={startDateMissing}
          citationsByKey={citationsByKey}
          onItineraryUpdate={(itinerary) => {
            setTrip((current) => ({
              ...current,
              itinerary: itinerary.days,
              budget: {
                ...current.budget,
                estimatedTotalCost: itinerary.estimated_total_cost,
                budgetStatus: itinerary.budget_status,
                remainingBudget: itinerary.budget_totals?.remaining_budget,
                percentageUsed: itinerary.budget_totals?.percentage_used,
                perPerson:
                  itinerary.budget_totals?.cost_per_traveler ??
                  current.budget.perPerson,
                warning: itinerary.budget_meta?.warning ?? current.budget.warning,
                exchangeRate:
                  itinerary.budget_meta?.exchange_rate ??
                  current.budget.exchangeRate,
                exchangeStatus:
                  itinerary.budget_meta?.exchange_status ??
                  current.budget.exchangeStatus,
                extendedStatus:
                  itinerary.budget_meta?.extended_status ??
                  current.budget.extendedStatus,
                destinationLocalCurrency:
                  itinerary.destination_local_currency ??
                  current.budget.destinationLocalCurrency,
                conversionStatus:
                  itinerary.conversion_status ?? current.budget.conversionStatus,
              },
              weather: itinerary.weather_meta
                ? {
                    status: itinerary.weather_meta.status,
                    message: itinerary.weather_meta.message ?? null,
                  }
                : current.weather,
            }));
          }}
        />
        <aside className="space-y-4 lg:sticky lg:top-24">
          <TripMapPanel
            destination={trip.destination}
            days={trip.itinerary}
            currency={trip.budget.currency}
            warnings={(trip.routeWarnings ?? []) as RouteWarning[]}
          />
          <SourcesUsedPanel citations={citations} />
        </aside>
      </div>
    </Container>
  );
}

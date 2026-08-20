"use client";

import dynamic from "next/dynamic";
import { Component, useMemo, useState, type ReactNode } from "react";
import { MapPin } from "lucide-react";

import type { RouteWarning } from "@/lib/maps/validate-route";
import { cn } from "@/lib/utils";
import type { Currency, ItineraryDay } from "@/types/trip";

const TripMap = dynamic(
  () => import("@/components/map/trip-map").then((mod) => mod.TripMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="surface-card flex min-h-72 flex-col items-center justify-center gap-3 p-6"
        role="status"
        aria-live="polite"
      >
        <div className="bg-secondary/80 h-2 w-32 animate-pulse rounded-full" />
        <p className="text-muted-foreground text-sm">Loading your trip map…</p>
      </div>
    ),
  },
);

type TripMapPanelProps = {
  destination: string;
  days: ItineraryDay[];
  currency: Currency;
  warnings?: RouteWarning[];
  className?: string;
};

class MapErrorBoundary extends Component<
  { children: ReactNode; destination: string; onRetry: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="surface-card flex min-h-72 items-center justify-center p-6">
          <div className="max-w-xs text-center">
            <div className="bg-secondary text-brand mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl">
              <MapPin className="size-5" aria-hidden />
            </div>
            <p className="text-foreground text-sm font-medium tracking-tight">
              Map couldn&apos;t load
            </p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              The itinerary for {this.props.destination} is still usable without
              the interactive map.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onRetry();
              }}
              className="bg-secondary text-brand hover:bg-secondary/80 focus-visible:ring-ring/50 mt-4 rounded-full px-3 py-1.5 text-xs font-medium transition outline-none focus-visible:ring-3"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function TripMapPanel({
  destination,
  days,
  currency,
  warnings = [],
  className,
}: TripMapPanelProps) {
  const dayNumbers = useMemo(
    () => days.map((day) => day.day_number).sort((a, b) => a - b),
    [days],
  );
  const [selectedDay, setSelectedDay] = useState<number | "all">(
    dayNumbers[0] ?? "all",
  );
  const [mapKey, setMapKey] = useState(0);

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Map day filter"
      >
        {dayNumbers.map((dayNumber) => (
          <button
            key={dayNumber}
            type="button"
            role="tab"
            aria-selected={selectedDay === dayNumber}
            onClick={() => setSelectedDay(dayNumber)}
            className={cn(
              "focus-visible:ring-ring/50 rounded-full px-3 py-1.5 text-xs font-medium transition outline-none focus-visible:ring-3",
              selectedDay === dayNumber
                ? "bg-brand text-brand-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/80",
            )}
          >
            Day {dayNumber}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={selectedDay === "all"}
          onClick={() => setSelectedDay("all")}
          className={cn(
            "focus-visible:ring-ring/50 rounded-full px-3 py-1.5 text-xs font-medium transition outline-none focus-visible:ring-3",
            selectedDay === "all"
              ? "bg-brand text-brand-foreground"
              : "bg-secondary text-foreground hover:bg-secondary/80",
          )}
        >
          All days
        </button>
      </div>

      <MapErrorBoundary
        destination={destination}
        onRetry={() => setMapKey((value) => value + 1)}
      >
        <TripMap
          key={mapKey}
          destination={destination}
          days={days}
          selectedDay={selectedDay}
          currency={currency}
          warnings={warnings}
        />
      </MapErrorBoundary>
    </div>
  );
}

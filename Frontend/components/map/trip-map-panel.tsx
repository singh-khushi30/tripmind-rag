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
      <div className="surface-card flex min-h-72 items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading map…</p>
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
  { children: ReactNode; destination: string },
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
              <MapPin className="size-5" />
            </div>
            <p className="text-foreground text-sm font-medium">
              Map unavailable
            </p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              The itinerary for {this.props.destination} is still usable without
              the interactive map.
            </p>
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

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-2">
        {dayNumbers.map((dayNumber) => (
          <button
            key={dayNumber}
            type="button"
            onClick={() => setSelectedDay(dayNumber)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
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
          onClick={() => setSelectedDay("all")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition",
            selectedDay === "all"
              ? "bg-brand text-brand-foreground"
              : "bg-secondary text-foreground hover:bg-secondary/80",
          )}
        >
          All days
        </button>
      </div>

      <MapErrorBoundary destination={destination}>
        <TripMap
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

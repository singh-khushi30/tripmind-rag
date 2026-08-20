"use client";

import { ActivityCard } from "@/components/cards/activity-card";
import { DayReplanControls } from "@/components/trip/day-replan-controls";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ItineraryData } from "@/lib/gemini/schema";
import type { Currency, ItineraryDay, TripCitationSource } from "@/types/trip";

type DayTimelineProps = {
  tripId?: string;
  days: ItineraryDay[];
  currency: Currency;
  localCurrency?: string | null;
  startDateMissing?: boolean;
  citationsByKey?: Map<string, TripCitationSource>;
  className?: string;
  onItineraryUpdate?: (itinerary: ItineraryData) => void;
};

function DayWeatherBanner({ day }: { day: ItineraryDay }) {
  const weather = day.weather;
  if (!weather) return null;

  const hasTemps = weather.temp_min != null && weather.temp_max != null;
  const hasRain = weather.precipitation_probability != null;
  const status = weather.weather_status;

  if (!weather.summary && !hasTemps && !hasRain && !status) return null;

  const unavailable =
    status &&
    status !== "available" &&
    !hasTemps &&
    !weather.summary;

  return (
    <div
      className={cn(
        "mt-3 rounded-xl border px-3 py-2 text-xs leading-relaxed",
        status === "available"
          ? "border-brand/30 bg-brand/5 text-foreground"
          : "border-border/80 bg-secondary/40 text-muted-foreground",
      )}
    >
      <p className="font-medium tracking-wide uppercase">
        {status === "available" ? "Day weather" : "Weather"}
      </p>
      <p className="mt-1">
        {unavailable
          ? weather.summary ||
            "Forecast unavailable for this date (outside live horizon)."
          : [
              weather.summary,
              hasTemps
                ? `${Math.round(weather.temp_min!)}–${Math.round(weather.temp_max!)}°C`
                : null,
              hasRain
                ? `${Math.round(weather.precipitation_probability!)}% rain chance`
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Weather data attached."}
      </p>
    </div>
  );
}

export function DayTimeline({
  tripId,
  days,
  currency,
  localCurrency,
  startDateMissing = false,
  citationsByKey,
  className,
  onItineraryUpdate,
}: DayTimelineProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {startDateMissing ? (
        <div role="note" className="field-note">
          Add travel dates to include weather-aware planning.
        </div>
      ) : null}

      {days.map((day) => (
        <section key={day.day_number} className="relative">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="section-eyebrow">
                Day {day.day_number}
                {day.calendar_date ? ` · ${day.calendar_date}` : null}
              </p>
              <h3 className="section-title text-foreground mt-1 text-2xl">
                {day.title}
              </h3>
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                {day.summary}
              </p>
              <DayWeatherBanner day={day} />
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs tracking-[0.12em] uppercase">
                Est. day cost
              </p>
              <p className="text-foreground text-sm font-medium">
                {formatCurrency(day.estimated_day_cost, currency)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {day.activities.length} activities
              </p>
            </div>
          </div>

          {tripId ? (
            <DayReplanControls
              tripId={tripId}
              dayNumber={day.day_number}
              onItineraryUpdate={onItineraryUpdate}
            />
          ) : null}

          <div className="before:from-brand/50 before:via-border relative mt-4 space-y-3 pl-4 before:absolute before:top-2 before:bottom-2 before:left-0 before:w-px before:bg-gradient-to-b before:to-transparent">
            {day.activities.map((activity, index) => (
              <div
                key={`${day.day_number}-${activity.start_time}-${activity.title}-${index}`}
                className="relative"
              >
                <span className="bg-brand absolute top-6 -left-[1.28rem] size-2.5 rounded-full ring-4 ring-white" />
                <ActivityCard
                  activity={activity}
                  currency={currency}
                  localCurrency={localCurrency}
                  citationsByKey={citationsByKey}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

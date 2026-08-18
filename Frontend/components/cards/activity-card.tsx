import { Clock3, Coins, MapPin, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ActivitySources } from "@/components/trip/activity-sources";
import { formatCurrency, formatDurationMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Currency, ItineraryActivity, TripCitationSource } from "@/types/trip";

type ActivityCardProps = {
  activity: ItineraryActivity;
  currency: Currency;
  localCurrency?: string | null;
  citationsByKey?: Map<string, TripCitationSource>;
  className?: string;
};

const INDOOR_OUTDOOR_LABEL = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  mixed: "Indoor / outdoor",
} as const;

const WEATHER_FIT_LABEL = {
  good: "Weather fit: good",
  caution: "Weather: caution",
  poor: "Weather: poor fit",
  unavailable: "Weather: n/a",
} as const;

export function ActivityCard({
  activity,
  currency,
  localCurrency,
  citationsByKey,
  className,
}: ActivityCardProps) {
  const displayCost =
    activity.estimated_cost_display ?? activity.estimated_cost;
  const showLocal =
    Boolean(localCurrency) &&
    localCurrency !== currency &&
    activity.estimated_cost_display != null;

  return (
    <article
      className={cn(
        "surface-card p-5 transition-shadow hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-brand text-xs font-medium tracking-[0.14em] uppercase">
            {activity.start_time}
          </p>
          <h4 className="text-foreground text-base font-medium tracking-tight">
            {activity.title}
          </h4>
          <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <MapPin className="size-3.5 shrink-0" />
            {activity.location_name}
            {activity.neighborhood ? ` · ${activity.neighborhood}` : null}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {activity.location_confidence === "exact" ? (
            <Badge variant="outline">Verified location</Badge>
          ) : null}
          {activity.location_confidence === "approximate" ? (
            <Badge variant="outline">Approximate location</Badge>
          ) : null}
          {activity.location_confidence === "unavailable" ? (
            <Badge variant="outline">Location unavailable</Badge>
          ) : null}
          {activity.weather_fit ? (
            <Badge
              variant={
                activity.weather_fit === "poor" ? "destructive" : "outline"
              }
            >
              {WEATHER_FIT_LABEL[activity.weather_fit]}
            </Badge>
          ) : null}
          <Badge variant="secondary">{activity.category}</Badge>
          <Badge variant="outline">
            {INDOOR_OUTDOOR_LABEL[activity.indoor_outdoor]}
          </Badge>
          {activity.reservation_required ? (
            <Badge variant="outline">
              <Ticket className="size-3" />
              Reservation
            </Badge>
          ) : null}
        </div>
      </div>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        {activity.description}
      </p>
      {activity.notes ? (
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed italic">
          Note: {activity.notes}
        </p>
      ) : null}
      <div className="text-muted-foreground mt-4 flex flex-wrap gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <Coins className="size-3.5" />
          {displayCost === 0
            ? "Free (estimate)"
            : showLocal
              ? `≈ ${formatCurrency(displayCost, currency)} · ${formatCurrency(activity.estimated_cost, localCurrency!)} local`
              : `${formatCurrency(displayCost, currency)} (estimate)`}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-3.5" />
          {formatDurationMinutes(activity.duration_minutes)}
        </span>
      </div>
      {citationsByKey ? (
        <ActivitySources
          citationIds={activity.citation_ids ?? []}
          citationsByKey={citationsByKey}
        />
      ) : null}
    </article>
  );
}

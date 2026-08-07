import { Clock3, Coins, MapPin, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDurationMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Currency, ItineraryActivity } from "@/types/trip";

type ActivityCardProps = {
  activity: ItineraryActivity;
  currency: Currency;
  className?: string;
};

const INDOOR_OUTDOOR_LABEL = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  mixed: "Indoor / outdoor",
} as const;

export function ActivityCard({
  activity,
  currency,
  className,
}: ActivityCardProps) {
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
          {activity.estimated_cost === 0
            ? "Free"
            : formatCurrency(activity.estimated_cost, currency)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-3.5" />
          {formatDurationMinutes(activity.duration_minutes)}
        </span>
      </div>
    </article>
  );
}

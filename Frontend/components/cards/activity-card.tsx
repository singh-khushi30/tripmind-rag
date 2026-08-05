import { Clock3, Coins } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TripActivity } from "@/types/trip";

type ActivityCardProps = {
  activity: TripActivity;
  className?: string;
};

export function ActivityCard({ activity, className }: ActivityCardProps) {
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
            {activity.time}
          </p>
          <h4 className="text-foreground text-base font-medium tracking-tight">
            {activity.title}
          </h4>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{activity.category}</Badge>
          <Badge variant="outline">{activity.source}</Badge>
        </div>
      </div>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        {activity.description}
      </p>
      <div className="text-muted-foreground mt-4 flex flex-wrap gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <Coins className="size-3.5" />
          {activity.estimatedCost === 0
            ? "Free"
            : formatCurrency(activity.estimatedCost, activity.currency)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-3.5" />
          {activity.duration}
        </span>
      </div>
    </article>
  );
}

import { ActivityCard } from "@/components/cards/activity-card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Currency, ItineraryDay } from "@/types/trip";

type DayTimelineProps = {
  days: ItineraryDay[];
  currency: Currency;
  className?: string;
};

export function DayTimeline({ days, currency, className }: DayTimelineProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {days.map((day) => (
        <section key={day.day_number} className="relative">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-brand text-xs font-medium tracking-[0.16em] uppercase">
                Day {day.day_number}
              </p>
              <h3 className="font-heading text-foreground mt-1 text-2xl tracking-tight">
                {day.title}
              </h3>
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                {day.summary}
              </p>
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

          <div className="before:from-brand/50 before:via-border relative space-y-3 pl-4 before:absolute before:top-2 before:bottom-2 before:left-0 before:w-px before:bg-gradient-to-b before:to-transparent">
            {day.activities.map((activity, index) => (
              <div
                key={`${day.day_number}-${activity.start_time}-${activity.title}-${index}`}
                className="relative"
              >
                <span className="bg-brand absolute top-6 -left-[1.2rem] size-2.5 rounded-full ring-4 ring-[oklch(0.985_0.008_240)]" />
                <ActivityCard activity={activity} currency={currency} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

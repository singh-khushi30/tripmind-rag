import { ActivityCard } from "@/components/cards/activity-card";
import { cn } from "@/lib/utils";
import type { TripDay } from "@/types/trip";

type DayTimelineProps = {
  days: TripDay[];
  className?: string;
};

export function DayTimeline({ days, className }: DayTimelineProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {days.map((day) => (
        <section key={day.day} className="relative">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-brand text-xs font-medium tracking-[0.16em] uppercase">
                {day.dateLabel}
              </p>
              <h3 className="font-heading text-foreground mt-1 text-2xl tracking-tight">
                {day.title}
              </h3>
            </div>
            <span className="text-muted-foreground text-xs">
              {day.activities.length} activities
            </span>
          </div>

          <div className="before:from-brand/50 before:via-border relative space-y-3 pl-4 before:absolute before:top-2 before:bottom-2 before:left-0 before:w-px before:bg-gradient-to-b before:to-transparent">
            {day.activities.map((activity) => (
              <div key={activity.id} className="relative">
                <span className="bg-brand absolute top-6 -left-[1.2rem] size-2.5 rounded-full ring-4 ring-[oklch(0.985_0.008_240)]" />
                <ActivityCard activity={activity} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

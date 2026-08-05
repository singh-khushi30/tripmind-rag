import { Wallet } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TripResult } from "@/types/trip";

type BudgetCardProps = {
  trip: TripResult;
  className?: string;
};

export function BudgetCard({ trip, className }: BudgetCardProps) {
  return (
    <article className={cn("surface-card p-6 sm:p-7", className)}>
      <div className="mb-5 flex items-center gap-3">
        <div className="bg-secondary text-brand flex size-10 items-center justify-center rounded-2xl">
          <Wallet className="size-5" />
        </div>
        <div>
          <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
            Total budget
          </p>
          <p className="font-heading text-foreground text-3xl tracking-tight">
            {formatCurrency(trip.budget.total, trip.budget.currency)}
          </p>
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        About{" "}
        <span className="text-foreground font-medium">
          {formatCurrency(trip.budget.perPerson, trip.budget.currency)}
        </span>{" "}
        per traveler across stays, food, activities, and transport.
      </p>
    </article>
  );
}

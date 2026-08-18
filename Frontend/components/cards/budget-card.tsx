import { Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BudgetStatus, TripResult } from "@/types/trip";

type BudgetCardProps = {
  trip: TripResult;
  className?: string;
};

const BUDGET_STATUS_LABEL: Record<string, string> = {
  comfortably_within_budget: "Comfortably within budget",
  within_budget: "Within budget",
  near_budget: "Near budget",
  over_budget: "Over budget",
};

export function BudgetCard({ trip, className }: BudgetCardProps) {
  const extended =
    trip.budget.extendedStatus ?? trip.budget.budgetStatus ?? "within_budget";
  const conversionNote =
    trip.budget.conversionStatus === "estimated"
      ? "Converted with a free exchange-rate feed (estimates, not guaranteed prices)."
      : trip.budget.conversionStatus === "unavailable"
        ? "Conversion unavailable — showing local currency estimates where possible."
        : "Approximate estimates in your selected currency.";

  return (
    <article className={cn("surface-card p-6 sm:p-7", className)}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-secondary text-brand flex size-10 items-center justify-center rounded-2xl">
            <Wallet className="size-5" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
              Your budget
            </p>
            <p className="font-heading text-foreground text-3xl tracking-tight">
              {formatCurrency(trip.budget.total, trip.budget.currency)}
            </p>
          </div>
        </div>
        <Badge variant="secondary">
          {BUDGET_STATUS_LABEL[extended] ??
            BUDGET_STATUS_LABEL[trip.budget.budgetStatus as BudgetStatus]}
        </Badge>
      </div>
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">
          Estimated spend{" "}
          <span className="text-foreground font-medium">
            {formatCurrency(
              trip.budget.estimatedTotalCost,
              trip.budget.currency,
            )}
          </span>
        </p>
        <p className="text-muted-foreground">
          About{" "}
          <span className="text-foreground font-medium">
            {formatCurrency(trip.budget.perPerson, trip.budget.currency)}
          </span>{" "}
          per traveler (estimate).
        </p>
        {typeof trip.budget.remainingBudget === "number" ? (
          <p className="text-muted-foreground">
            Remaining{" "}
            <span className="text-foreground font-medium">
              {formatCurrency(
                trip.budget.remainingBudget,
                trip.budget.currency,
              )}
            </span>
            {typeof trip.budget.percentageUsed === "number"
              ? ` · ${Math.round(trip.budget.percentageUsed)}% used`
              : null}
          </p>
        ) : null}
        {trip.budget.warning ? (
          <p className="text-foreground text-sm leading-relaxed">
            {trip.budget.warning}
          </p>
        ) : null}
        <p className="text-muted-foreground text-xs leading-relaxed">
          {conversionNote}
          {trip.budget.destinationLocalCurrency
            ? ` Local: ${trip.budget.destinationLocalCurrency}. Display: ${trip.budget.currency}.`
            : null}
          {trip.budget.exchangeRate != null &&
          trip.budget.destinationLocalCurrency &&
          trip.budget.destinationLocalCurrency !== trip.budget.currency
            ? ` Rate ≈ ${trip.budget.exchangeRate} (${trip.budget.exchangeStatus ?? "live_or_latest"}).`
            : null}
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Estimated costs are planning guidance, not guaranteed prices.
        </p>
      </div>
    </article>
  );
}

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BudgetBreakdownItem, Currency } from "@/types/trip";

type BudgetBreakdownProps = {
  items: BudgetBreakdownItem[];
  currency: Currency;
  className?: string;
};

export function BudgetBreakdown({
  items,
  currency,
  className,
}: BudgetBreakdownProps) {
  return (
    <section className={cn("surface-card p-5 sm:p-6", className)}>
      <h3 className="section-title text-foreground text-base">
        Budget breakdown
      </h3>
      <ul className="mt-4 space-y-3.5">
        {items.map((item) => (
          <li key={item.category}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.category}</span>
              <span className="text-foreground font-medium">
                {formatCurrency(item.amount, currency)}
              </span>
            </div>
            <div className="bg-secondary h-2 overflow-hidden rounded-full">
              <div
                className="from-brand to-brand/60 h-full rounded-full bg-gradient-to-r"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

import type { LucideIcon } from "lucide-react";
import { MapPinned } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
  compact?: boolean;
};

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = MapPinned,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "surface-card flex flex-col items-center text-center",
        compact ? "px-5 py-10" : "px-6 py-14 sm:py-16",
        className,
      )}
    >
      <div className={cn("relative", compact ? "mb-4" : "mb-6")}>
        <div className="from-brand/20 via-accent to-secondary absolute inset-0 scale-125 rounded-full bg-gradient-to-br blur-2xl" />
        <div
          className={cn(
            "border-border/80 bg-card relative flex items-center justify-center rounded-2xl border shadow-[var(--shadow-soft)]",
            compact ? "size-14" : "size-20 sm:size-24",
          )}
        >
          <Icon
            className={cn("text-brand", compact ? "size-6" : "size-8 sm:size-9")}
            strokeWidth={1.5}
          />
        </div>
      </div>
      <h2
        className={cn(
          "section-title text-foreground",
          compact ? "text-xl" : "text-2xl sm:text-3xl",
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "section-copy mt-2 max-w-md sm:mt-3",
          compact && "text-xs",
        )}
      >
        {description}
      </p>
      {action ? (
        <div className={cn(compact ? "mt-5" : "mt-7")}>{action}</div>
      ) : null}
    </div>
  );
}

import type { ReactNode } from "react";
import { MapPinned } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "surface-card flex flex-col items-center px-6 py-16 text-center",
        className,
      )}
    >
      <div className="relative mb-6">
        <div className="from-brand/20 via-accent to-secondary absolute inset-0 scale-125 rounded-full bg-gradient-to-br blur-2xl" />
        <div className="border-border/80 bg-card relative flex size-24 items-center justify-center rounded-[2rem] border shadow-[var(--shadow-soft)]">
          <MapPinned className="text-brand size-9" strokeWidth={1.5} />
          <div className="bg-brand/15 absolute -top-2 -right-2 size-8 rounded-full" />
          <div className="bg-secondary absolute -bottom-1 -left-3 size-6 rounded-full" />
        </div>
      </div>
      <h2 className="font-heading text-foreground text-3xl tracking-tight">
        {title}
      </h2>
      <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed">
        {description}
      </p>
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}

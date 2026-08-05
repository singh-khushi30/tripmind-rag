"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Something went sideways",
  description = "We couldn’t load this trip preview. Please try again in a moment.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "surface-card mx-auto flex w-full max-w-lg flex-col items-center px-6 py-12 text-center",
        className,
      )}
    >
      <div className="bg-destructive/10 text-destructive mb-5 flex size-14 items-center justify-center rounded-2xl">
        <AlertTriangle className="size-6" strokeWidth={1.75} />
      </div>
      <h2 className="font-heading text-foreground text-3xl tracking-tight">
        {title}
      </h2>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        {description}
      </p>
      {onRetry ? (
        <Button className="mt-7" onClick={onRetry}>
          <RotateCcw data-icon="inline-start" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

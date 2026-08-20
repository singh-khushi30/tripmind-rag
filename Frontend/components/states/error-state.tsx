"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
};

export function ErrorState({
  title = "Something went sideways",
  description = "We couldn’t load this right now. Please try again in a moment.",
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "surface-card mx-auto flex w-full max-w-lg flex-col items-center px-6 py-12 text-center sm:py-14",
        className,
      )}
      role="alert"
    >
      <div className="bg-destructive/10 text-destructive mb-5 flex size-14 items-center justify-center rounded-2xl">
        <AlertTriangle className="size-6" strokeWidth={1.75} aria-hidden />
      </div>
      <h2 className="section-title text-foreground text-2xl sm:text-3xl">
        {title}
      </h2>
      <p className="section-copy mt-3 max-w-sm">{description}</p>
      {onRetry ? (
        <Button className="mt-7" onClick={onRetry}>
          <RotateCcw data-icon="inline-start" />
          Try again
        </Button>
      ) : action ? (
        <div className="mt-7">{action}</div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

const STATUS_MESSAGES = [
  "Understanding your travel preferences",
  "Planning realistic daily routes",
  "Balancing activities with your budget",
  "Building your personalized itinerary",
] as const;

type GenerationStatusProps = {
  active: boolean;
};

export function GenerationStatus({ active }: GenerationStatusProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % STATUS_MESSAGES.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [active]);

  if (!active) return null;

  const messageIndex = index % STATUS_MESSAGES.length;

  return (
    <div
      className="border-border/80 bg-secondary/50 flex items-start gap-3 rounded-2xl border px-4 py-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoaderCircle className="text-brand mt-0.5 size-5 shrink-0 animate-spin" />
      <div className="space-y-1">
        <p className="text-foreground text-sm font-medium">
          Generating your itinerary
        </p>
        <p className="text-muted-foreground text-sm">
          {STATUS_MESSAGES[messageIndex]}
        </p>
      </div>
    </div>
  );
}

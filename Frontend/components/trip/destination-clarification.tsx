"use client";

import type {
  DestinationAnalysis,
  DestinationSuggestion,
} from "@/lib/destinations/broad-destination";
import { Button } from "@/components/ui/button";

type DestinationClarificationProps = {
  analysis: DestinationAnalysis;
  onSelect: (suggestion: DestinationSuggestion) => void;
  onDismiss: () => void;
};

export function DestinationClarification({
  analysis,
  onSelect,
  onDismiss,
}: DestinationClarificationProps) {
  return (
    <div
      role="region"
      aria-label="Clarify destination"
      className="border-border/80 bg-secondary/40 space-y-4 rounded-2xl border px-4 py-4"
    >
      <div className="space-y-1">
        <p className="text-foreground text-sm font-medium">
          “{analysis.matchedLabel ?? "This destination"}” is too broad
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Choose a specific city, a smaller region, or a multi-city plan before
          we generate your itinerary.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {analysis.suggestions.map((suggestion) => (
          <Button
            key={`${suggestion.scope}-${suggestion.label}`}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion.label}
          </Button>
        ))}
      </div>

      <button
        type="button"
        className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
        onClick={onDismiss}
      >
        Keep editing destination
      </button>
    </div>
  );
}

import { BookOpen, ExternalLink } from "lucide-react";

import { InlineEmpty } from "@/components/states/inline-empty";
import { dedupeCitationsBySourceId } from "@/lib/trip/dedupe-sources";
import type { TripCitationSource } from "@/types/trip";

const SOURCE_LABEL = {
  wikipedia: "Wikipedia",
  wikivoyage: "Wikivoyage",
} as const;

type SourcesUsedPanelProps = {
  citations: TripCitationSource[];
};

function formatFetchedAt(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SourcesUsedPanel({ citations }: SourcesUsedPanelProps) {
  if (citations.length === 0) {
    return (
      <InlineEmpty
        icon={BookOpen}
        title="No citations yet"
        description="When TripMind retrieves Wikipedia or Wikivoyage pages for this trip, they’ll appear here."
      />
    );
  }

  const sources = dedupeCitationsBySourceId(citations);

  return (
    <section className="border-border/80 bg-secondary/30 rounded-2xl border px-4 py-4">
      <h2 className="section-title text-foreground text-lg">Sources used</h2>
      <p className="section-copy mt-1">
        Factual place and planning details come from these retrieved pages.
        Prices remain AI estimates.
      </p>
      <ul className="mt-4 space-y-3">
        {sources.map((source) => {
          const fetched = formatFetchedAt(source.fetched_at);
          return (
            <li
              key={source.travel_source_id || source.source_url}
              className="text-sm"
            >
              <a
                href={source.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-brand inline-flex items-start gap-1.5 font-medium underline-offset-2 transition-colors hover:underline focus-visible:ring-ring/50 rounded-sm focus-visible:ring-3 focus-visible:outline-none"
              >
                <span>{source.source_title}</span>
                <ExternalLink
                  className="mt-0.5 size-3.5 shrink-0 opacity-70"
                  aria-hidden
                />
              </a>
              <p className="text-muted-foreground mt-0.5">
                {SOURCE_LABEL[source.source_type]}
                {fetched ? ` · Fetched ${fetched}` : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

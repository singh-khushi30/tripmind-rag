import { ExternalLink } from "lucide-react";

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
  if (citations.length === 0) return null;

  const unique = new Map<string, TripCitationSource>();
  for (const citation of citations) {
    const key = `${citation.source_url}|${citation.section_title ?? ""}`;
    if (!unique.has(key)) unique.set(key, citation);
  }

  const sources = Array.from(unique.values());

  return (
    <section className="border-border/80 bg-secondary/30 rounded-2xl border px-4 py-4">
      <h2 className="font-heading text-foreground text-lg tracking-tight">
        Sources used
      </h2>
      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
        Factual place and planning details come from these retrieved pages.
        Prices remain AI estimates.
      </p>
      <ul className="mt-4 space-y-3">
        {sources.map((source) => {
          const fetched = formatFetchedAt(source.fetched_at);
          return (
            <li
              key={`${source.citation_key}-${source.source_url}-${source.section_title ?? ""}`}
              className="text-sm"
            >
              <a
                href={source.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-brand inline-flex items-start gap-1.5 font-medium underline-offset-2 hover:underline"
              >
                <span>{source.source_title}</span>
                <ExternalLink className="mt-0.5 size-3.5 shrink-0 opacity-70" />
              </a>
              <p className="text-muted-foreground mt-0.5">
                {SOURCE_LABEL[source.source_type]}
                {source.section_title ? ` · ${source.section_title}` : ""}
                {fetched ? ` · Fetched ${fetched}` : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

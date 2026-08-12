"use client";

import { ExternalLink } from "lucide-react";

import type { TripCitationSource } from "@/types/trip";

const SOURCE_LABEL = {
  wikipedia: "Wikipedia",
  wikivoyage: "Wikivoyage",
} as const;

type ActivitySourcesProps = {
  citationIds: string[];
  citationsByKey: Map<string, TripCitationSource>;
};

export function ActivitySources({
  citationIds,
  citationsByKey,
}: ActivitySourcesProps) {
  const sources = citationIds
    .map((id) => citationsByKey.get(id))
    .filter((source): source is TripCitationSource => Boolean(source));

  if (sources.length === 0) return null;

  return (
    <details className="mt-4">
      <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium tracking-[0.08em] uppercase">
        Sources ({sources.length})
      </summary>
      <ul className="mt-2 space-y-2">
        {sources.map((source) => (
          <li key={`${source.citation_key}-${source.source_url}`}>
            <a
              href={source.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-brand inline-flex items-start gap-1.5 text-sm leading-snug underline-offset-2 hover:underline"
            >
              <span>
                {source.source_title}
                <span className="text-muted-foreground">
                  {" "}
                  · {SOURCE_LABEL[source.source_type]}
                  {source.section_title ? ` · ${source.section_title}` : ""}
                </span>
              </span>
              <ExternalLink className="mt-0.5 size-3.5 shrink-0 opacity-70" />
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

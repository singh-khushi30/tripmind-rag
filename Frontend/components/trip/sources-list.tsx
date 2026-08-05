import { BookOpen, Building2, FileText, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TripSource } from "@/types/trip";

const SOURCE_ICON = {
  official: Building2,
  guide: BookOpen,
  review: Star,
  blog: FileText,
} as const;

type SourcesListProps = {
  sources: TripSource[];
  className?: string;
};

export function SourcesList({ sources, className }: SourcesListProps) {
  return (
    <section className={cn("surface-card p-5", className)}>
      <h3 className="text-foreground text-sm font-medium tracking-tight">
        Sources used
      </h3>
      <ul className="mt-4 space-y-3">
        {sources.map((source) => {
          const Icon = SOURCE_ICON[source.type];
          return (
            <li
              key={source.id}
              className="border-border/70 flex items-start gap-3 rounded-2xl border bg-white/50 p-3"
            >
              <div className="bg-secondary text-brand flex size-9 shrink-0 items-center justify-center rounded-xl">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">
                  {source.title}
                </p>
                <p className="text-muted-foreground text-xs">
                  {source.publisher}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {source.type}
              </Badge>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

type InlineEmptyProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  className?: string;
};

/** Compact empty/missing-data panel for sidebars and trip metadata. */
export function InlineEmpty({
  title,
  description,
  icon: Icon = Inbox,
  className,
}: InlineEmptyProps) {
  return (
    <div
      className={cn(
        "border-border/80 bg-secondary/30 flex items-start gap-3 rounded-2xl border px-4 py-3.5",
        className,
      )}
      role="status"
    >
      <div className="bg-card text-brand flex size-9 shrink-0 items-center justify-center rounded-xl border border-black/5 shadow-[var(--shadow-soft)]">
        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-foreground text-sm font-medium tracking-tight">
          {title}
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

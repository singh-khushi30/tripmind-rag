import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
};

export function FeatureCard({
  title,
  description,
  icon: Icon,
  className,
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        "surface-card group p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className="bg-secondary text-brand mb-5 flex size-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105">
        <Icon className="size-5" strokeWidth={1.75} />
      </div>
      <h3 className="text-foreground text-lg font-medium tracking-tight">
        {title}
      </h3>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {description}
      </p>
    </article>
  );
}

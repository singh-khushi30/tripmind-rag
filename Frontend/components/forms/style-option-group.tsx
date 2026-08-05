"use client";

import { cn } from "@/lib/utils";
import type { TravelStyle } from "@/types/trip";

type StyleOption = {
  value: TravelStyle;
  label: string;
  description: string;
};

type StyleOptionGroupProps = {
  id: string;
  value: TravelStyle;
  options: StyleOption[];
  onChange: (value: TravelStyle) => void;
  error?: string;
};

export function StyleOptionGroup({
  id,
  value,
  options,
  onChange,
  error,
}: StyleOptionGroupProps) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-labelledby={`${id}-label`}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className="grid gap-3 sm:grid-cols-2"
    >
      {options.map((style) => {
        const selected = value === style.value;
        return (
          <button
            key={style.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(style.value)}
            className={cn(
              "rounded-2xl border px-4 py-3.5 text-left transition-all focus-visible:ring-ring focus-visible:ring-3 focus-visible:outline-none",
              selected
                ? "border-brand bg-accent/70 shadow-[var(--shadow-soft)]"
                : "border-border hover:bg-secondary/80 bg-white/50",
            )}
          >
            <p className="text-foreground text-sm font-medium">{style.label}</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {style.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

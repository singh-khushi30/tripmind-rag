"use client";

import { cn } from "@/lib/utils";
import type { Interest } from "@/types/trip";

type InterestOption = {
  value: Interest;
  label: string;
};

type InterestChipGroupProps = {
  id: string;
  values: Interest[];
  options: InterestOption[];
  onChange: (values: Interest[]) => void;
  error?: string;
};

export function InterestChipGroup({
  id,
  values,
  options,
  onChange,
  error,
}: InterestChipGroupProps) {
  function toggle(interest: Interest) {
    const next = values.includes(interest)
      ? values.filter((item) => item !== interest)
      : [...values, interest];
    onChange(next);
  }

  return (
    <div
      id={id}
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={error ? `${id}-error` : undefined}
      className="flex flex-wrap gap-2"
    >
      {options.map((interest) => {
        const active = values.includes(interest.value);
        return (
          <button
            key={interest.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(interest.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-all focus-visible:ring-ring focus-visible:ring-3 focus-visible:outline-none",
              active
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            {interest.label}
          </button>
        );
      })}
    </div>
  );
}

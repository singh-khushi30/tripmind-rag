"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  CURRENCIES,
  FOOD_PREFERENCES,
  INTERESTS,
  TRAVEL_PACES,
  TRAVEL_STYLES,
} from "@/data/mock/planner-options";
import {
  tripPlannerSchema,
  type TripPlannerSchema,
} from "@/lib/planner-schema";
import { cn } from "@/lib/utils";
import type { Interest, TravelStyle } from "@/types/trip";

const DEFAULT_VALUES: TripPlannerSchema = {
  destination: "Kyoto, Japan",
  days: 5,
  budget: 3200,
  currency: "USD",
  travelers: 2,
  travelStyle: "mid-range",
  interests: ["culture", "food", "photography"],
  pace: "moderate",
  foodPreference: "local",
  specialNotes: "Prefer quieter mornings and walkable neighborhoods.",
};

export function PlannerForm() {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TripPlannerSchema>({
    resolver: zodResolver(tripPlannerSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const selectedInterests = useWatch({ control, name: "interests" });
  const selectedStyle = useWatch({ control, name: "travelStyle" });
  const days = useWatch({ control, name: "days" });
  const budget = useWatch({ control, name: "budget" });

  function toggleInterest(interest: Interest) {
    const next = selectedInterests.includes(interest)
      ? selectedInterests.filter((item) => item !== interest)
      : [...selectedInterests, interest];
    setValue("interests", next, { shouldValidate: true });
  }

  function onSubmit() {
    router.push("/results");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="surface-card space-y-8 p-6 sm:p-8"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="Destination"
          error={errors.destination?.message}
          className="md:col-span-2"
        >
          <Input
            placeholder="Where are you going?"
            className="h-11"
            {...register("destination")}
          />
        </Field>

        <Field label={`Number of days · ${days}`}>
          <Controller
            control={control}
            name="days"
            render={({ field }) => (
              <div className="space-y-3 pt-2">
                <Slider
                  min={1}
                  max={21}
                  value={[field.value]}
                  onValueChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    field.onChange(next ?? 1);
                  }}
                />
                <Input
                  type="number"
                  min={1}
                  max={30}
                  className="h-11"
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value) || 1)
                  }
                />
              </div>
            )}
          />
        </Field>

        <Field
          label={`Budget · ${budget.toLocaleString()}`}
          error={errors.budget?.message}
        >
          <Controller
            control={control}
            name="budget"
            render={({ field }) => (
              <div className="space-y-3 pt-2">
                <Slider
                  min={100}
                  max={15000}
                  step={50}
                  value={[field.value]}
                  onValueChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    field.onChange(next ?? 100);
                  }}
                />
                <Input
                  type="number"
                  min={100}
                  className="h-11"
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value) || 100)
                  }
                />
              </div>
            )}
          />
        </Field>

        <Field label="Currency">
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field label="Travelers" error={errors.travelers?.message}>
          <Controller
            control={control}
            name="travelers"
            render={({ field }) => (
              <Input
                type="number"
                min={1}
                max={12}
                className="h-11"
                value={field.value}
                onChange={(event) =>
                  field.onChange(Number(event.target.value) || 1)
                }
              />
            )}
          />
        </Field>
      </div>

      <Field label="Travel style" error={errors.travelStyle?.message}>
        <div className="grid gap-3 sm:grid-cols-2">
          {TRAVEL_STYLES.map((style) => (
            <button
              key={style.value}
              type="button"
              onClick={() =>
                setValue("travelStyle", style.value as TravelStyle, {
                  shouldValidate: true,
                })
              }
              className={cn(
                "rounded-2xl border px-4 py-3.5 text-left transition-all",
                selectedStyle === style.value
                  ? "border-brand bg-accent/70 shadow-[var(--shadow-soft)]"
                  : "border-border hover:bg-secondary/80 bg-white/50",
              )}
            >
              <p className="text-foreground text-sm font-medium">
                {style.label}
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                {style.description}
              </p>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Interests" error={errors.interests?.message}>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => {
            const active = selectedInterests.includes(interest.value);
            return (
              <button
                key={interest.value}
                type="button"
                onClick={() => toggleInterest(interest.value)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-all",
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
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Travel pace">
          <Controller
            control={control}
            name="pace"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRAVEL_PACES.map((pace) => (
                    <SelectItem key={pace.value} value={pace.value}>
                      {pace.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field label="Food preference">
          <Controller
            control={control}
            name="foodPreference"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOOD_PREFERENCES.map((pref) => (
                    <SelectItem key={pref.value} value={pref.value}>
                      {pref.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <Field label="Special notes">
        <Textarea
          rows={4}
          placeholder="Allergies, must-sees, accessibility needs…"
          className="min-h-28 resize-y"
          {...register("specialNotes")}
        />
      </Field>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full text-base"
        size="lg"
      >
        <Sparkles data-icon="inline-start" />
        Generate Trip
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}

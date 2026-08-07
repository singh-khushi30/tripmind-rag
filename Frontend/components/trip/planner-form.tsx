"use client";

import { useId, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, RotateCcw, Sparkles } from "lucide-react";

import { FormField } from "@/components/forms/form-field";
import { InterestChipGroup } from "@/components/forms/interest-chip-group";
import { StyleOptionGroup } from "@/components/forms/style-option-group";
import { DestinationClarification } from "@/components/trip/destination-clarification";
import { GenerationStatus } from "@/components/trip/generation-status";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { createTripAction } from "@/app/trips/actions";
import {
  CURRENCIES,
  FOOD_PREFERENCES,
  INTERESTS,
  TRAVEL_PACES,
  TRAVEL_STYLES,
} from "@/data/mock/planner-options";
import {
  analyzeDestination,
  requiresDestinationClarification,
  type DestinationAnalysis,
  type DestinationSuggestion,
} from "@/lib/destinations/broad-destination";
import { isNextRedirectError } from "@/lib/next/errors";
import {
  tripPlannerSchema,
  type TripPlannerSchema,
} from "@/lib/validation/trip-planner";
import type { TripPlannerFormValues } from "@/types/planner";

const DEFAULT_VALUES: TripPlannerFormValues = {
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
  destinationScope: "city",
  selectedCities: [],
  includeAccommodationInBudget: false,
  includeTransportToDestinationInBudget: false,
};

const RESET_VALUES: TripPlannerFormValues = {
  destination: "",
  days: 5,
  budget: 1000,
  currency: "USD",
  travelers: 2,
  travelStyle: "mid-range",
  interests: [],
  pace: "moderate",
  foodPreference: undefined,
  specialNotes: "",
  destinationScope: "city",
  selectedCities: [],
  includeAccommodationInBudget: false,
  includeTransportToDestinationInBudget: false,
};

export function PlannerForm() {
  const formId = useId();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [clarification, setClarification] =
    useState<DestinationAnalysis | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<TripPlannerSchema>({
    resolver: zodResolver(tripPlannerSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  const selectedInterests = useWatch({ control, name: "interests" }) ?? [];
  const selectedStyle = useWatch({ control, name: "travelStyle" }) ?? "mid-range";
  const days = useWatch({ control, name: "days" }) ?? 5;
  const budget = useWatch({ control, name: "budget" }) ?? 0;
  const specialNotes = useWatch({ control, name: "specialNotes" }) ?? "";
  const includeAccommodation =
    useWatch({ control, name: "includeAccommodationInBudget" }) ?? false;
  const includeTransport =
    useWatch({ control, name: "includeTransportToDestinationInBudget" }) ??
    false;
  const destinationScope =
    useWatch({ control, name: "destinationScope" }) ?? "city";
  const selectedCities = useWatch({ control, name: "selectedCities" }) ?? [];
  const busy = isSubmitting || isGenerating || isPending;

  function applyDestinationSuggestion(suggestion: DestinationSuggestion) {
    if (suggestion.scope === "city" && suggestion.label.startsWith("Choose")) {
      setClarification(null);
      setSubmitError("Enter a specific city in the destination field.");
      return;
    }

    if (
      suggestion.scope === "region" &&
      suggestion.label.startsWith("Focus on")
    ) {
      setClarification(null);
      setSubmitError("Enter a smaller region in the destination field.");
      return;
    }

    if (
      suggestion.scope === "multi_city" &&
      suggestion.label.startsWith("Plan a multi-city") &&
      !suggestion.cities?.length
    ) {
      setClarification(null);
      setSubmitError(
        "Enter the cities you want to visit, or pick a multi-city suggestion with named cities.",
      );
      return;
    }

    const nextDestination =
      suggestion.scope === "multi_city" && suggestion.cities?.length
        ? suggestion.cities.join(" → ")
        : suggestion.label;

    setValue("destination", nextDestination, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("destinationScope", suggestion.scope, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("selectedCities", suggestion.cities ?? [], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setClarification(null);
    setSubmitError(null);
  }

  function onSubmit(values: TripPlannerSchema) {
    if (busy) return;

    setSubmitError(null);

    if (
      requiresDestinationClarification(
        values.destination,
        values.destinationScope,
      )
    ) {
      setClarification(analyzeDestination(values.destination));
      setSubmitError(
        "This destination is too broad. Choose a city, region, or multi-city plan below.",
      );
      return;
    }

    setIsGenerating(true);

    startTransition(async () => {
      try {
        const result = await createTripAction(values);
        if (result?.error) {
          setSubmitError(result.error);
          setIsGenerating(false);
        }
        // Successful redirects never return — keep the generating state until navigation.
      } catch (error) {
        // redirect() from the server action throws NEXT_REDIRECT; that is success, not failure.
        if (isNextRedirectError(error)) {
          return;
        }

        setSubmitError(
          "We couldn’t generate your itinerary right now. Please try again.",
        );
        setIsGenerating(false);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="surface-card space-y-8 p-6 sm:p-8"
      noValidate
      aria-busy={busy}
      aria-describedby={submitError ? `${formId}-submit-error` : undefined}
    >
      <GenerationStatus active={busy} />

      {submitError ? (
        <div
          id={`${formId}-submit-error`}
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-2xl border px-4 py-3 text-sm"
        >
          {submitError}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          id={`${formId}-destination`}
          label="Destination"
          error={errors.destination?.message}
          required
          className="md:col-span-2"
        >
          <Input
            id={`${formId}-destination`}
            placeholder="Where are you going?"
            className="h-11"
            autoComplete="address-level2"
            aria-invalid={errors.destination ? true : undefined}
            aria-describedby={
              errors.destination ? `${formId}-destination-error` : undefined
            }
            {...register("destination", {
              onChange: () => {
                setClarification(null);
                setValue("destinationScope", "city");
                setValue("selectedCities", []);
              },
            })}
          />
          {(destinationScope !== "city" || selectedCities.length > 0) && (
            <p className="text-muted-foreground mt-2 text-xs">
              Scope: {destinationScope.replace("_", " ")}
              {selectedCities.length
                ? ` · Cities: ${selectedCities.join(", ")}`
                : null}
            </p>
          )}
        </FormField>

        {clarification ? (
          <div className="md:col-span-2">
            <DestinationClarification
              analysis={clarification}
              onSelect={applyDestinationSuggestion}
              onDismiss={() => setClarification(null)}
            />
          </div>
        ) : null}

        <FormField
          id={`${formId}-days`}
          label={`Number of days · ${Number.isFinite(days) ? days : "—"}`}
          error={errors.days?.message}
          required
        >
          <Controller
            control={control}
            name="days"
            render={({ field }) => (
              <div className="space-y-3 pt-2">
                <Slider
                  min={1}
                  max={14}
                  value={[Number.isFinite(field.value) ? field.value : 1]}
                  onValueChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    field.onChange(
                      Number.isFinite(next) ? Number(next) : 1,
                    );
                  }}
                  aria-label="Number of days"
                />
                <Input
                  id={`${formId}-days`}
                  type="number"
                  min={1}
                  max={14}
                  className="h-11"
                  value={Number.isFinite(field.value) ? field.value : ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    field.onChange(raw === "" ? NaN : Number(raw));
                  }}
                  onBlur={field.onBlur}
                  aria-invalid={errors.days ? true : undefined}
                  aria-describedby={
                    errors.days ? `${formId}-days-error` : undefined
                  }
                />
              </div>
            )}
          />
        </FormField>

        <FormField
          id={`${formId}-budget`}
          label={`Budget · ${Number.isFinite(budget) ? budget.toLocaleString() : "—"}`}
          error={errors.budget?.message}
          required
        >
          <Controller
            control={control}
            name="budget"
            render={({ field }) => (
              <div className="space-y-3 pt-2">
                <Slider
                  min={1}
                  max={15000}
                  step={50}
                  value={[
                    Number.isFinite(field.value)
                      ? Math.max(field.value, 1)
                      : 1,
                  ]}
                  onValueChange={(value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    field.onChange(
                      Number.isFinite(next) ? Number(next) : 1,
                    );
                  }}
                  aria-label="Budget amount"
                />
                <Input
                  id={`${formId}-budget`}
                  type="number"
                  min={1}
                  className="h-11"
                  value={Number.isFinite(field.value) ? field.value : ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    field.onChange(raw === "" ? NaN : Number(raw));
                  }}
                  onBlur={field.onBlur}
                  aria-invalid={errors.budget ? true : undefined}
                  aria-describedby={
                    errors.budget ? `${formId}-budget-error` : undefined
                  }
                />
              </div>
            )}
          />
        </FormField>

        <FormField
          id={`${formId}-currency`}
          label="Currency"
          error={errors.currency?.message}
          required
        >
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id={`${formId}-currency`}
                  className="h-11 w-full"
                  aria-invalid={errors.currency ? true : undefined}
                  aria-describedby={
                    errors.currency ? `${formId}-currency-error` : undefined
                  }
                >
                  <SelectValue placeholder="Select currency" />
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
        </FormField>

        <FormField
          id={`${formId}-travelers`}
          label="Travelers"
          error={errors.travelers?.message}
          required
        >
          <Controller
            control={control}
            name="travelers"
            render={({ field }) => (
              <Input
                id={`${formId}-travelers`}
                type="number"
                min={1}
                max={10}
                className="h-11"
                value={Number.isFinite(field.value) ? field.value : ""}
                onChange={(event) => {
                  const raw = event.target.value;
                  field.onChange(raw === "" ? NaN : Number(raw));
                }}
                onBlur={field.onBlur}
                aria-invalid={errors.travelers ? true : undefined}
                aria-describedby={
                  errors.travelers ? `${formId}-travelers-error` : undefined
                }
              />
            )}
          />
        </FormField>
      </div>

      <FormField
        id={`${formId}-travel-style`}
        label="Travel style"
        error={errors.travelStyle?.message}
        required
      >
        <span id={`${formId}-travel-style-label`} className="sr-only">
          Travel style
        </span>
        <StyleOptionGroup
          id={`${formId}-travel-style`}
          value={selectedStyle}
          options={TRAVEL_STYLES}
          error={errors.travelStyle?.message}
          onChange={(value) =>
            setValue("travelStyle", value, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        />
      </FormField>

      <FormField
        id={`${formId}-interests`}
        label="Interests"
        error={errors.interests?.message}
        required
      >
        <span id={`${formId}-interests-label`} className="sr-only">
          Interests
        </span>
        <InterestChipGroup
          id={`${formId}-interests`}
          values={selectedInterests}
          options={INTERESTS}
          error={errors.interests?.message}
          onChange={(values) =>
            setValue("interests", values, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        />
      </FormField>

      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          id={`${formId}-pace`}
          label="Travel pace"
          error={errors.pace?.message}
          required
        >
          <Controller
            control={control}
            name="pace"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={`${formId}-pace`}
                  className="h-11 w-full"
                  aria-invalid={errors.pace ? true : undefined}
                  aria-describedby={
                    errors.pace ? `${formId}-pace-error` : undefined
                  }
                >
                  <SelectValue placeholder="Select pace" />
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
        </FormField>

        <FormField
          id={`${formId}-food`}
          label="Food preference"
          error={errors.foodPreference?.message}
          description="Optional"
        >
          <Controller
            control={control}
            name="foodPreference"
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={(value) =>
                  field.onChange(value === "" ? undefined : value)
                }
              >
                <SelectTrigger
                  id={`${formId}-food`}
                  className="h-11 w-full"
                  aria-invalid={errors.foodPreference ? true : undefined}
                  aria-describedby={
                    [
                      `${formId}-food-description`,
                      errors.foodPreference
                        ? `${formId}-food-error`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                >
                  <SelectValue placeholder="Select preference" />
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
        </FormField>
      </div>

      <FormField
        id={`${formId}-notes`}
        label="Special notes"
        error={errors.specialNotes?.message}
        description={`${specialNotes.length}/500 characters`}
      >
        <Textarea
          id={`${formId}-notes`}
          rows={4}
          placeholder="Allergies, must-sees, accessibility needs…"
          className="min-h-28 resize-y"
          maxLength={500}
          aria-invalid={errors.specialNotes ? true : undefined}
          aria-describedby={
            [
              `${formId}-notes-description`,
              errors.specialNotes ? `${formId}-notes-error` : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          {...register("specialNotes")}
        />
      </FormField>

      <section className="border-border/70 space-y-4 rounded-2xl border px-4 py-4">
        <div>
          <h3 className="text-foreground text-sm font-medium">
            What your budget covers
          </h3>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Costs are approximate estimates in {getValues("currency")}. Live
            exchange rates are not applied.
          </p>
        </div>

        <ul className="text-muted-foreground space-y-1 text-sm">
          <li>Food & dining — included</li>
          <li>Activities & attractions — included</li>
          <li>Local transportation — included</li>
          <li>
            Accommodation —{" "}
            {includeAccommodation ? "included" : "not included"}
          </li>
          <li>
            Flights / long-distance transport to destination —{" "}
            {includeTransport ? "included" : "not included"}
          </li>
        </ul>

        <div className="space-y-3">
          <label className="flex items-start gap-3 text-sm">
            <Controller
              control={control}
              name="includeAccommodationInBudget"
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  className="mt-0.5"
                />
              )}
            />
            <span>
              Include accommodation in this budget
              <span className="text-muted-foreground mt-0.5 block text-xs">
                Leave unchecked if lodging is booked separately.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm">
            <Controller
              control={control}
              name="includeTransportToDestinationInBudget"
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  className="mt-0.5"
                />
              )}
            />
            <span>
              Include flights or long-distance transport to the destination
              <span className="text-muted-foreground mt-0.5 block text-xs">
                Local transit stays included either way.
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          disabled={busy}
          className="h-12 flex-1 text-base"
          size="lg"
          aria-busy={busy}
        >
          {busy ? (
            <LoaderCircle
              data-icon="inline-start"
              className="animate-spin"
            />
          ) : (
            <Sparkles data-icon="inline-start" />
          )}
          {busy ? "Generating trip…" : "Generate Trip"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 sm:w-40"
          size="lg"
          disabled={busy}
          onClick={() => {
            if (busy) return;
            setSubmitError(null);
            setClarification(null);
            reset(RESET_VALUES);
          }}
        >
          <RotateCcw data-icon="inline-start" />
          Reset
        </Button>
      </div>
    </form>
  );
}

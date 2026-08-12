import { z } from "zod";

export const budgetStatusSchema = z.enum([
  "within_budget",
  "near_budget",
  "over_budget",
]);

export const conversionStatusSchema = z.enum([
  "not_required",
  "estimated",
  "unavailable",
]);

export const indoorOutdoorSchema = z.enum(["indoor", "outdoor", "mixed"]);

export const itineraryActivitySchema = z.object({
  start_time: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  estimated_cost: z.number().finite().nonnegative(),
  duration_minutes: z.number().finite().int().positive(),
  location_name: z.string().min(1),
  neighborhood: z.string().nullable(),
  indoor_outdoor: indoorOutdoorSchema,
  reservation_required: z.boolean(),
  notes: z.string().nullable(),
  citation_ids: z.array(z.string().min(1)).optional(),
});

export const itineraryDaySchema = z.object({
  day_number: z.number().finite().int().positive(),
  title: z.string().min(1),
  summary: z.string().min(1),
  estimated_day_cost: z.number().finite().nonnegative(),
  activities: z.array(itineraryActivitySchema).min(1),
});

export const budgetTotalsSchema = z.object({
  activity_total: z.number().finite().nonnegative(),
  day_total: z.number().finite().nonnegative(),
  calculated_total: z.number().finite().nonnegative(),
  cost_per_traveler: z.number().finite().nonnegative(),
  remaining_budget: z.number().finite(),
  percentage_used: z.number().finite().nonnegative(),
});

export const itineraryDataSchema = z.object({
  destination: z.string().min(1),
  country: z.string().nullable(),
  summary: z.string().min(1),
  currency: z.string().min(1),
  display_currency: z.string().min(1).optional(),
  destination_local_currency: z.string().nullable().optional(),
  conversion_status: conversionStatusSchema.optional(),
  estimated_total_cost: z.number().finite().nonnegative(),
  budget_status: budgetStatusSchema,
  budget_totals: budgetTotalsSchema.optional(),
  days: z.array(itineraryDaySchema).min(1),
  grounding: z
    .object({
      destination_key: z.string(),
      source_count: z.number().int().nonnegative(),
      citation_keys: z.array(z.string()),
    })
    .optional(),
});

/** Schema sent to Gemini — omit app-computed fields. */
export const geminiItineraryResponseSchema = itineraryDataSchema
  .omit({
    budget_totals: true,
    grounding: true,
  })
  .extend({
    days: z.array(
      itineraryDaySchema.extend({
        activities: z
          .array(
            itineraryActivitySchema.extend({
              citation_ids: z.array(z.string().min(1)).min(1),
            }),
          )
          .min(1),
      }),
    ),
  });

export type BudgetStatus = z.infer<typeof budgetStatusSchema>;
export type ConversionStatus = z.infer<typeof conversionStatusSchema>;
export type IndoorOutdoor = z.infer<typeof indoorOutdoorSchema>;
export type ItineraryActivity = z.infer<typeof itineraryActivitySchema>;
export type ItineraryDay = z.infer<typeof itineraryDaySchema>;
export type BudgetTotals = z.infer<typeof budgetTotalsSchema>;
export type ItineraryData = z.infer<typeof itineraryDataSchema>;

/** JSON Schema for Gemini structured output (no $schema metadata). */
export function getItineraryJsonSchema() {
  const schema = geminiItineraryResponseSchema.toJSONSchema() as Record<
    string,
    unknown
  >;
  const rest = { ...schema };
  delete rest.$schema;
  return rest;
}

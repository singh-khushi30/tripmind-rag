import { z } from "zod";

const interestEnum = z.enum([
  "food",
  "nature",
  "culture",
  "adventure",
  "nightlife",
  "shopping",
  "photography",
  "history",
]);

const foodPreferenceEnum = z.enum([
  "any",
  "vegetarian",
  "vegan",
  "halal",
  "kosher",
  "local",
]);

const destinationScopeEnum = z.enum([
  "city",
  "region",
  "country",
  "multi_city",
]);

export const tripPlannerSchema = z.object({
  destination: z
    .string()
    .trim()
    .min(1, "Destination is required")
    .min(2, "Destination must be at least 2 characters"),
  startDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD")
    .nullable()
    .optional(),
  days: z
    .number({ error: "Number of days is required" })
    .int("Days must be a whole number")
    .min(1, "Days must be at least 1")
    .max(14, "Days cannot exceed 14"),
  budget: z
    .number({ error: "Budget is required" })
    .gt(0, "Budget must be greater than 0"),
  currency: z.enum(["USD", "EUR", "GBP", "INR", "JPY"], {
    error: "Currency is required",
  }),
  travelers: z
    .number({ error: "Travelers is required" })
    .int("Travelers must be a whole number")
    .min(1, "At least 1 traveler is required")
    .max(10, "Travelers cannot exceed 10"),
  travelStyle: z.enum(["luxury", "mid-range", "budget", "backpacking"], {
    error: "Travel style is required",
  }),
  interests: z.array(interestEnum).min(1, "Choose at least one interest"),
  pace: z.enum(["relaxed", "moderate", "packed"], {
    error: "Travel pace is required",
  }),
  foodPreference: foodPreferenceEnum.optional(),
  specialNotes: z
    .string()
    .max(500, "Special notes cannot exceed 500 characters")
    .optional(),
  destinationScope: destinationScopeEnum,
  selectedCities: z.array(z.string().trim().min(1)),
  includeAccommodationInBudget: z.boolean(),
  includeTransportToDestinationInBudget: z.boolean(),
});

export type TripPlannerSchema = z.infer<typeof tripPlannerSchema>;

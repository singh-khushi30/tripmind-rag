import { z } from "zod";

export const tripPlannerSchema = z.object({
  destination: z.string().min(2, "Enter a destination"),
  days: z.number().min(1).max(30),
  budget: z.number().min(100, "Budget should be at least 100"),
  currency: z.enum(["USD", "EUR", "GBP", "INR", "JPY"]),
  travelers: z.number().min(1).max(12),
  travelStyle: z.enum(["luxury", "mid-range", "budget", "backpacking"]),
  interests: z
    .array(
      z.enum([
        "food",
        "nature",
        "culture",
        "adventure",
        "nightlife",
        "shopping",
        "photography",
        "history",
      ]),
    )
    .min(1, "Pick at least one interest"),
  pace: z.enum(["relaxed", "moderate", "packed"]),
  foodPreference: z.enum([
    "any",
    "vegetarian",
    "vegan",
    "halal",
    "kosher",
    "local",
  ]),
  specialNotes: z.string().max(500),
});

export type TripPlannerSchema = z.infer<typeof tripPlannerSchema>;

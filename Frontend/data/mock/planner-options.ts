import type {
  Currency,
  FoodPreference,
  Interest,
  TravelPace,
  TravelStyle,
} from "@/types/trip";

export const TRAVEL_STYLES: {
  value: TravelStyle;
  label: string;
  description: string;
}[] = [
  {
    value: "luxury",
    label: "Luxury",
    description: "Refined stays and elevated dining",
  },
  {
    value: "mid-range",
    label: "Mid-range",
    description: "Comfort with thoughtful value",
  },
  {
    value: "budget",
    label: "Budget",
    description: "Smart picks without the fluff",
  },
  {
    value: "backpacking",
    label: "Backpacking",
    description: "Light, flexible, adventure-first",
  },
];

export const INTERESTS: { value: Interest; label: string }[] = [
  { value: "food", label: "Food" },
  { value: "nature", label: "Nature" },
  { value: "culture", label: "Culture" },
  { value: "adventure", label: "Adventure" },
  { value: "nightlife", label: "Nightlife" },
  { value: "shopping", label: "Shopping" },
  { value: "photography", label: "Photography" },
  { value: "history", label: "History" },
];

export const TRAVEL_PACES: { value: TravelPace; label: string }[] = [
  { value: "relaxed", label: "Relaxed" },
  { value: "moderate", label: "Moderate" },
  { value: "packed", label: "Packed" },
];

export const FOOD_PREFERENCES: { value: FoodPreference; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "local", label: "Local cuisine" },
];

export const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "INR", label: "INR" },
  { value: "JPY", label: "JPY" },
];

export const FEATURES = [
  {
    title: "Source-grounded plans",
    description:
      "Every stop cites guides, reviews, and official notes — so recommendations feel trustworthy, not invented.",
    icon: "Sparkles",
  },
  {
    title: "Budget-aware itineraries",
    description:
      "Set a ceiling once. TripMind balances stays, food, and activities without blowing the plan.",
    icon: "Wallet",
  },
  {
    title: "Day-by-day clarity",
    description:
      "A calm timeline with timing, cost, and pace — ready to follow or tweak as you go.",
    icon: "CalendarDays",
  },
  {
    title: "Personal by design",
    description:
      "Interests, travel style, and food preferences shape a trip that actually feels like yours.",
    icon: "Compass",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Share your trip brief",
    description:
      "Destination, days, budget, and the vibe you want — nothing more than a focused form.",
  },
  {
    step: "02",
    title: "Review a grounded plan",
    description:
      "See a day timeline with costs, categories, and the sources behind each suggestion.",
  },
  {
    step: "03",
    title: "Save and refine",
    description:
      "Keep trips in your dashboard, revisit later, and adjust when plans change.",
  },
] as const;

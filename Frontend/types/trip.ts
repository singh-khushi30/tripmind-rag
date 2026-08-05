export type TravelStyle = "luxury" | "mid-range" | "budget" | "backpacking";

export type TravelPace = "relaxed" | "moderate" | "packed";

export type Interest =
  | "food"
  | "nature"
  | "culture"
  | "adventure"
  | "nightlife"
  | "shopping"
  | "photography"
  | "history";

export type FoodPreference =
  "any" | "vegetarian" | "vegan" | "halal" | "kosher" | "local";

export type Currency = "USD" | "EUR" | "GBP" | "INR" | "JPY";

export type TripActivity = {
  id: string;
  time: string;
  title: string;
  description: string;
  estimatedCost: number;
  currency: Currency;
  duration: string;
  category: string;
  source: string;
};

export type TripDay = {
  day: number;
  title: string;
  dateLabel: string;
  activities: TripActivity[];
};

export type BudgetBreakdownItem = {
  category: string;
  amount: number;
  percentage: number;
};

export type TripSource = {
  id: string;
  title: string;
  publisher: string;
  type: "guide" | "review" | "official" | "blog";
};

export type TripResult = {
  id: string;
  destination: string;
  country: string;
  summary: string;
  days: number;
  travelers: number;
  travelStyle: TravelStyle;
  pace: TravelPace;
  interests: Interest[];
  budget: {
    total: number;
    currency: Currency;
    perPerson: number;
    breakdown: BudgetBreakdownItem[];
  };
  itinerary: TripDay[];
  sources: TripSource[];
  map: {
    label: string;
    lat: number;
    lng: number;
  };
};

export type SavedTrip = {
  id: string;
  destination: string;
  date: string;
  budget: number;
  currency: Currency;
  days: number;
  coverTone: "teal" | "slate" | "sand" | "mist";
  imageKey: "kyoto" | "lisbon" | "reykjavik" | "marrakech";
};

export type TripPlannerFormValues = {
  destination: string;
  days: number;
  budget: number;
  currency: Currency;
  travelers: number;
  travelStyle: TravelStyle;
  interests: Interest[];
  pace: TravelPace;
  foodPreference: FoodPreference;
  specialNotes: string;
};

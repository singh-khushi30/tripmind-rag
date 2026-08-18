import type {
  BudgetStatus,
  ConversionStatus,
  ItineraryActivity,
  ItineraryData,
  ItineraryDay,
} from "@/lib/gemini/schema";

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
  | "any"
  | "vegetarian"
  | "vegan"
  | "halal"
  | "kosher"
  | "local";

export type Currency = "USD" | "EUR" | "GBP" | "INR" | "JPY";

export type {
  BudgetStatus,
  ConversionStatus,
  ItineraryActivity,
  ItineraryData,
  ItineraryDay,
};

/** @deprecated Prefer ItineraryActivity — kept as alias for UI components. */
export type TripActivity = ItineraryActivity;

/** @deprecated Prefer ItineraryDay — kept as alias for UI components. */
export type TripDay = ItineraryDay;

/** Legacy mock activity shape used by destination mock data only. */
export type MockTripActivity = {
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

/** Legacy mock day shape used by destination mock data only. */
export type MockTripDay = {
  day: number;
  title: string;
  dateLabel: string;
  activities: MockTripActivity[];
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

export type TripCitationSource = {
  citation_key: string;
  travel_chunk_id: string;
  travel_source_id: string;
  source_type: "wikipedia" | "wikivoyage";
  source_title: string;
  source_url: string;
  section_title: string | null;
  fetched_at: string | null;
};

export type TripCitationView = TripCitationSource & {
  id: string;
  trip_id: string;
  travel_chunk_id: string;
  travel_source_id: string;
  created_at: string;
};

export type TripMapMarker = {
  x: number;
  y: number;
  label: string;
};

export type TripRouteWarning = {
  code: string;
  severity: "info" | "warning" | "error";
  day_number: number;
  message: string;
  distance_km?: number;
  duration_minutes?: number;
};

export type TripResult = {
  id: string;
  destination: string;
  country: string | null;
  summary: string;
  days: number;
  travelers: number;
  travelStyle: TravelStyle;
  pace: TravelPace;
  interests: Interest[];
  startDate?: string | null;
  budget: {
    total: number;
    currency: Currency;
    estimatedTotalCost: number;
    budgetStatus: BudgetStatus;
    perPerson: number;
    remainingBudget?: number;
    percentageUsed?: number;
    conversionStatus?: ConversionStatus;
    destinationLocalCurrency?: string | null;
    exchangeRate?: number | null;
    exchangeStatus?: string | null;
    extendedStatus?: string | null;
    warning?: string | null;
    dailyAverage?: number | null;
  };
  weather?: {
    status: string;
    message?: string | null;
  };
  itinerary: ItineraryDay[];
  citations?: TripCitationSource[];
  routeWarnings?: TripRouteWarning[];
};

export type SavedTrip = {
  id: string;
  destination: string;
  date: string;
  budget: number;
  currency: Currency;
  days: number;
  status?: string;
  coverTone?: "teal" | "slate" | "sand" | "mist";
  imageKey?: string;
};

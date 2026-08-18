import type { DestinationScope } from "@/lib/destinations/broad-destination";
import type {
  Currency,
  FoodPreference,
  Interest,
  TravelPace,
  TravelStyle,
} from "@/types/trip";

export type TripPlannerFormValues = {
  destination: string;
  /** ISO date YYYY-MM-DD when known; optional for weather-aware planning. */
  startDate?: string | null;
  days: number;
  budget: number;
  currency: Currency;
  travelers: number;
  travelStyle: TravelStyle;
  interests: Interest[];
  pace: TravelPace;
  foodPreference?: FoodPreference;
  specialNotes?: string;
  destinationScope: DestinationScope;
  selectedCities: string[];
  includeAccommodationInBudget: boolean;
  includeTransportToDestinationInBudget: boolean;
};

export type TripPlannerStoragePayload = {
  values: TripPlannerFormValues;
  savedAt: string;
};

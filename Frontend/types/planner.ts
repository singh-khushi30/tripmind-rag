import type {
  Currency,
  FoodPreference,
  Interest,
  TravelPace,
  TravelStyle,
} from "@/types/trip";

export type TripPlannerFormValues = {
  destination: string;
  days: number;
  budget: number;
  currency: Currency;
  travelers: number;
  travelStyle: TravelStyle;
  interests: Interest[];
  pace: TravelPace;
  foodPreference?: FoodPreference;
  specialNotes?: string;
};

export type TripPlannerStoragePayload = {
  values: TripPlannerFormValues;
  savedAt: string;
};

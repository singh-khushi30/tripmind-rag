import type { DestinationScope } from "@/lib/destinations/broad-destination";
import type {
  Currency,
  FoodPreference,
  Interest,
  TravelPace,
  TravelStyle,
} from "@/types/trip";

export type TripPlannerInput = {
  destination: string;
  start_date?: string | null;
  number_of_days: number;
  budget: number;
  currency: Currency;
  travelers: number;
  travel_style: TravelStyle;
  travel_pace: TravelPace;
  interests: Interest[];
  food_preference?: FoodPreference | null;
  special_notes?: string | null;
  destination_scope: DestinationScope;
  selected_cities?: string[];
  include_accommodation_in_budget: boolean;
  include_transport_to_destination_in_budget: boolean;
};

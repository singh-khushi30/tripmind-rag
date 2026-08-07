import type { ItineraryData } from "@/lib/gemini/schema";
import type {
  Currency,
  FoodPreference,
  Interest,
  TravelPace,
  TravelStyle,
} from "@/types/trip";

export type { ItineraryData };

export type TripStatus = "draft" | "generated" | "updated" | "completed";

export type Trip = {
  id: string;
  user_id: string;
  destination: string;
  start_date: string | null;
  number_of_days: number;
  budget: number;
  currency: Currency;
  travelers: number;
  travel_style: TravelStyle;
  travel_pace: TravelPace;
  interests: Interest[];
  food_preference: FoodPreference | null;
  special_notes: string | null;
  status: TripStatus;
  itinerary_data: ItineraryData;
  created_at: string;
  updated_at: string;
};

export type TripInsert = {
  user_id: string;
  destination: string;
  start_date?: string | null;
  number_of_days: number;
  budget: number;
  currency?: Currency;
  travelers: number;
  travel_style: TravelStyle;
  travel_pace: TravelPace;
  interests?: Interest[];
  food_preference?: FoodPreference | null;
  special_notes?: string | null;
  status?: TripStatus;
  itinerary_data: ItineraryData;
};

export type TripUpdate = Partial<Omit<TripInsert, "user_id">>;

export type Database = {
  public: {
    Tables: {
      trips: {
        Row: Trip;
        Insert: TripInsert;
        Update: TripUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

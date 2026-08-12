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

export type TravelSource = {
  id: string;
  destination_key: string;
  destination_name: string;
  country: string | null;
  source_type: "wikipedia" | "wikivoyage";
  source_title: string;
  source_url: string;
  source_page_id: string | null;
  full_content: string | null;
  content_hash: string;
  language: string;
  fetched_at: string;
  created_at: string;
  updated_at: string;
};

export type TravelSourceInsert = Omit<
  TravelSource,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TravelDocumentChunk = {
  id: string;
  source_id: string;
  section_title: string | null;
  chunk_index: number;
  content: string;
  content_hash: string;
  embedding: number[] | string;
  created_at: string;
  updated_at: string;
};

export type TravelDocumentChunkInsert = Omit<
  TravelDocumentChunk,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TripCitation = {
  id: string;
  trip_id: string;
  travel_chunk_id: string;
  travel_source_id: string;
  citation_key: string;
  source_type: "wikipedia" | "wikivoyage";
  source_title: string;
  source_url: string;
  section_title: string | null;
  created_at: string;
};

export type TripCitationInsert = Omit<TripCitation, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type MatchTravelDocumentRow = {
  id: string;
  source_id: string;
  destination_name: string;
  country: string | null;
  source_type: string;
  source_title: string;
  source_url: string;
  section_title: string | null;
  content: string;
  similarity: number;
};

export type Database = {
  public: {
    Tables: {
      trips: {
        Row: Trip;
        Insert: TripInsert;
        Update: TripUpdate;
        Relationships: [];
      };
      travel_sources: {
        Row: TravelSource;
        Insert: TravelSourceInsert;
        Update: Partial<TravelSourceInsert>;
        Relationships: [];
      };
      travel_document_chunks: {
        Row: TravelDocumentChunk;
        Insert: TravelDocumentChunkInsert;
        Update: Partial<TravelDocumentChunkInsert>;
        Relationships: [];
      };
      trip_citations: {
        Row: TripCitation;
        Insert: TripCitationInsert;
        Update: Partial<TripCitationInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_travel_documents: {
        Args: {
          query_embedding: number[] | string;
          match_destination: string;
          match_count?: number;
          similarity_threshold?: number;
        };
        Returns: MatchTravelDocumentRow[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

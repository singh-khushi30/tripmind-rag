import { createClient } from "@/lib/supabase/server";
import type { Trip, TripStatus } from "@/types/database";
import type { TripCitationView } from "@/types/trip";

export async function getCurrentUserOrNull() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function listUserTrips(): Promise<Trip[]> {
  const { supabase, user } = await getCurrentUserOrNull();
  if (!user) return [];

  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Trip[];
}

export async function getUserTripById(id: string): Promise<Trip | null> {
  const { supabase, user } = await getCurrentUserOrNull();
  if (!user) return null;

  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Trip | null) ?? null;
}

export async function getTripCitations(tripId: string): Promise<TripCitationView[]> {
  const { supabase, user } = await getCurrentUserOrNull();
  if (!user) return [];

  const { data, error } = await supabase
    .from("trip_citations")
    .select(
      "id, trip_id, travel_chunk_id, travel_source_id, citation_key, source_type, source_title, source_url, section_title, created_at, travel_sources(fetched_at)",
    )
    .eq("trip_id", tripId)
    .order("citation_key", { ascending: true });

  if (error) {
    // Citations are optional for rendering the trip page.
    return [];
  }

  type CitationJoinRow = {
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
    travel_sources:
      | { fetched_at?: string | null }
      | { fetched_at?: string | null }[]
      | null;
  };

  return ((data ?? []) as unknown as CitationJoinRow[]).map((row) => {
    const joined = row.travel_sources;
    const fetched_at = Array.isArray(joined)
      ? (joined[0]?.fetched_at ?? null)
      : (joined?.fetched_at ?? null);

    return {
      id: row.id,
      trip_id: row.trip_id,
      travel_chunk_id: row.travel_chunk_id,
      travel_source_id: row.travel_source_id,
      citation_key: row.citation_key,
      source_type: row.source_type,
      source_title: row.source_title,
      source_url: row.source_url,
      section_title: row.section_title,
      created_at: row.created_at,
      fetched_at,
    };
  });
}

export async function updateTripStatus(
  id: string,
  status: TripStatus,
): Promise<Trip | null> {
  const { supabase, user } = await getCurrentUserOrNull();
  if (!user) return null;

  const { data, error } = await supabase
    .from("trips")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Trip | null) ?? null;
}

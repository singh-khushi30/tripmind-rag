import { createClient } from "@/lib/supabase/server";
import type { Trip, TripStatus } from "@/types/database";

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

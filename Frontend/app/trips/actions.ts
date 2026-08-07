"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { buildItineraryData } from "@/lib/trips/mappers";
import { tripPlannerSchema } from "@/lib/validation/trip-planner";
import type { TripStatus } from "@/types/database";
import type { TripPlannerFormValues } from "@/types/planner";

export type TripActionResult = {
  error: string | null;
};

export async function createTripAction(
  input: TripPlannerFormValues,
): Promise<TripActionResult> {
  const parsed = tripPlannerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid trip details.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to save a trip." };
  }

  const values = parsed.data;
  const itinerary_data = buildItineraryData(values);

  const { data, error } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      destination: values.destination.trim(),
      start_date: null,
      number_of_days: values.days,
      budget: values.budget,
      currency: values.currency,
      travelers: values.travelers,
      travel_style: values.travelStyle,
      travel_pace: values.pace,
      interests: values.interests,
      food_preference: values.foodPreference ?? null,
      special_notes: values.specialNotes?.trim()
        ? values.specialNotes.trim()
        : null,
      status: "generated" satisfies TripStatus,
      itinerary_data,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return {
      error:
        error?.message ??
        "We couldn’t save your trip. Please try again in a moment.",
    };
  }

  revalidatePath("/saved-trips");
  revalidatePath(`/trip/${data.id}`);
  redirect(`/trip/${data.id}`);
}

export async function deleteTripAction(id: string): Promise<TripActionResult> {
  if (!id || typeof id !== "string") {
    return { error: "Invalid trip id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to delete a trip." };
  }

  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return {
      error:
        error.message ||
        "We couldn’t delete this trip. Please try again in a moment.",
    };
  }

  revalidatePath("/saved-trips");
  revalidatePath(`/trip/${id}`);
  return { error: null };
}

export async function updateTripStatusAction(
  id: string,
  status: TripStatus,
): Promise<TripActionResult> {
  const allowed: TripStatus[] = ["draft", "generated", "updated", "completed"];
  if (!id || !allowed.includes(status)) {
    return { error: "Invalid trip status update." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to update a trip." };
  }

  const { error } = await supabase
    .from("trips")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return {
      error:
        error.message ||
        "We couldn’t update this trip. Please try again in a moment.",
    };
  }

  revalidatePath("/saved-trips");
  revalidatePath(`/trip/${id}`);
  return { error: null };
}

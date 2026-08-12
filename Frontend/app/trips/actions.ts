"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requiresDestinationClarification } from "@/lib/destinations/broad-destination";
import {
  logTripGenerationFailure,
  toUserFacingTripError,
  TripGenerationError,
} from "@/lib/gemini/errors";
import { generateTripItinerary } from "@/lib/gemini/generate-itinerary";
import { geocodeAndValidateItinerary } from "@/lib/maps/geocode-itinerary";
import { isNextRedirectError } from "@/lib/next/errors";
import {
  citationsFromRetrieval,
  collectUsedCitationKeys,
} from "@/lib/rag/citations";
import { ragLog } from "@/lib/rag/log";
import { createClient } from "@/lib/supabase/server";
import { toTripPlannerInput } from "@/lib/trips/mappers";
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
      error:
        "Your trip preferences could not be processed. Review the form and try again.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to generate a trip." };
  }

  const values = parsed.data;

  if (
    requiresDestinationClarification(
      values.destination,
      values.destinationScope,
    )
  ) {
    return {
      error:
        "This destination is too broad. Choose a specific city, region, or multi-city plan before generating.",
    };
  }

  const plannerInput = toTripPlannerInput(values);

  let generation;
  try {
    generation = await generateTripItinerary(plannerInput);
  } catch (error) {
    logTripGenerationFailure(error);
    return { error: toUserFacingTripError(error) };
  }

  const { itinerary, retrieval } = generation;

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
      itinerary_data: itinerary,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return {
      error: toUserFacingTripError(
        new TripGenerationError("SAVE_FAILED", "Supabase insert failed"),
      ),
    };
  }

  let finalItinerary = itinerary;

  if (retrieval) {
    const citationRows = citationsFromRetrieval(
      data.id,
      retrieval.chunks,
      collectUsedCitationKeys(itinerary),
    );

    if (citationRows.length > 0) {
      const { error: citationError } = await supabase
        .from("trip_citations")
        .insert(citationRows);

      if (citationError) {
        await supabase.from("trips").delete().eq("id", data.id).eq("user_id", user.id);
        return {
          error: toUserFacingTripError(
            new TripGenerationError(
              "SAVE_FAILED",
              "Supabase citation insert failed",
              citationError,
            ),
          ),
        };
      }

      ragLog("citations.saved", {
        trip_id: data.id,
        citations_saved: citationRows.length,
        unique_sources_count: new Set(
          citationRows.map((row) => row.travel_source_id),
        ).size,
      });
    }
  }

  try {
    const geocoded = await geocodeAndValidateItinerary({
      tripId: data.id,
      itinerary,
      destination: values.destination.trim(),
      groundedContextBlock: retrieval?.contextBlock ?? null,
    });

    finalItinerary = geocoded.itinerary;

    const { error: itineraryUpdateError } = await supabase
      .from("trips")
      .update({ itinerary_data: finalItinerary })
      .eq("id", data.id)
      .eq("user_id", user.id);

    if (itineraryUpdateError) {
      ragLog("geocode.itinerary_update_failed", {
        trip_id: data.id,
        message: itineraryUpdateError.message.slice(0, 160),
      });
    } else if (geocoded.locations.length > 0) {
      const { error: locationInsertError } = await supabase
        .from("trip_activity_locations")
        .insert(geocoded.locations);

      if (locationInsertError) {
        // Common when migration 004 has not been applied yet.
        ragLog("geocode.locations_insert_failed", {
          trip_id: data.id,
          message: locationInsertError.message.slice(0, 160),
        });
      }
    }

    ragLog("geocode.completed", {
      trip_id: data.id,
      geocoded_count: geocoded.geocoded_count,
      failed_count: geocoded.failed_count,
      warning_count: geocoded.warnings.length,
    });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    // Geocoding is best-effort — trip remains usable without coordinates.
    ragLog("geocode.skipped", {
      trip_id: data.id,
      message:
        error instanceof Error
          ? error.message.slice(0, 160)
          : "unknown_geocode_error",
    });
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
      error: "We couldn’t delete this trip. Please try again in a moment.",
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
      error: "We couldn’t update this trip. Please try again in a moment.",
    };
  }

  revalidatePath("/saved-trips");
  revalidatePath(`/trip/${id}`);
  return { error: null };
}

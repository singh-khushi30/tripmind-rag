"use server";

import { revalidatePath } from "next/cache";

import { itineraryDataSchema, type ItineraryDay } from "@/lib/gemini/schema";
import {
  replanDay,
  type ReplanReasonCode,
} from "@/lib/replanning/replan-day";
import { createClient } from "@/lib/supabase/server";
import { toTripPlannerInput } from "@/lib/trips/mappers";
import type { TripPlannerFormValues } from "@/types/planner";

export type ReplanActionResult = {
  error: string | null;
  itinerary?: unknown;
};

function plannerFromTrip(trip: {
  destination: string;
  start_date: string | null;
  number_of_days: number;
  budget: number;
  currency: string;
  travelers: number;
  travel_style: string;
  travel_pace: string;
  interests: string[] | null;
  food_preference: string | null;
  special_notes: string | null;
}): ReturnType<typeof toTripPlannerInput> {
  const form = {
    destination: trip.destination,
    startDate: trip.start_date,
    days: trip.number_of_days,
    budget: Number(trip.budget),
    currency: trip.currency as TripPlannerFormValues["currency"],
    travelers: trip.travelers,
    travelStyle: trip.travel_style as TripPlannerFormValues["travelStyle"],
    interests: (trip.interests ?? []) as TripPlannerFormValues["interests"],
    pace: trip.travel_pace as TripPlannerFormValues["pace"],
    foodPreference:
      (trip.food_preference as TripPlannerFormValues["foodPreference"]) ??
      undefined,
    specialNotes: trip.special_notes ?? undefined,
    destinationScope: "city",
    selectedCities: [],
    includeAccommodationInBudget: false,
    includeTransportToDestinationInBudget: false,
  } satisfies TripPlannerFormValues;

  return toTripPlannerInput(form);
}

export async function replanTripDayAction(input: {
  tripId: string;
  dayNumber: number;
  reasonCode: ReplanReasonCode;
  reasonText: string;
  hoursLate?: number | null;
  targetDayBudget?: number | null;
}): Promise<ReplanActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: trip, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", input.tripId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !trip) return { error: "Trip not found." };

  const parsed = itineraryDataSchema.safeParse(trip.itinerary_data);
  if (!parsed.success) return { error: "Saved itinerary is invalid." };

  const { data: citations } = await supabase
    .from("trip_citations")
    .select("citation_key")
    .eq("trip_id", input.tripId);

  const allowedCitationKeys = (citations ?? []).map(
    (row) => row.citation_key as string,
  );

  const result = await replanDay({
    itinerary: parsed.data,
    planner: plannerFromTrip(trip),
    dayNumber: input.dayNumber,
    reasonCode: input.reasonCode,
    reasonText: input.reasonText,
    hoursLate: input.hoursLate,
    targetDayBudget: input.targetDayBudget,
    allowedCitationKeys,
  });

  if (!result.ok) {
    return { error: result.error, itinerary: parsed.data };
  }

  const { error: revisionError } = await supabase.from("trip_revisions").insert({
    trip_id: input.tripId,
    user_id: user.id,
    day_number: input.dayNumber,
    reason: `${input.reasonCode}: ${input.reasonText}`.slice(0, 500),
    previous_day: result.previousDay,
    updated_day: result.updatedDay,
  });

  if (revisionError) {
    return {
      error: "Re-plan succeeded but could not save a revision. Original kept.",
      itinerary: parsed.data,
    };
  }

  const { error: updateError } = await supabase
    .from("trips")
    .update({
      itinerary_data: result.itinerary,
      status: "updated",
    })
    .eq("id", input.tripId)
    .eq("user_id", user.id);

  if (updateError) {
    return {
      error: "Could not save the re-planned day. Original itinerary kept.",
      itinerary: parsed.data,
    };
  }

  revalidatePath(`/trip/${input.tripId}`);
  revalidatePath("/saved-trips");
  return { error: null, itinerary: result.itinerary };
}

export async function undoTripDayReplanAction(input: {
  tripId: string;
  dayNumber: number;
}): Promise<ReplanActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", input.tripId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!trip) return { error: "Trip not found." };

  const parsed = itineraryDataSchema.safeParse(trip.itinerary_data);
  if (!parsed.success) return { error: "Saved itinerary is invalid." };

  const { data: revision } = await supabase
    .from("trip_revisions")
    .select("*")
    .eq("trip_id", input.tripId)
    .eq("day_number", input.dayNumber)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!revision) {
    return { error: "No re-plan revision found for this day." };
  }

  const previousDay = revision.previous_day as ItineraryDay;
  const restored: typeof parsed.data = {
    ...parsed.data,
    days: parsed.data.days.map((day) =>
      day.day_number === input.dayNumber ? previousDay : day,
    ),
  };

  const planner = plannerFromTrip(trip);
  const { enrichItineraryAdaptive } = await import("@/lib/trip/enrich-adaptive");
  let finalItinerary = restored;
  try {
    const enriched = await enrichItineraryAdaptive({
      itinerary: restored,
      planner,
    });
    finalItinerary = enriched.itinerary;
  } catch {
    finalItinerary = restored;
  }

  const { error: updateError } = await supabase
    .from("trips")
    .update({ itinerary_data: finalItinerary, status: "updated" })
    .eq("id", input.tripId)
    .eq("user_id", user.id);

  if (updateError) {
    return { error: "Could not undo the last re-plan.", itinerary: parsed.data };
  }

  await supabase.from("trip_revisions").delete().eq("id", revision.id);

  revalidatePath(`/trip/${input.tripId}`);
  return { error: null, itinerary: finalItinerary };
}

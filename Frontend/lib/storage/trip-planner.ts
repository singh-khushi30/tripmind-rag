import { tripPlannerSchema } from "@/lib/validation/trip-planner";
import type {
  TripPlannerFormValues,
  TripPlannerStoragePayload,
} from "@/types/planner";

export const TRIP_PLANNER_STORAGE_KEY = "tripmind.trip-planner";

export type StorageResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function saveTripPlannerSubmission(
  values: TripPlannerFormValues,
): StorageResult<TripPlannerStoragePayload> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Storage is only available in the browser." };
  }

  try {
    const payload: TripPlannerStoragePayload = {
      values,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(
      TRIP_PLANNER_STORAGE_KEY,
      JSON.stringify(payload),
    );
    return { ok: true, data: payload };
  } catch {
    return {
      ok: false,
      error:
        "We couldn’t save your trip details in this browser. Please check storage permissions and try again.",
    };
  }
}

export function loadTripPlannerSubmission(): TripPlannerFormValues | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(TRIP_PLANNER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as TripPlannerStoragePayload;
    const result = tripPlannerSchema.safeParse(parsed.values);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function clearTripPlannerSubmission(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TRIP_PLANNER_STORAGE_KEY);
  } catch {
    // Ignore clear failures — non-blocking.
  }
}

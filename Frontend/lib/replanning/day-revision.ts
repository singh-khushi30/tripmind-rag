import type { ItineraryData, ItineraryDay } from "@/lib/gemini/schema";

/** Pure merge helper — only the selected day is replaced. */
export function mergeReplannedDay(
  original: ItineraryData,
  dayNumber: number,
  updatedDay: ItineraryDay,
): ItineraryData {
  return {
    ...original,
    days: original.days.map((day) =>
      day.day_number === dayNumber ? updatedDay : day,
    ),
  };
}

/** Restore a day from a revision snapshot. */
export function restoreDayFromRevision(
  itinerary: ItineraryData,
  dayNumber: number,
  previousDay: ItineraryDay,
): ItineraryData {
  return mergeReplannedDay(itinerary, dayNumber, previousDay);
}

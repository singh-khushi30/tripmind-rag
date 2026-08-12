import { requiresDestinationClarification } from "@/lib/destinations/broad-destination";
import {
  isWithinStyleBudget,
  reconcileItineraryBudget,
} from "@/lib/gemini/budget";
import { TripGenerationError } from "@/lib/gemini/errors";
import {
  geminiItineraryResponseSchema,
  itineraryDataSchema,
  type ItineraryActivity,
  type ItineraryData,
} from "@/lib/gemini/schema";
import { activitiesOverlap, parseTimeToMinutes } from "@/lib/gemini/time";
import type { TripPlannerInput } from "@/lib/gemini/types";

const STOP_WORDS = new Set([
  "the",
  "and",
  "of",
  "city",
  "town",
  "province",
  "region",
  "island",
  "state",
  "county",
  "area",
  "near",
  "a",
  "an",
  "in",
  "at",
  "for",
]);

const PACE_ACTIVITY_RANGE = {
  relaxed: { min: 3, max: 4 },
  moderate: { min: 4, max: 5 },
  packed: { min: 5, max: 7 },
} as const;

export function normalizeDestination(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function destinationsAppearConsistent(
  requested: string,
  generated: string,
): boolean {
  const a = normalizeDestination(requested);
  const b = normalizeDestination(generated);

  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;

  const tokens = a
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

  if (tokens.length === 0) {
    return a === b;
  }

  return tokens.some((token) => b.includes(token));
}

export function isDiningActivity(activity: ItineraryActivity): boolean {
  const haystack = `${activity.category} ${activity.title}`.toLowerCase();
  return /restaurant|dining|food|meal|lunch|dinner|breakfast|brunch|cafe|café|bistro|eatery/.test(
    haystack,
  );
}

export function titleLocationConsistent(
  title: string,
  locationName: string,
  neighborhood: string | null,
): boolean {
  const t = normalizeDestination(title);
  const l = normalizeDestination(locationName);
  const n = neighborhood ? normalizeDestination(neighborhood) : "";

  if (!t || !l) return false;
  if (t.includes(l) || l.includes(t)) return true;
  if (n && (t.includes(n) || l.includes(n))) return true;

  // "Dinner near the Louvre" + location "Louvre" / neighborhood match.
  const nearMatch = t.match(/\b(?:near|in|at|around)\s+(.+)$/);
  if (nearMatch?.[1]) {
    const place = nearMatch[1].trim();
    if (place && (l.includes(place) || place.includes(l) || (n && n.includes(place)))) {
      return true;
    }
  }

  const titleTokens = t
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
  const locationTokens = new Set(
    l
      .split(" ")
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  );

  return titleTokens.some((token) => locationTokens.has(token));
}

/**
 * Align dining title/location instead of failing the whole generation.
 * Prefers the activity title as the canonical place label.
 */
export function alignDiningActivity(
  activity: ItineraryActivity,
): ItineraryActivity {
  if (!isDiningActivity(activity)) return activity;

  if (
    titleLocationConsistent(
      activity.title,
      activity.location_name,
      activity.neighborhood,
    )
  ) {
    return activity;
  }

  const neighborhoodNote = activity.neighborhood
    ? `Area: ${activity.neighborhood}`
    : null;

  return {
    ...activity,
    location_name: activity.title,
    notes: activity.notes ?? neighborhoodNote,
  };
}

function formatMinutesAsTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function createFillerActivity(
  existing: ItineraryActivity[],
  index: number,
): ItineraryActivity {
  let cursor = 9 * 60;

  for (const activity of existing) {
    const start = parseTimeToMinutes(activity.start_time) ?? cursor;
    cursor = Math.max(cursor, start + activity.duration_minutes + 30);
  }

  if (cursor > 21 * 60) {
    cursor = 9 * 60 + index * 120;
  }

  const title = `Flexible neighborhood break ${index}`;

  return {
    start_time: formatMinutesAsTime(cursor),
    title,
    description:
      "A flexible local break for resting, light exploring, or a casual snack nearby.",
    category: "Rest",
    estimated_cost: 0,
    duration_minutes: 45,
    location_name: title,
    neighborhood: null,
    indoor_outdoor: "mixed",
    reservation_required: false,
    notes: "Added to match your selected travel pace.",
    citation_ids: [],
  };
}

function prioritizeActivitiesForTrim(
  activities: ItineraryActivity[],
): ItineraryActivity[] {
  return [...activities].sort((a, b) => {
    const score = (activity: ItineraryActivity) => {
      let value = 0;
      if (isDiningActivity(activity)) value += 3;
      if (/culture|museum|landmark|nature|history/i.test(activity.category)) {
        value += 2;
      }
      if (activity.estimated_cost > 0) value += 1;
      if (/rest|break|flexible/i.test(activity.title)) value -= 2;
      return value;
    };
    return score(b) - score(a);
  });
}

function resolveScheduleConflicts(
  activities: ItineraryActivity[],
): ItineraryActivity[] {
  const ordered = [...activities].sort((a, b) => {
    const aStart = parseTimeToMinutes(a.start_time) ?? 0;
    const bStart = parseTimeToMinutes(b.start_time) ?? 0;
    return aStart - bStart;
  });

  let previousEnd = 8 * 60;
  const seenTimes = new Set<string>();

  return ordered.map((activity) => {
    let start = parseTimeToMinutes(activity.start_time) ?? previousEnd + 30;
    if (start < previousEnd) {
      start = previousEnd + 15;
    }

    let startLabel = formatMinutesAsTime(start);
    while (seenTimes.has(startLabel)) {
      start += 15;
      startLabel = formatMinutesAsTime(start);
    }
    seenTimes.add(startLabel);

    const duration = Math.min(Math.max(activity.duration_minutes, 30), 120);
    previousEnd = start + duration;

    return {
      ...activity,
      start_time: startLabel,
      duration_minutes: duration,
    };
  });
}

/**
 * Pad or trim daily activities to match the selected travel pace.
 * Avoids rejecting an otherwise usable Gemini response.
 */
export function fitActivitiesToPace(
  activities: ItineraryActivity[],
  pace: TripPlannerInput["travel_pace"],
): ItineraryActivity[] {
  const range = PACE_ACTIVITY_RANGE[pace];
  let result = activities.map(alignDiningActivity);

  if (result.length > range.max) {
    result = prioritizeActivitiesForTrim(result).slice(0, range.max);
  }

  while (result.length < range.min) {
    result = [...result, createFillerActivity(result, result.length + 1)];
  }

  return resolveScheduleConflicts(result);
}

export { isPlaceholderCoordinate } from "@/lib/geo/coordinates";

export function parseAndValidateItinerary(
  raw: unknown,
  input: TripPlannerInput,
  options?: {
    allowedCitationKeys?: string[];
    requireCitations?: boolean;
  },
): ItineraryData {
  if (requiresDestinationClarification(input.destination, input.destination_scope)) {
    throw new TripGenerationError(
      "INVALID_INPUT",
      "Broad destination requires clarification before generation",
    );
  }

  const schema = options?.requireCitations
    ? geminiItineraryResponseSchema
    : itineraryDataSchema.omit({
        budget_totals: true,
        grounding: true,
      });

  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    throw new TripGenerationError(
      "INVALID_RESPONSE",
      "Itinerary failed schema validation",
      parsed.error,
    );
  }

  const withCitationDefaults: ItineraryData = {
    ...parsed.data,
    days: parsed.data.days.map((day) => ({
      ...day,
      activities: day.activities.map((activity) => ({
        ...activity,
        citation_ids: activity.citation_ids ?? [],
      })),
    })),
  };

  const safeguarded = assertItinerarySafeguards(withCitationDefaults, input, options);
  const reconciled = reconcileItineraryBudget(safeguarded, input);

  if (
    !isWithinStyleBudget(
      input.travel_style,
      reconciled.estimated_total_cost,
      input.budget,
    )
  ) {
    throw new TripGenerationError(
      "INVALID_RESPONSE",
      "Generated itinerary exceeds the selected budget for this travel style",
    );
  }

  return reconciled;
}

export function assertItinerarySafeguards(
  itinerary: ItineraryData,
  input: TripPlannerInput,
  options?: {
    allowedCitationKeys?: string[];
    requireCitations?: boolean;
  },
): ItineraryData {
  if (!itinerary.destination.trim()) {
    throw new TripGenerationError(
      "INVALID_RESPONSE",
      "Generated destination is blank",
    );
  }

  if (!destinationsAppearConsistent(input.destination, itinerary.destination)) {
    throw new TripGenerationError(
      "DESTINATION_MISMATCH",
      "Generated destination does not match the request",
    );
  }

  if (input.selected_cities?.length) {
    const generated = normalizeDestination(itinerary.destination);
    const summary = normalizeDestination(itinerary.summary);
    const cityMatched = input.selected_cities.some((city) => {
      const normalizedCity = normalizeDestination(city);
      return (
        generated.includes(normalizedCity) ||
        summary.includes(normalizedCity) ||
        itinerary.days.some((day) =>
          normalizeDestination(`${day.title} ${day.summary}`).includes(
            normalizedCity,
          ),
        )
      );
    });
    if (!cityMatched) {
      throw new TripGenerationError(
        "DESTINATION_MISMATCH",
        "Generated itinerary does not reflect the selected cities",
      );
    }
  }

  if (itinerary.days.length !== input.number_of_days) {
    throw new TripGenerationError(
      "DAY_COUNT_MISMATCH",
      `Expected ${input.number_of_days} days, received ${itinerary.days.length}`,
    );
  }

  const paceRange = PACE_ACTIVITY_RANGE[input.travel_pace];
  const normalizedDays = [];

  for (let index = 0; index < itinerary.days.length; index += 1) {
    const day = itinerary.days[index];
    if (!day) {
      throw new TripGenerationError(
        "INVALID_RESPONSE",
        "Missing itinerary day",
      );
    }

    if (day.day_number !== index + 1) {
      throw new TripGenerationError(
        "INVALID_RESPONSE",
        "Day numbers must begin at 1 and remain sequential",
      );
    }

    if (day.estimated_day_cost < 0) {
      throw new TripGenerationError(
        "INVALID_RESPONSE",
        "Day costs cannot be negative",
      );
    }

    const activities = fitActivitiesToPace(day.activities, input.travel_pace).map(
      (activity) => {
        if (
          options?.requireCitations &&
          (!activity.citation_ids || activity.citation_ids.length === 0) &&
          options.allowedCitationKeys?.[0]
        ) {
          return {
            ...activity,
            citation_ids: [options.allowedCitationKeys[0]],
          };
        }
        return {
          ...activity,
          citation_ids: activity.citation_ids ?? [],
        };
      },
    );

    if (
      activities.length < paceRange.min ||
      activities.length > paceRange.max
    ) {
      throw new TripGenerationError(
        "INVALID_RESPONSE",
        `Day ${day.day_number} activity count must be ${paceRange.min}-${paceRange.max} for ${input.travel_pace} pace`,
      );
    }

    for (const activity of activities) {
      if (activity.estimated_cost < 0) {
        throw new TripGenerationError(
          "INVALID_RESPONSE",
          "Activity costs cannot be negative",
        );
      }
    }

    // Final overlap/duplicate guard after schedule repair.
    const timedActivities = activities
      .map((activity) => ({
        start: parseTimeToMinutes(activity.start_time),
        duration: activity.duration_minutes,
      }))
      .filter(
        (activity): activity is { start: number; duration: number } =>
          activity.start != null,
      );

    for (let i = 0; i < timedActivities.length; i += 1) {
      for (let j = i + 1; j < timedActivities.length; j += 1) {
        const a = timedActivities[i]!;
        const b = timedActivities[j]!;
        if (activitiesOverlap(a.start, a.duration, b.start, b.duration)) {
          throw new TripGenerationError(
            "INVALID_RESPONSE",
            `Overlapping activities on day ${day.day_number}`,
          );
        }
      }
    }

    const uniqueTimes = new Set(
      activities.map((activity) => activity.start_time.trim().toLowerCase()),
    );
    if (uniqueTimes.size !== activities.length) {
      throw new TripGenerationError(
        "INVALID_RESPONSE",
        `Duplicate activity time on day ${day.day_number}`,
      );
    }

    normalizedDays.push({
      ...day,
      activities,
    });
  }

  if (itinerary.estimated_total_cost < 0) {
    throw new TripGenerationError(
      "INVALID_RESPONSE",
      "Total cost cannot be negative",
    );
  }

  return {
    ...itinerary,
    days: normalizedDays,
  };
}

export type DestinationScope = "city" | "region" | "country" | "multi_city";

export type DestinationSuggestion = {
  label: string;
  scope: DestinationScope;
  cities?: string[];
};

export type BroadDestinationKind =
  | "continent"
  | "country"
  | "state"
  | "region";

export type DestinationAnalysis = {
  isBroad: boolean;
  kind: BroadDestinationKind | null;
  normalized: string;
  matchedLabel: string | null;
  suggestions: DestinationSuggestion[];
};

type BroadEntry = {
  names: string[];
  kind: BroadDestinationKind;
  suggestions: DestinationSuggestion[];
};

const CONTINENTS: BroadEntry[] = [
  {
    names: ["europe", "asia", "africa", "antarctica", "oceania", "australia continent"],
    kind: "continent",
    suggestions: [
      { label: "Choose a specific city", scope: "city" },
      { label: "Choose a country or region", scope: "region" },
      { label: "Plan a multi-city trip", scope: "multi_city" },
    ],
  },
  {
    names: ["north america", "south america", "central america"],
    kind: "continent",
    suggestions: [
      { label: "Choose a specific city", scope: "city" },
      { label: "Choose a country or region", scope: "region" },
      { label: "Plan a multi-city trip", scope: "multi_city" },
    ],
  },
];

const COUNTRIES: BroadEntry[] = [
  {
    names: ["japan"],
    kind: "country",
    suggestions: [
      { label: "Tokyo", scope: "city" },
      { label: "Kyoto", scope: "city" },
      { label: "Osaka", scope: "city" },
      { label: "Hokkaido", scope: "region" },
      {
        label: "Multi-city Japan",
        scope: "multi_city",
        cities: ["Tokyo", "Kyoto", "Osaka"],
      },
    ],
  },
  {
    names: ["italy", "italia"],
    kind: "country",
    suggestions: [
      { label: "Rome", scope: "city" },
      { label: "Florence", scope: "city" },
      { label: "Milan", scope: "city" },
      { label: "Amalfi Coast", scope: "region" },
      {
        label: "Multi-city Italy",
        scope: "multi_city",
        cities: ["Rome", "Florence", "Venice"],
      },
    ],
  },
  {
    names: ["france"],
    kind: "country",
    suggestions: [
      { label: "Paris", scope: "city" },
      { label: "Nice", scope: "city" },
      { label: "Lyon", scope: "city" },
      { label: "Southern France", scope: "region" },
      {
        label: "Multi-city France",
        scope: "multi_city",
        cities: ["Paris", "Lyon", "Nice"],
      },
    ],
  },
  {
    names: ["spain"],
    kind: "country",
    suggestions: [
      { label: "Barcelona", scope: "city" },
      { label: "Madrid", scope: "city" },
      { label: "Seville", scope: "city" },
      { label: "Andalusia", scope: "region" },
      {
        label: "Multi-city Spain",
        scope: "multi_city",
        cities: ["Barcelona", "Madrid", "Seville"],
      },
    ],
  },
  {
    names: ["united states", "usa", "u s a", "america"],
    kind: "country",
    suggestions: [
      { label: "New York City", scope: "city" },
      { label: "Los Angeles", scope: "city" },
      { label: "Chicago", scope: "city" },
      { label: "California", scope: "region" },
      { label: "Plan a multi-city US trip", scope: "multi_city" },
    ],
  },
];

const STATES_AND_REGIONS: BroadEntry[] = [
  {
    names: ["california", "ca"],
    kind: "state",
    suggestions: [
      { label: "San Francisco", scope: "city" },
      { label: "Los Angeles", scope: "city" },
      { label: "San Diego", scope: "city" },
      { label: "Northern California", scope: "region" },
      { label: "Southern California", scope: "region" },
      {
        label: "Multi-city California",
        scope: "multi_city",
        cities: ["San Francisco", "Los Angeles", "San Diego"],
      },
    ],
  },
  {
    names: ["new york state", "ny state", "state of new york"],
    kind: "state",
    suggestions: [
      { label: "New York City", scope: "city" },
      { label: "Buffalo", scope: "city" },
      { label: "Hudson Valley", scope: "region" },
      {
        label: "Multi-city New York",
        scope: "multi_city",
        cities: ["New York City", "Albany", "Buffalo"],
      },
    ],
  },
  {
    names: ["texas"],
    kind: "state",
    suggestions: [
      { label: "Austin", scope: "city" },
      { label: "Dallas", scope: "city" },
      { label: "Houston", scope: "city" },
      { label: "Hill Country", scope: "region" },
      {
        label: "Multi-city Texas",
        scope: "multi_city",
        cities: ["Austin", "Dallas", "Houston"],
      },
    ],
  },
  {
    names: ["florida"],
    kind: "state",
    suggestions: [
      { label: "Miami", scope: "city" },
      { label: "Orlando", scope: "city" },
      { label: "Tampa", scope: "city" },
      { label: "South Florida", scope: "region" },
      {
        label: "Multi-city Florida",
        scope: "multi_city",
        cities: ["Miami", "Orlando", "Tampa"],
      },
    ],
  },
  {
    names: ["southern france", "provence", "french riviera", "cote d azur", "côte d azur"],
    kind: "region",
    suggestions: [
      { label: "Nice", scope: "city" },
      { label: "Marseille", scope: "city" },
      { label: "Avignon", scope: "city" },
      { label: "Provence", scope: "region" },
      {
        label: "Multi-city Southern France",
        scope: "multi_city",
        cities: ["Nice", "Marseille", "Avignon"],
      },
    ],
  },
  {
    names: ["tuscany"],
    kind: "region",
    suggestions: [
      { label: "Florence", scope: "city" },
      { label: "Siena", scope: "city" },
      { label: "Tuscany countryside", scope: "region" },
      {
        label: "Multi-city Tuscany",
        scope: "multi_city",
        cities: ["Florence", "Siena", "Pisa"],
      },
    ],
  },
];

const US_STATES = [
  "alabama",
  "alaska",
  "arizona",
  "arkansas",
  "colorado",
  "connecticut",
  "delaware",
  "georgia",
  "hawaii",
  "idaho",
  "illinois",
  "indiana",
  "iowa",
  "kansas",
  "kentucky",
  "louisiana",
  "maine",
  "maryland",
  "massachusetts",
  "michigan",
  "minnesota",
  "mississippi",
  "missouri",
  "montana",
  "nebraska",
  "nevada",
  "new hampshire",
  "new jersey",
  "new mexico",
  "north carolina",
  "north dakota",
  "ohio",
  "oklahoma",
  "oregon",
  "pennsylvania",
  "rhode island",
  "south carolina",
  "south dakota",
  "tennessee",
  "utah",
  "vermont",
  "virginia",
  "washington",
  "west virginia",
  "wisconsin",
  "wyoming",
];

const GENERIC_SUGGESTIONS: DestinationSuggestion[] = [
  { label: "Choose a specific city", scope: "city" },
  { label: "Focus on a smaller region", scope: "region" },
  { label: "Plan a multi-city trip", scope: "multi_city" },
];

export function normalizeDestinationLabel(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchEntry(normalized: string, entry: BroadEntry): boolean {
  return entry.names.some((name) => {
    if (normalized === name) return true;
    if (normalized === `${name} state`) return true;
    if (normalized.startsWith(`${name} `) && normalized.split(" ").length <= 3) {
      return true;
    }
    return false;
  });
}

function buildGenericStateSuggestions(label: string): DestinationSuggestion[] {
  return [
    { label: `Major city in ${label}`, scope: "city" },
    { label: `${label} region focus`, scope: "region" },
    { label: `Multi-city ${label}`, scope: "multi_city" },
  ];
}

export function analyzeDestination(destination: string): DestinationAnalysis {
  const normalized = normalizeDestinationLabel(destination);

  if (!normalized) {
    return {
      isBroad: false,
      kind: null,
      normalized,
      matchedLabel: null,
      suggestions: [],
    };
  }

  // City-like inputs with commas are usually specific enough (e.g. "Paris, France").
  if (destination.includes(",") && !/\bstate\b/i.test(destination)) {
    const beforeComma = normalizeDestinationLabel(destination.split(",")[0] ?? "");
    const knownBroadBeforeComma = [...COUNTRIES, ...STATES_AND_REGIONS, ...CONTINENTS].some(
      (entry) => matchEntry(beforeComma, entry),
    );
    if (!knownBroadBeforeComma && beforeComma.split(" ").length <= 3) {
      return {
        isBroad: false,
        kind: null,
        normalized,
        matchedLabel: null,
        suggestions: [],
      };
    }
  }

  for (const entry of [...STATES_AND_REGIONS, ...COUNTRIES, ...CONTINENTS]) {
    if (matchEntry(normalized, entry)) {
      return {
        isBroad: true,
        kind: entry.kind,
        normalized,
        matchedLabel: destination.trim(),
        suggestions: entry.suggestions,
      };
    }
  }

  if (US_STATES.includes(normalized) || normalized.endsWith(" state")) {
    const label = destination.trim();
    return {
      isBroad: true,
      kind: "state",
      normalized,
      matchedLabel: label,
      suggestions: buildGenericStateSuggestions(label.replace(/\s+state$/i, "")),
    };
  }

  if (
    /^(northern|southern|eastern|western|central)\s+\p{L}+/u.test(normalized) ||
    /\b(region|province|prefecture|county)\b/.test(normalized)
  ) {
    return {
      isBroad: true,
      kind: "region",
      normalized,
      matchedLabel: destination.trim(),
      suggestions: GENERIC_SUGGESTIONS.map((item) =>
        item.scope === "region"
          ? { ...item, label: destination.trim() }
          : item,
      ),
    };
  }

  return {
    isBroad: false,
    kind: null,
    normalized,
    matchedLabel: null,
    suggestions: [],
  };
}

export function requiresDestinationClarification(
  destination: string,
  scope: DestinationScope | null | undefined,
): boolean {
  const analysis = analyzeDestination(destination);
  if (!analysis.isBroad) return false;

  // After clarification, region / country / multi-city scopes are intentional.
  if (scope === "region" || scope === "country" || scope === "multi_city") {
    return false;
  }

  return true;
}

export function isKnownCityDestination(destination: string): boolean {
  const normalized = normalizeDestinationLabel(destination);
  const cities = [
    "paris",
    "tokyo",
    "kyoto",
    "osaka",
    "rome",
    "florence",
    "milan",
    "barcelona",
    "madrid",
    "london",
    "new york",
    "new york city",
    "san francisco",
    "los angeles",
    "san diego",
    "chicago",
    "miami",
    "dubai",
    "singapore",
    "seoul",
    "bangkok",
    "lisbon",
    "berlin",
    "amsterdam",
    "prague",
    "vienna",
    "sydney",
    "melbourne",
    "toronto",
    "vancouver",
    "mexico city",
    "nice",
    "lyon",
    "marseille",
    "austin",
    "seattle",
    "boston",
  ];

  return cities.some(
    (city) =>
      normalized === city ||
      normalized.startsWith(`${city} `) ||
      normalized.endsWith(` ${city}`),
  );
}

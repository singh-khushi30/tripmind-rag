export type DestinationImageConfig = {
  src: string;
  alt: string;
  fallbackTone: "teal" | "slate" | "sand" | "mist";
};

/** Curated Unsplash photos for mock destinations. */
export const DESTINATION_IMAGES = {
  kyoto: {
    src: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
    alt: "Traditional Japanese temple and pagoda in Kyoto",
    fallbackTone: "teal",
  },
  lisbon: {
    src: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80",
    alt: "Yellow tram on a colorful street in Lisbon",
    fallbackTone: "sand",
  },
  reykjavik: {
    src: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=1200&q=80",
    alt: "Dramatic Icelandic landscape near Reykjavík",
    fallbackTone: "mist",
  },
  marrakech: {
    src: "https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=1200&q=80",
    alt: "Moroccan architecture and market streets in Marrakech",
    fallbackTone: "slate",
  },
} as const satisfies Record<string, DestinationImageConfig>;

export type DestinationKey = keyof typeof DESTINATION_IMAGES;

export const FALLBACK_TRAVEL_IMAGE =
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80";

export function destinationKeyFromId(id: string): DestinationKey | null {
  if (id.includes("kyoto")) return "kyoto";
  if (id.includes("lisbon")) return "lisbon";
  if (id.includes("reykjavik")) return "reykjavik";
  if (id.includes("marrakech")) return "marrakech";
  return null;
}

export function resolveDestinationImage(destination: string): DestinationImageConfig {
  const key = destinationKeyFromId(destination.toLowerCase());
  if (key) return DESTINATION_IMAGES[key];

  return {
    src: FALLBACK_TRAVEL_IMAGE,
    alt: `Travel photo for ${destination}`,
    fallbackTone: "teal",
  };
}

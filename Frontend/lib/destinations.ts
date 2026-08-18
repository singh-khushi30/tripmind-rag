export type DestinationImageConfig = {
  src: string;
  alt: string;
  fallbackTone: "teal" | "slate" | "sand" | "mist";
};

/** Curated Unsplash photos keyed by destination slug. */
export const DESTINATION_IMAGES = {
  kyoto: {
    src: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
    alt: "Traditional Japanese temple and pagoda in Kyoto",
    fallbackTone: "teal",
  },
  tokyo: {
    src: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
    alt: "Tokyo city skyline at dusk",
    fallbackTone: "slate",
  },
  osaka: {
    src: "https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=1200&q=80",
    alt: "Osaka castle and skyline",
    fallbackTone: "teal",
  },
  paris: {
    src: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
    alt: "Eiffel Tower in Paris",
    fallbackTone: "mist",
  },
  london: {
    src: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80",
    alt: "London skyline with the Thames",
    fallbackTone: "slate",
  },
  "new-york": {
    src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80",
    alt: "New York City skyline",
    fallbackTone: "slate",
  },
  "los-angeles": {
    src: "https://images.unsplash.com/photo-1534190239940-9cb6760b0a70?auto=format&fit=crop&w=1200&q=80",
    alt: "Los Angeles downtown skyline",
    fallbackTone: "sand",
  },
  "san-francisco": {
    src: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80",
    alt: "Golden Gate Bridge in San Francisco",
    fallbackTone: "mist",
  },
  seattle: {
    src: "https://images.unsplash.com/photo-1502175353174-a7a70e73b362?auto=format&fit=crop&w=1200&q=80",
    alt: "Seattle skyline and waterfront",
    fallbackTone: "mist",
  },
  chicago: {
    src: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=1200&q=80",
    alt: "Chicago skyline along Lake Michigan",
    fallbackTone: "slate",
  },
  miami: {
    src: "https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?auto=format&fit=crop&w=1200&q=80",
    alt: "Miami beachfront skyline",
    fallbackTone: "sand",
  },
  lisbon: {
    src: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80",
    alt: "Yellow tram on a colorful street in Lisbon",
    fallbackTone: "sand",
  },
  rome: {
    src: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80",
    alt: "Colosseum in Rome",
    fallbackTone: "sand",
  },
  barcelona: {
    src: "https://images.unsplash.com/photo-1583422409513-8a86a7f2e4a7?auto=format&fit=crop&w=1200&q=80",
    alt: "Barcelona cityscape and architecture",
    fallbackTone: "sand",
  },
  amsterdam: {
    src: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=1200&q=80",
    alt: "Amsterdam canals and historic houses",
    fallbackTone: "teal",
  },
  berlin: {
    src: "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1200&q=80",
    alt: "Berlin landmarks and city streets",
    fallbackTone: "slate",
  },
  dubai: {
    src: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    alt: "Dubai skyline and modern architecture",
    fallbackTone: "sand",
  },
  bangkok: {
    src: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1200&q=80",
    alt: "Bangkok temple and city lights",
    fallbackTone: "teal",
  },
  singapore: {
    src: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
    alt: "Singapore Marina Bay skyline",
    fallbackTone: "mist",
  },
  sydney: {
    src: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80",
    alt: "Sydney Opera House and harbour",
    fallbackTone: "teal",
  },
  bali: {
    src: "https://images.unsplash.com/photo-1537996194471-e6677233ea1a?auto=format&fit=crop&w=1200&q=80",
    alt: "Bali rice terraces and tropical landscape",
    fallbackTone: "teal",
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
  delhi: {
    src: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
    alt: "India Gate in Delhi",
    fallbackTone: "sand",
  },
  mumbai: {
    src: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=1200&q=80",
    alt: "Mumbai city and coastal skyline",
    fallbackTone: "sand",
  },
} as const satisfies Record<string, DestinationImageConfig>;

export type DestinationKey = keyof typeof DESTINATION_IMAGES;

/** Varied travel photos used when a destination is not in the curated map. */
const DESTINATION_IMAGE_POOL: DestinationImageConfig[] = [
  {
    src: "https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1200&q=80",
    alt: "Airplane wing above clouds during travel",
    fallbackTone: "mist",
  },
  {
    src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
    alt: "Road trip through scenic mountains",
    fallbackTone: "teal",
  },
  {
    src: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
    alt: "Boat on a calm lake surrounded by mountains",
    fallbackTone: "teal",
  },
  {
    src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
    alt: "Mountain lake travel landscape",
    fallbackTone: "mist",
  },
  {
    src: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1200&q=80",
    alt: "Passport and travel essentials",
    fallbackTone: "sand",
  },
  {
    src: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80",
    alt: "World map with travel planning notes",
    fallbackTone: "sand",
  },
  {
    src: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1200&q=80",
    alt: "Coastal cliffs and ocean overlook",
    fallbackTone: "teal",
  },
  {
    src: "https://images.unsplash.com/photo-1507608616759-54f48f0ac0bd?auto=format&fit=crop&w=1200&q=80",
    alt: "Hot air balloons over a scenic valley",
    fallbackTone: "sand",
  },
];

export const FALLBACK_TRAVEL_IMAGE = DESTINATION_IMAGE_POOL[2]!.src;

const DESTINATION_ALIASES: Array<{ pattern: RegExp; key: DestinationKey }> = [
  { pattern: /\bkyoto\b/i, key: "kyoto" },
  { pattern: /\btokyo\b/i, key: "tokyo" },
  { pattern: /\bosaka\b/i, key: "osaka" },
  { pattern: /\bparis\b|\bfrance\b/i, key: "paris" },
  { pattern: /\blondon\b|\bunited kingdom\b|\bengland\b/i, key: "london" },
  { pattern: /\bnew york\b|\bnyc\b|\bmanhattan\b/i, key: "new-york" },
  { pattern: /\blos angeles\b|\blos-angeles\b|\bhollywood\b/i, key: "los-angeles" },
  { pattern: /\bsan francisco\b|\bsan-francisco\b|\bbay area\b/i, key: "san-francisco" },
  { pattern: /\bseattle\b/i, key: "seattle" },
  { pattern: /\bchicago\b/i, key: "chicago" },
  { pattern: /\bmiami\b/i, key: "miami" },
  { pattern: /\blisbon\b|\bportugal\b/i, key: "lisbon" },
  { pattern: /\brome\b|\bitaly\b/i, key: "rome" },
  { pattern: /\bbarcelona\b|\bspain\b/i, key: "barcelona" },
  { pattern: /\bamsterdam\b|\bnetherlands\b/i, key: "amsterdam" },
  { pattern: /\bberlin\b|\bgermany\b/i, key: "berlin" },
  { pattern: /\bdubai\b|\buae\b/i, key: "dubai" },
  { pattern: /\bbangkok\b|\bthailand\b/i, key: "bangkok" },
  { pattern: /\bsingapore\b/i, key: "singapore" },
  { pattern: /\bsydney\b|\baustralia\b/i, key: "sydney" },
  { pattern: /\bbali\b|\bindonesia\b/i, key: "bali" },
  { pattern: /\breykjavik\b|\biceland\b/i, key: "reykjavik" },
  { pattern: /\bmarrakech\b|\bmorocco\b/i, key: "marrakech" },
  { pattern: /\bdelhi\b|\bnew delhi\b/i, key: "delhi" },
  { pattern: /\bmumbai\b|\bbombay\b/i, key: "mumbai" },
  { pattern: /\bjapan\b/i, key: "tokyo" },
];

export function destinationKeyFromId(id: string): DestinationKey | null {
  const normalized = id.toLowerCase();
  for (const entry of DESTINATION_ALIASES) {
    if (entry.pattern.test(normalized)) return entry.key;
  }
  return null;
}

function hashDestination(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function resolveDestinationImage(
  destination: string,
): DestinationImageConfig {
  const key = destinationKeyFromId(destination);
  if (key) {
    return {
      ...DESTINATION_IMAGES[key],
      alt: DESTINATION_IMAGES[key].alt,
    };
  }

  const poolImage =
    DESTINATION_IMAGE_POOL[
      hashDestination(destination.trim().toLowerCase()) %
        DESTINATION_IMAGE_POOL.length
    ]!;

  return {
    ...poolImage,
    alt: `Travel photo for ${destination}`,
  };
}

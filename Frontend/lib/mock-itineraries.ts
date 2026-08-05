import type { Currency, TripDay, TripSource } from "@/types/trip";

export type MapMarker = {
  x: number;
  y: number;
  label: string;
};

export type MockItineraryResult = {
  key: string;
  destinationLabel: string;
  country: string;
  isGeneric: boolean;
  map: {
    label: string;
    lat: number;
    lng: number;
    markers: MapMarker[];
  };
  sources: TripSource[];
  itinerary: TripDay[];
};

type DestinationMock = {
  key: string;
  aliases: string[];
  label: string;
  country: string;
  map: {
    lat: number;
    lng: number;
    markers: MapMarker[];
  };
  sources: TripSource[];
  days: Array<{
    title: string;
    activities: Array<{
      time: string;
      title: string;
      description: string;
      estimatedCost: number;
      duration: string;
      category: string;
      source: string;
    }>;
  }>;
};

const BUDGET_SCALE = 1;

const DESTINATION_MOCKS: DestinationMock[] = [
  {
    key: "california",
    aliases: ["california", "los angeles", "san francisco", "sf", "la"],
    label: "California",
    country: "USA",
    map: {
      lat: 36.7783,
      lng: -119.4179,
      markers: [
        { x: 28, y: 62, label: "Coast" },
        { x: 48, y: 40, label: "City" },
        { x: 66, y: 52, label: "Park" },
        { x: 78, y: 30, label: "Vista" },
      ],
    },
    sources: [
      {
        id: "ca-1",
        title: "California Travel Guide",
        publisher: "Visit California",
        type: "official",
      },
      {
        id: "ca-2",
        title: "Pacific Coast Highlights",
        publisher: "West Coast Digest",
        type: "guide",
      },
    ],
    days: [
      {
        title: "Arrival & coastal welcome",
        activities: [
          {
            time: "11:00",
            title: "Settle near the waterfront",
            description:
              "Check in close to the coast and take an easy first walk along the shoreline.",
            estimatedCost: 160,
            duration: "1 hr",
            category: "Stay",
            source: "Coastal lodging notes",
          },
          {
            time: "13:30",
            title: "Local food experience",
            description:
              "Try a California classic — fresh seafood, tacos, or a farmers-market lunch.",
            estimatedCost: 40,
            duration: "1.5 hrs",
            category: "Food",
            source: "Local food guide",
          },
          {
            time: "16:30",
            title: "Sunset coastal overlook",
            description:
              "Catch golden hour from a scenic overlook with Pacific views.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "Nature",
            source: "Scenic route map",
          },
        ],
      },
      {
        title: "City landmarks & neighborhoods",
        activities: [
          {
            time: "09:00",
            title: "Visit a major local landmark",
            description:
              "Start with an iconic California landmark before midday crowds build.",
            estimatedCost: 25,
            duration: "2 hrs",
            category: "Culture",
            source: "City attractions brief",
          },
          {
            time: "12:30",
            title: "Neighborhood walking tour",
            description:
              "Wander a lively district with murals, cafés, and independent shops.",
            estimatedCost: 15,
            duration: "2.5 hrs",
            category: "Culture",
            source: "Neighborhood guide",
          },
          {
            time: "17:00",
            title: "Explore the historic city center",
            description:
              "Stroll central streets and plazas as evening lights come on.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "History",
            source: "Walking club notes",
          },
        ],
      },
      {
        title: "Nature day outdoors",
        activities: [
          {
            time: "08:30",
            title: "Park or trail morning",
            description:
              "Hike or picnic in a nearby state park, canyon, or coastal trail.",
            estimatedCost: 12,
            duration: "3 hrs",
            category: "Nature",
            source: "Parks directory",
          },
          {
            time: "13:00",
            title: "Local food experience",
            description:
              "Refuel with a casual outdoor lunch after the morning adventure.",
            estimatedCost: 35,
            duration: "1.5 hrs",
            category: "Food",
            source: "Regional dining list",
          },
          {
            time: "16:00",
            title: "Cultural attraction",
            description:
              "Visit a museum, gallery, or mission that reflects California’s history.",
            estimatedCost: 22,
            duration: "2 hrs",
            category: "Culture",
            source: "Museum roundup",
          },
        ],
      },
      {
        title: "Food, markets & leisure",
        activities: [
          {
            time: "10:00",
            title: "Morning market browse",
            description:
              "Sample produce, coffee, and specialty stalls at a popular local market.",
            estimatedCost: 30,
            duration: "2 hrs",
            category: "Food",
            source: "Market listings",
          },
          {
            time: "13:30",
            title: "Neighborhood walking tour",
            description:
              "Explore a second district known for architecture and street life.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "Adventure",
            source: "City walking map",
          },
          {
            time: "18:00",
            title: "Relaxed dinner by the coast",
            description:
              "End with an unhurried dinner — seafood or California cuisine.",
            estimatedCost: 55,
            duration: "2 hrs",
            category: "Food",
            source: "Dining digest",
          },
        ],
      },
      {
        title: "Flexible finale",
        activities: [
          {
            time: "09:30",
            title: "Visit a major local landmark",
            description:
              "See one last highlight you skipped earlier in the trip.",
            estimatedCost: 20,
            duration: "2 hrs",
            category: "Culture",
            source: "Attractions shortlist",
          },
          {
            time: "13:00",
            title: "Local food experience",
            description: "A final favorite bite before departure logistics.",
            estimatedCost: 28,
            duration: "1 hr",
            category: "Food",
            source: "Traveler tips",
          },
          {
            time: "15:30",
            title: "Departure buffer",
            description:
              "Allow transfer time with a calm buffer for the journey home.",
            estimatedCost: 40,
            duration: "2 hrs",
            category: "Transport",
            source: "Transit planner",
          },
        ],
      },
    ],
  },
  {
    key: "tokyo",
    aliases: ["tokyo", "東京"],
    label: "Tokyo",
    country: "Japan",
    map: {
      lat: 35.6762,
      lng: 139.6503,
      markers: [
        { x: 30, y: 55, label: "Shibuya" },
        { x: 52, y: 38, label: "Asakusa" },
        { x: 68, y: 48, label: "Ginza" },
        { x: 75, y: 28, label: "Ueno" },
      ],
    },
    sources: [
      {
        id: "tk-1",
        title: "Tokyo Official Guide",
        publisher: "Tokyo Tourism",
        type: "official",
      },
      {
        id: "tk-2",
        title: "Neighborhood Food Notes",
        publisher: "Tokyo Table",
        type: "review",
      },
    ],
    days: [
      {
        title: "Arrival & neon welcome",
        activities: [
          {
            time: "11:00",
            title: "Check in near Shinjuku or Shibuya",
            description:
              "Settle into a compact hotel with easy metro access for the week.",
            estimatedCost: 150,
            duration: "45 min",
            category: "Stay",
            source: "City lodging notes",
          },
          {
            time: "13:30",
            title: "Local food experience",
            description:
              "Ramen, conveyor sushi, or a department-store food hall lunch.",
            estimatedCost: 25,
            duration: "1.5 hrs",
            category: "Food",
            source: "Food hall guide",
          },
          {
            time: "17:00",
            title: "Shibuya crossing & side streets",
            description:
              "Watch the scramble, then explore quieter lanes nearby.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "Culture",
            source: "City walking map",
          },
        ],
      },
      {
        title: "Tradition in Asakusa",
        activities: [
          {
            time: "09:00",
            title: "Senso-ji temple visit",
            description:
              "Morning visit to Tokyo’s oldest temple and Nakamise shopping street.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "Culture",
            source: "Temple visitor notes",
          },
          {
            time: "12:30",
            title: "Sumida riverside lunch",
            description: "Casual lunch with skyline views near the river.",
            estimatedCost: 30,
            duration: "1.5 hrs",
            category: "Food",
            source: "Local dining list",
          },
          {
            time: "15:00",
            title: "Neighborhood walking tour",
            description:
              "Wander Yanaka or Ueno for temples, parks, and old-town charm.",
            estimatedCost: 0,
            duration: "2.5 hrs",
            category: "History",
            source: "Heritage walk notes",
          },
        ],
      },
      {
        title: "Modern Tokyo highlights",
        activities: [
          {
            time: "10:00",
            title: "Visit a major local landmark",
            description:
              "TeamLab, Tokyo Skytree, or a contemporary museum — pick one icon.",
            estimatedCost: 35,
            duration: "2.5 hrs",
            category: "Culture",
            source: "Attractions brief",
          },
          {
            time: "13:30",
            title: "Ginza or Marunouchi stroll",
            description:
              "Window-shop and café-hop through polished central districts.",
            estimatedCost: 40,
            duration: "2 hrs",
            category: "Shopping",
            source: "District guide",
          },
          {
            time: "18:30",
            title: "Izakaya evening",
            description: "Share small plates in a lively alleyway eatery.",
            estimatedCost: 45,
            duration: "2 hrs",
            category: "Food",
            source: "Nightlife dining tips",
          },
        ],
      },
      {
        title: "Parks & calm corners",
        activities: [
          {
            time: "09:00",
            title: "Meiji Jingu or a garden walk",
            description:
              "A quieter morning among trees and shrine paths in the city.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "Nature",
            source: "Parks directory",
          },
          {
            time: "12:30",
            title: "Local food experience",
            description: "Try a specialty café or seasonal set lunch.",
            estimatedCost: 28,
            duration: "1.5 hrs",
            category: "Food",
            source: "Café roundup",
          },
          {
            time: "15:30",
            title: "Cultural attraction",
            description:
              "A craft workshop, design museum, or photography exhibit.",
            estimatedCost: 20,
            duration: "2 hrs",
            category: "Culture",
            source: "Arts calendar",
          },
        ],
      },
      {
        title: "Flexible Tokyo finale",
        activities: [
          {
            time: "09:30",
            title: "Explore the historic city center",
            description:
              "Revisit a favorite neighborhood or see Imperial Palace outer gardens.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "History",
            source: "City overview",
          },
          {
            time: "13:00",
            title: "Souvenir & snack stop",
            description: "Pick up snacks and small gifts before departure.",
            estimatedCost: 35,
            duration: "1.5 hrs",
            category: "Shopping",
            source: "Retail tips",
          },
          {
            time: "16:00",
            title: "Airport transfer buffer",
            description: "Build in express-train or bus time with a cushion.",
            estimatedCost: 50,
            duration: "2 hrs",
            category: "Transport",
            source: "Transit planner",
          },
        ],
      },
    ],
  },
  {
    key: "paris",
    aliases: ["paris"],
    label: "Paris",
    country: "France",
    map: {
      lat: 48.8566,
      lng: 2.3522,
      markers: [
        { x: 32, y: 58, label: "Louvre" },
        { x: 50, y: 42, label: "Seine" },
        { x: 68, y: 50, label: "Marais" },
        { x: 76, y: 30, label: "Montmartre" },
      ],
    },
    sources: [
      {
        id: "pr-1",
        title: "Paris Official Tourism",
        publisher: "Paris je t'aime",
        type: "official",
      },
      {
        id: "pr-2",
        title: "Arrondissement Walking Notes",
        publisher: "Seine Side Guides",
        type: "guide",
      },
    ],
    days: [
      {
        title: "Arrival on the Seine",
        activities: [
          {
            time: "11:00",
            title: "Check in near the river",
            description:
              "Settle into a central stay within walking distance of a metro line.",
            estimatedCost: 180,
            duration: "45 min",
            category: "Stay",
            source: "Lodging notes",
          },
          {
            time: "13:30",
            title: "Local food experience",
            description: "A classic café lunch — salad, quiche, or croque.",
            estimatedCost: 35,
            duration: "1.5 hrs",
            category: "Food",
            source: "Café guide",
          },
          {
            time: "16:30",
            title: "Explore the historic city center",
            description:
              "Île de la Cité and riverside paths for a gentle first evening.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "History",
            source: "Walking map",
          },
        ],
      },
      {
        title: "Icons & museums",
        activities: [
          {
            time: "09:00",
            title: "Visit a major local landmark",
            description:
              "Louvre, Orsay, or Notre-Dame exterior — choose one major stop.",
            estimatedCost: 22,
            duration: "3 hrs",
            category: "Culture",
            source: "Museum tickets brief",
          },
          {
            time: "13:30",
            title: "Left Bank lunch",
            description: "Bistro fare in Saint-Germain or the Latin Quarter.",
            estimatedCost: 40,
            duration: "1.5 hrs",
            category: "Food",
            source: "Bistro list",
          },
          {
            time: "16:00",
            title: "Neighborhood walking tour",
            description: "Browse bookshops and side streets at an easy pace.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "Culture",
            source: "Arrondissement notes",
          },
        ],
      },
      {
        title: "Marais & markets",
        activities: [
          {
            time: "10:00",
            title: "Le Marais morning",
            description:
              "Squares, boutiques, and historic mansions in the Marais.",
            estimatedCost: 0,
            duration: "2.5 hrs",
            category: "History",
            source: "District guide",
          },
          {
            time: "13:00",
            title: "Local food experience",
            description: "Falafel, fromagerie snacks, or a market picnic.",
            estimatedCost: 25,
            duration: "1.5 hrs",
            category: "Food",
            source: "Market tips",
          },
          {
            time: "16:00",
            title: "Cultural attraction",
            description: "A smaller museum or covered passage to explore.",
            estimatedCost: 15,
            duration: "2 hrs",
            category: "Culture",
            source: "Arts listing",
          },
        ],
      },
      {
        title: "Montmartre views",
        activities: [
          {
            time: "09:30",
            title: "Montmartre hill walk",
            description: "Sacré-Cœur steps and village lanes above the city.",
            estimatedCost: 0,
            duration: "2.5 hrs",
            category: "Adventure",
            source: "Viewpoint map",
          },
          {
            time: "13:00",
            title: "Local food experience",
            description: "Crêpes or a cozy hillside lunch.",
            estimatedCost: 30,
            duration: "1.5 hrs",
            category: "Food",
            source: "Dining notes",
          },
          {
            time: "16:30",
            title: "Seine golden hour",
            description: "An unhurried walk along the quays at dusk.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "Nature",
            source: "River walk tips",
          },
        ],
      },
      {
        title: "Soft landing day",
        activities: [
          {
            time: "10:00",
            title: "Visit a major local landmark",
            description: "Eiffel Tower area or a final gallery stop.",
            estimatedCost: 20,
            duration: "2 hrs",
            category: "Culture",
            source: "Highlights list",
          },
          {
            time: "13:00",
            title: "Pastry farewell",
            description: "One last bakery run before you head out.",
            estimatedCost: 18,
            duration: "1 hr",
            category: "Food",
            source: "Bakery guide",
          },
          {
            time: "15:30",
            title: "Departure buffer",
            description: "Metro or RER time with a calm cushion.",
            estimatedCost: 35,
            duration: "2 hrs",
            category: "Transport",
            source: "Transit planner",
          },
        ],
      },
    ],
  },
  {
    key: "new-york",
    aliases: ["new york", "new york city", "nyc", "manhattan"],
    label: "New York",
    country: "USA",
    map: {
      lat: 40.7128,
      lng: -74.006,
      markers: [
        { x: 34, y: 60, label: "Downtown" },
        { x: 50, y: 40, label: "Midtown" },
        { x: 66, y: 52, label: "Village" },
        { x: 74, y: 28, label: "Uptown" },
      ],
    },
    sources: [
      {
        id: "ny-1",
        title: "NYC Official Guide",
        publisher: "NYC Tourism",
        type: "official",
      },
      {
        id: "ny-2",
        title: "Borough Walking Notes",
        publisher: "Metro Walks",
        type: "guide",
      },
    ],
    days: [
      {
        title: "Arrival in Manhattan",
        activities: [
          {
            time: "11:00",
            title: "Check in midtown or downtown",
            description: "Drop bags and get oriented with a nearby subway stop.",
            estimatedCost: 200,
            duration: "45 min",
            category: "Stay",
            source: "Hotel notes",
          },
          {
            time: "13:30",
            title: "Local food experience",
            description: "A classic NYC lunch — deli, pizza, or dumpling spot.",
            estimatedCost: 30,
            duration: "1 hr",
            category: "Food",
            source: "Eats guide",
          },
          {
            time: "16:00",
            title: "Explore the historic city center",
            description:
              "Lower Manhattan landmarks or a skyline viewpoint walk.",
            estimatedCost: 0,
            duration: "2.5 hrs",
            category: "History",
            source: "Downtown map",
          },
        ],
      },
      {
        title: "Icons of the city",
        activities: [
          {
            time: "09:00",
            title: "Visit a major local landmark",
            description:
              "Central Park, Empire State area, or a ferry skyline view.",
            estimatedCost: 30,
            duration: "2.5 hrs",
            category: "Culture",
            source: "Attractions brief",
          },
          {
            time: "13:00",
            title: "Neighborhood walking tour",
            description: "West Village or SoHo streets at a relaxed pace.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "Culture",
            source: "Neighborhood notes",
          },
          {
            time: "17:30",
            title: "Cultural attraction",
            description: "A museum highlight or gallery hop before dinner.",
            estimatedCost: 25,
            duration: "2 hrs",
            category: "Culture",
            source: "Museum listing",
          },
        ],
      },
      {
        title: "Food & borough flavor",
        activities: [
          {
            time: "10:00",
            title: "Market morning",
            description: "Chelsea Market or a weekend street market browse.",
            estimatedCost: 35,
            duration: "2 hrs",
            category: "Food",
            source: "Market guide",
          },
          {
            time: "13:30",
            title: "Local food experience",
            description: "Sample another NYC specialty in a new neighborhood.",
            estimatedCost: 28,
            duration: "1.5 hrs",
            category: "Food",
            source: "Dining digest",
          },
          {
            time: "16:30",
            title: "Bridge or waterfront walk",
            description: "Brooklyn Bridge path or a Hudson River park stroll.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "Adventure",
            source: "Waterfront map",
          },
        ],
      },
      {
        title: "Uptown contrast",
        activities: [
          {
            time: "09:30",
            title: "Visit a major local landmark",
            description: "Museum Mile or a Harlem cultural stop.",
            estimatedCost: 28,
            duration: "2.5 hrs",
            category: "Culture",
            source: "Uptown guide",
          },
          {
            time: "13:00",
            title: "Local food experience",
            description: "A standout lunch north of midtown.",
            estimatedCost: 32,
            duration: "1.5 hrs",
            category: "Food",
            source: "Food notes",
          },
          {
            time: "16:00",
            title: "Neighborhood walking tour",
            description: "Brownstone streets and park edges before evening.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "Nature",
            source: "Walking club",
          },
        ],
      },
      {
        title: "Departure day",
        activities: [
          {
            time: "09:30",
            title: "One last landmark",
            description: "A short revisit or photo stop near your stay.",
            estimatedCost: 15,
            duration: "1.5 hrs",
            category: "Culture",
            source: "Highlights list",
          },
          {
            time: "12:30",
            title: "Local food experience",
            description: "Grab a favorite bite for the road.",
            estimatedCost: 22,
            duration: "1 hr",
            category: "Food",
            source: "Quick eats",
          },
          {
            time: "15:00",
            title: "Airport or station buffer",
            description: "Build in subway/taxi time with a cushion.",
            estimatedCost: 45,
            duration: "2 hrs",
            category: "Transport",
            source: "Transit planner",
          },
        ],
      },
    ],
  },
  {
    key: "dubai",
    aliases: ["dubai"],
    label: "Dubai",
    country: "UAE",
    map: {
      lat: 25.2048,
      lng: 55.2708,
      markers: [
        { x: 30, y: 58, label: "Marina" },
        { x: 50, y: 40, label: "Downtown" },
        { x: 68, y: 52, label: "Creek" },
        { x: 78, y: 32, label: "Desert" },
      ],
    },
    sources: [
      {
        id: "db-1",
        title: "Visit Dubai Guide",
        publisher: "Dubai Tourism",
        type: "official",
      },
      {
        id: "db-2",
        title: "City & Desert Notes",
        publisher: "Gulf Travel Digest",
        type: "guide",
      },
    ],
    days: [
      {
        title: "Arrival & skyline",
        activities: [
          {
            time: "11:00",
            title: "Check in downtown or marina",
            description: "Settle in with easy access to metro or waterfront.",
            estimatedCost: 190,
            duration: "45 min",
            category: "Stay",
            source: "Hotel notes",
          },
          {
            time: "13:30",
            title: "Local food experience",
            description: "Modern Emirati or international lunch with city views.",
            estimatedCost: 40,
            duration: "1.5 hrs",
            category: "Food",
            source: "Dining guide",
          },
          {
            time: "17:00",
            title: "Visit a major local landmark",
            description: "Downtown skyline area and fountain evening atmosphere.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "Culture",
            source: "Attractions brief",
          },
        ],
      },
      {
        title: "Old Dubai & creek",
        activities: [
          {
            time: "09:00",
            title: "Explore the historic city center",
            description: "Al Fahidi, souks, and abra crossings on Dubai Creek.",
            estimatedCost: 10,
            duration: "3 hrs",
            category: "History",
            source: "Heritage walk",
          },
          {
            time: "13:00",
            title: "Local food experience",
            description: "Spices, street bites, or a traditional lunch nearby.",
            estimatedCost: 30,
            duration: "1.5 hrs",
            category: "Food",
            source: "Souk food tips",
          },
          {
            time: "16:00",
            title: "Neighborhood walking tour",
            description: "Waterfront promenades as the heat eases.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "Culture",
            source: "Creek map",
          },
        ],
      },
      {
        title: "Modern icons",
        activities: [
          {
            time: "10:00",
            title: "Visit a major local landmark",
            description: "A signature tower, museum, or framed architecture stop.",
            estimatedCost: 45,
            duration: "2.5 hrs",
            category: "Culture",
            source: "Landmark guide",
          },
          {
            time: "13:30",
            title: "Local food experience",
            description: "A polished lunch in a contemporary district.",
            estimatedCost: 50,
            duration: "1.5 hrs",
            category: "Food",
            source: "Restaurant list",
          },
          {
            time: "17:00",
            title: "Cultural attraction",
            description: "Art gallery, design district, or cultural center visit.",
            estimatedCost: 20,
            duration: "2 hrs",
            category: "Culture",
            source: "Arts calendar",
          },
        ],
      },
      {
        title: "Desert or marina day",
        activities: [
          {
            time: "09:00",
            title: "Desert or marina outing",
            description:
              "A half-day desert experience or a long marina walk — your choice.",
            estimatedCost: 80,
            duration: "4 hrs",
            category: "Adventure",
            source: "Excursion notes",
          },
          {
            time: "14:30",
            title: "Local food experience",
            description: "Recover with something cold and substantial.",
            estimatedCost: 35,
            duration: "1.5 hrs",
            category: "Food",
            source: "Casual eats",
          },
          {
            time: "18:00",
            title: "Waterfront evening",
            description: "Soft lights and an easy promenade finish.",
            estimatedCost: 0,
            duration: "1.5 hrs",
            category: "Nature",
            source: "Evening walks",
          },
        ],
      },
      {
        title: "Departure day",
        activities: [
          {
            time: "09:30",
            title: "Neighborhood walking tour",
            description: "A final short stroll near your hotel.",
            estimatedCost: 0,
            duration: "1.5 hrs",
            category: "Culture",
            source: "Area tips",
          },
          {
            time: "12:00",
            title: "Local food experience",
            description: "One last meal before transfer time.",
            estimatedCost: 30,
            duration: "1 hr",
            category: "Food",
            source: "Quick dining",
          },
          {
            time: "15:00",
            title: "Airport buffer",
            description: "Allow metro/taxi time with a comfortable cushion.",
            estimatedCost: 40,
            duration: "2 hrs",
            category: "Transport",
            source: "Transit planner",
          },
        ],
      },
    ],
  },
  {
    key: "london",
    aliases: ["london"],
    label: "London",
    country: "United Kingdom",
    map: {
      lat: 51.5074,
      lng: -0.1278,
      markers: [
        { x: 34, y: 58, label: "West End" },
        { x: 52, y: 40, label: "Southbank" },
        { x: 68, y: 50, label: "City" },
        { x: 76, y: 30, label: "East" },
      ],
    },
    sources: [
      {
        id: "ld-1",
        title: "Visit London Guide",
        publisher: "London & Partners",
        type: "official",
      },
      {
        id: "ld-2",
        title: "Neighborhood Walk Notes",
        publisher: "Thames Side Guides",
        type: "guide",
      },
    ],
    days: [
      {
        title: "Arrival by the Thames",
        activities: [
          {
            time: "11:00",
            title: "Check in centrally",
            description: "Settle near a Tube stop for easy day trips around town.",
            estimatedCost: 170,
            duration: "45 min",
            category: "Stay",
            source: "Lodging notes",
          },
          {
            time: "13:30",
            title: "Local food experience",
            description: "A classic pub lunch or market bite to start.",
            estimatedCost: 30,
            duration: "1.5 hrs",
            category: "Food",
            source: "Food guide",
          },
          {
            time: "16:30",
            title: "Explore the historic city center",
            description: "River views, bridges, and a first landmark loop.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "History",
            source: "Walking map",
          },
        ],
      },
      {
        title: "Royal & museum highlights",
        activities: [
          {
            time: "09:30",
            title: "Visit a major local landmark",
            description:
              "British Museum, National Gallery, or a palace exterior walk.",
            estimatedCost: 0,
            duration: "2.5 hrs",
            category: "Culture",
            source: "Museum brief",
          },
          {
            time: "13:00",
            title: "Local food experience",
            description: "Borough Market or a neighborhood café lunch.",
            estimatedCost: 28,
            duration: "1.5 hrs",
            category: "Food",
            source: "Market tips",
          },
          {
            time: "16:00",
            title: "Neighborhood walking tour",
            description: "Covent Garden, Soho, or Southbank at golden hour.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "Culture",
            source: "District notes",
          },
        ],
      },
      {
        title: "Parks & villages",
        activities: [
          {
            time: "10:00",
            title: "Park morning",
            description: "Hyde Park, Regent’s Park, or Hampstead Heath air.",
            estimatedCost: 0,
            duration: "2.5 hrs",
            category: "Nature",
            source: "Parks guide",
          },
          {
            time: "13:00",
            title: "Local food experience",
            description: "A cozy lunch near your park stop.",
            estimatedCost: 32,
            duration: "1.5 hrs",
            category: "Food",
            source: "Dining list",
          },
          {
            time: "16:00",
            title: "Cultural attraction",
            description: "A smaller gallery, bookshop street, or historic home.",
            estimatedCost: 18,
            duration: "2 hrs",
            category: "Culture",
            source: "Arts listing",
          },
        ],
      },
      {
        title: "East End & markets",
        activities: [
          {
            time: "10:00",
            title: "Neighborhood walking tour",
            description: "Shoreditch, Spitalfields, or Columbia Road vibes.",
            estimatedCost: 0,
            duration: "2.5 hrs",
            category: "Adventure",
            source: "East London notes",
          },
          {
            time: "13:00",
            title: "Local food experience",
            description: "Street food or a standout casual restaurant.",
            estimatedCost: 26,
            duration: "1.5 hrs",
            category: "Food",
            source: "Eats digest",
          },
          {
            time: "16:30",
            title: "Visit a major local landmark",
            description: "Sky garden views or a river pier wander.",
            estimatedCost: 15,
            duration: "2 hrs",
            category: "Culture",
            source: "Viewpoint map",
          },
        ],
      },
      {
        title: "Departure day",
        activities: [
          {
            time: "09:30",
            title: "One last stroll",
            description: "A short revisit near your hotel before checkout.",
            estimatedCost: 0,
            duration: "1.5 hrs",
            category: "Culture",
            source: "Area tips",
          },
          {
            time: "12:30",
            title: "Local food experience",
            description: "A final pastry or sandwich for the journey.",
            estimatedCost: 16,
            duration: "45 min",
            category: "Food",
            source: "Quick bites",
          },
          {
            time: "15:00",
            title: "Station or airport buffer",
            description: "Tube/Elizabeth line time with a calm cushion.",
            estimatedCost: 40,
            duration: "2 hrs",
            category: "Transport",
            source: "Transit planner",
          },
        ],
      },
    ],
  },
  {
    key: "kyoto",
    aliases: ["kyoto"],
    label: "Kyoto",
    country: "Japan",
    map: {
      lat: 35.0116,
      lng: 135.7681,
      markers: [
        { x: 22, y: 58, label: "Gion" },
        { x: 48, y: 36, label: "Fushimi" },
        { x: 68, y: 48, label: "Arashiyama" },
        { x: 78, y: 28, label: "Nara" },
      ],
    },
    sources: [
      {
        id: "ky-1",
        title: "Kyoto Official Travel Guide",
        publisher: "Kyoto City Tourism",
        type: "official",
      },
      {
        id: "ky-2",
        title: "Seasonal Walking Routes",
        publisher: "Japan Travel Digest",
        type: "guide",
      },
    ],
    days: [
      {
        title: "Arrival & Gion twilight",
        activities: [
          {
            time: "10:30",
            title: "Check in near Kawaramachi",
            description:
              "Settle into a compact mid-range hotel walking distance from the river.",
            estimatedCost: 180,
            duration: "45 min",
            category: "Stay",
            source: "Official tourism board",
          },
          {
            time: "13:00",
            title: "Nishiki Market lunch walk",
            description:
              "Sample seasonal street bites at a relaxed pace.",
            estimatedCost: 35,
            duration: "2 hrs",
            category: "Food",
            source: "Local food guide",
          },
          {
            time: "16:30",
            title: "Yasaka Shrine to Gion lanes",
            description:
              "Golden-hour stroll through preserved streets and wooden machiya facades.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "Culture",
            source: "City walking map",
          },
        ],
      },
      {
        title: "Temples & Arashiyama",
        activities: [
          {
            time: "08:00",
            title: "Fushimi Inari early visit",
            description:
              "Walk the vermilion torii tunnels before peak crowds.",
            estimatedCost: 0,
            duration: "2.5 hrs",
            category: "Culture",
            source: "Temple visitor notes",
          },
          {
            time: "12:30",
            title: "Arashiyama bamboo & riverside lunch",
            description:
              "Short bamboo grove path followed by a riverside lunch.",
            estimatedCost: 42,
            duration: "3 hrs",
            category: "Nature",
            source: "Regional travel digest",
          },
          {
            time: "16:00",
            title: "Tenryu-ji garden circuit",
            description:
              "UNESCO temple gardens with borrowed mountain scenery.",
            estimatedCost: 12,
            duration: "1.5 hrs",
            category: "History",
            source: "UNESCO brief",
          },
        ],
      },
      {
        title: "Philosophy Path & crafts",
        activities: [
          {
            time: "09:00",
            title: "Philosopher’s Path walk",
            description:
              "Canal-side corridor connecting quiet temples and cafés.",
            estimatedCost: 0,
            duration: "2 hrs",
            category: "Nature",
            source: "Walking club notes",
          },
          {
            time: "12:00",
            title: "Kaiseki-inspired lunch",
            description:
              "Seasonal multi-course lunch focused on Kyoto vegetables.",
            estimatedCost: 65,
            duration: "1.5 hrs",
            category: "Food",
            source: "Cuisine review digest",
          },
          {
            time: "15:00",
            title: "Pottery workshop in Kiyomizu area",
            description:
              "Hands-on ceramics session with a local artisan.",
            estimatedCost: 55,
            duration: "2 hrs",
            category: "Culture",
            source: "Artisan directory",
          },
        ],
      },
      {
        title: "Nara day trip",
        activities: [
          {
            time: "08:40",
            title: "Train to Nara Park",
            description:
              "Direct JR ride; morning among open lawns near Todai-ji.",
            estimatedCost: 18,
            duration: "1 hr",
            category: "Transport",
            source: "JR timetable summary",
          },
          {
            time: "10:30",
            title: "Todai-ji Great Buddha Hall",
            description:
              "Iconic wooden hall and bronze Buddha with park paths nearby.",
            estimatedCost: 8,
            duration: "2 hrs",
            category: "History",
            source: "Temple official guide",
          },
          {
            time: "14:00",
            title: "Naramachi café & craft streets",
            description:
              "Wander lattice-front houses and pick up small gifts.",
            estimatedCost: 28,
            duration: "2.5 hrs",
            category: "Shopping",
            source: "Neighborhood guide",
          },
        ],
      },
      {
        title: "Slow morning & departure",
        activities: [
          {
            time: "08:30",
            title: "Matcha breakfast tasting",
            description:
              "Quiet tearoom breakfast with seasonal wagashi.",
            estimatedCost: 22,
            duration: "1 hr",
            category: "Food",
            source: "Tea house listing",
          },
          {
            time: "11:00",
            title: "Souvenir hour at Teramachi",
            description:
              "Lightweight gifts — washi, incense, and snacks.",
            estimatedCost: 40,
            duration: "1.5 hrs",
            category: "Shopping",
            source: "Retail roundup",
          },
          {
            time: "14:00",
            title: "Airport transfer buffer",
            description:
              "Reserved express transfer with cushion time.",
            estimatedCost: 45,
            duration: "2 hrs",
            category: "Transport",
            source: "Transit planner",
          },
        ],
      },
    ],
  },
];

const GENERIC_DAY_TITLES = [
  "Arrival & orientation",
  "Landmarks & local flavor",
  "Neighborhoods & culture",
  "Food & open time",
  "Flexible finale",
] as const;

const GENERIC_ACTIVITY_PATTERNS = [
  {
    time: "09:30",
    title: "Explore the historic city center",
    description: (place: string) =>
      `Temporary mock stop: wander the central streets and plazas of ${place}.`,
    estimatedCost: 0,
    duration: "2 hrs",
    category: "History",
    source: "Mock itinerary template",
  },
  {
    time: "12:30",
    title: "Local food experience",
    description: (place: string) =>
      `Temporary mock stop: sample a popular local lunch in ${place}.`,
    estimatedCost: 30,
    duration: "1.5 hrs",
    category: "Food",
    source: "Mock itinerary template",
  },
  {
    time: "16:00",
    title: "Visit a major local landmark",
    description: (place: string) =>
      `Temporary mock stop: see a signature landmark visitors often prioritize in ${place}.`,
    estimatedCost: 20,
    duration: "2 hrs",
    category: "Culture",
    source: "Mock itinerary template",
  },
] as const;

const GENERIC_ALT_PATTERNS = [
  {
    time: "10:00",
    title: "Neighborhood walking tour",
    description: (place: string) =>
      `Temporary mock stop: a relaxed district walk to get a feel for daily life in ${place}.`,
    estimatedCost: 0,
    duration: "2.5 hrs",
    category: "Culture",
    source: "Mock itinerary template",
  },
  {
    time: "13:30",
    title: "Local food experience",
    description: (place: string) =>
      `Temporary mock stop: another casual bite while exploring ${place}.`,
    estimatedCost: 28,
    duration: "1.5 hrs",
    category: "Food",
    source: "Mock itinerary template",
  },
  {
    time: "16:30",
    title: "Cultural attraction",
    description: (place: string) =>
      `Temporary mock stop: a museum, gallery, or cultural site in ${place}.`,
    estimatedCost: 18,
    duration: "2 hrs",
    category: "Culture",
    source: "Mock itinerary template",
  },
] as const;

function normalizeDestination(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitUserDestination(destination: string) {
  const parts = destination
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { primary: "Your destination", countryFromUser: "" };
  }

  if (parts.length === 1) {
    return { primary: parts[0]!, countryFromUser: "" };
  }

  return {
    primary: parts[0]!,
    countryFromUser: parts.slice(1).join(", "),
  };
}

function matchesAlias(normalized: string, alias: string) {
  if (normalized === alias) return true;

  const tokens = normalized.split(" ").filter(Boolean);

  // Short aliases (la, sf, nyc) must match a whole token to avoid false positives.
  if (alias.length <= 3) {
    return tokens.includes(alias);
  }

  if (alias.includes(" ")) {
    return (
      normalized === alias ||
      normalized.startsWith(`${alias} `) ||
      normalized.endsWith(` ${alias}`) ||
      normalized.includes(` ${alias} `)
    );
  }

  return tokens.includes(alias);
}

function matchDestinationMock(destination: string): DestinationMock | null {
  const normalized = normalizeDestination(destination);
  if (!normalized) return null;

  // Prefer longer / more specific alias matches.
  const ranked = DESTINATION_MOCKS.flatMap((mock) =>
    mock.aliases.map((alias) => ({
      mock,
      alias,
      score: alias.length,
    })),
  ).sort((a, b) => b.score - a.score);

  for (const entry of ranked) {
    if (matchesAlias(normalized, entry.alias)) {
      return entry.mock;
    }
  }

  return null;
}

function toTripDays(
  templates: DestinationMock["days"],
  days: number,
  currency: Currency,
  destinationKey: string,
): TripDay[] {
  const count = Math.max(1, Math.min(14, days));

  return Array.from({ length: count }, (_, index) => {
    const template = templates[index % templates.length]!;
    const dayNumber = index + 1;

    return {
      day: dayNumber,
      title:
        index < templates.length
          ? template.title
          : `${template.title} (day ${dayNumber})`,
      dateLabel: `Day ${dayNumber}`,
      activities: template.activities.map((activity, activityIndex) => ({
        id: `${destinationKey}-d${dayNumber}-a${activityIndex + 1}`,
        time: activity.time,
        title: activity.title,
        description: activity.description,
        estimatedCost: Math.round(activity.estimatedCost * BUDGET_SCALE),
        currency,
        duration: activity.duration,
        category: activity.category,
        source: activity.source,
      })),
    };
  });
}

function buildGenericItinerary(
  placeName: string,
  days: number,
  currency: Currency,
): TripDay[] {
  const count = Math.max(1, Math.min(14, days));

  return Array.from({ length: count }, (_, index) => {
    const dayNumber = index + 1;
    const patterns =
      index % 2 === 0 ? GENERIC_ACTIVITY_PATTERNS : GENERIC_ALT_PATTERNS;

    return {
      day: dayNumber,
      title: GENERIC_DAY_TITLES[index % GENERIC_DAY_TITLES.length]!,
      dateLabel: `Day ${dayNumber}`,
      activities: patterns.map((pattern, activityIndex) => ({
        id: `generic-d${dayNumber}-a${activityIndex + 1}`,
        time: pattern.time,
        title: pattern.title,
        description: pattern.description(placeName),
        estimatedCost: pattern.estimatedCost,
        currency,
        duration: pattern.duration,
        category: pattern.category,
        source: pattern.source,
      })),
    };
  });
}

const GENERIC_MARKERS: MapMarker[] = [
  { x: 28, y: 58, label: "Center" },
  { x: 48, y: 38, label: "Landmark" },
  { x: 66, y: 50, label: "Food" },
  { x: 78, y: 30, label: "Walk" },
];

/**
 * Returns destination-aware mock itinerary data.
 * Never mixes one destination's activities with another.
 */
export function getMockItinerary(
  destination: string,
  days: number,
  currency: Currency = "USD",
): MockItineraryResult {
  const { primary, countryFromUser } = splitUserDestination(destination);
  const matched = matchDestinationMock(destination);

  if (matched) {
    return {
      key: matched.key,
      destinationLabel: primary,
      country: countryFromUser || matched.country,
      isGeneric: false,
      map: {
        label: countryFromUser
          ? `${primary}, ${countryFromUser}`
          : `${matched.label}, ${matched.country}`,
        lat: matched.map.lat,
        lng: matched.map.lng,
        markers: matched.map.markers,
      },
      sources: matched.sources,
      itinerary: toTripDays(matched.days, days, currency, matched.key),
    };
  }

  return {
    key: "generic",
    destinationLabel: primary,
    country: countryFromUser,
    isGeneric: true,
    map: {
      label: countryFromUser ? `${primary}, ${countryFromUser}` : primary,
      lat: 20,
      lng: 0,
      markers: GENERIC_MARKERS,
    },
    sources: [
      {
        id: "generic-1",
        title: "Temporary mock sources",
        publisher: "TripMind Preview",
        type: "guide",
      },
      {
        id: "generic-2",
        title: "Placeholder destination notes",
        publisher: "TripMind Preview",
        type: "blog",
      },
    ],
    itinerary: buildGenericItinerary(primary, days, currency),
  };
}

export function getSupportedMockDestinations() {
  return DESTINATION_MOCKS.map((mock) => ({
    key: mock.key,
    label: mock.label,
    country: mock.country,
    aliases: mock.aliases,
  }));
}

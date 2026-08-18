/** Deterministic destination → local ISO currency mapping. */

const COUNTRY_CURRENCY: Array<{ pattern: RegExp; currency: string }> = [
  { pattern: /\b(france|paris|lyon|marseille|nice|bordeaux)\b/i, currency: "EUR" },
  { pattern: /\b(japan|tokyo|kyoto|osaka|hiroshima)\b/i, currency: "JPY" },
  {
    pattern:
      /\b(united states|usa|u\.s\.a\.|new york|san francisco|los angeles|chicago|boston|seattle|miami)\b/i,
    currency: "USD",
  },
  {
    pattern: /\b(united kingdom|uk|england|scotland|london|edinburgh|manchester)\b/i,
    currency: "GBP",
  },
  { pattern: /\b(india|delhi|mumbai|bengaluru|jaipur|goa)\b/i, currency: "INR" },
  { pattern: /\b(germany|berlin|munich|hamburg|cologne)\b/i, currency: "EUR" },
  { pattern: /\b(italy|rome|milan|florence|venice|naples)\b/i, currency: "EUR" },
  { pattern: /\b(spain|madrid|barcelona|seville|valencia)\b/i, currency: "EUR" },
  { pattern: /\b(portugal|lisbon|porto)\b/i, currency: "EUR" },
  { pattern: /\b(netherlands|amsterdam|rotterdam)\b/i, currency: "EUR" },
  { pattern: /\b(canada|toronto|vancouver|montreal)\b/i, currency: "CAD" },
  { pattern: /\b(australia|sydney|melbourne|brisbane)\b/i, currency: "AUD" },
  { pattern: /\b(switzerland|zurich|geneva)\b/i, currency: "CHF" },
  { pattern: /\b(singapore)\b/i, currency: "SGD" },
  { pattern: /\b(thailand|bangkok|chiang mai)\b/i, currency: "THB" },
  { pattern: /\b(south korea|seoul|busan)\b/i, currency: "KRW" },
  { pattern: /\b(mexico|mexico city|cancun)\b/i, currency: "MXN" },
  { pattern: /\b(brazil|rio|sao paulo)\b/i, currency: "BRL" },
  { pattern: /\b(morocco|marrakech|casablanca)\b/i, currency: "MAD" },
  { pattern: /\b(iceland|reykjavik)\b/i, currency: "ISK" },
  { pattern: /\b(uae|dubai|abu dhabi)\b/i, currency: "AED" },
  { pattern: /\b(turkey|istanbul)\b/i, currency: "TRY" },
  { pattern: /\b(vietnam|hanoi|ho chi minh)\b/i, currency: "VND" },
  { pattern: /\b(indonesia|bali|jakarta)\b/i, currency: "IDR" },
  { pattern: /\b(new zealand|auckland|wellington)\b/i, currency: "NZD" },
];

export function resolveLocalCurrency(
  destination: string,
  country: string | null = null,
): string | null {
  const blob = `${destination} ${country ?? ""}`.trim();
  if (!blob) return null;
  for (const entry of COUNTRY_CURRENCY) {
    if (entry.pattern.test(blob)) return entry.currency;
  }
  return null;
}

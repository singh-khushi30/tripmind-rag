export type IsoCurrency = string;

export type ExchangeRateStatus =
  | "live_or_latest"
  | "cached"
  | "unavailable"
  | "not_required";

export type ExchangeRateResult = {
  source_currency: IsoCurrency;
  target_currency: IsoCurrency;
  rate: number | null;
  fetched_date: string | null;
  status: ExchangeRateStatus;
};

export const FRANKFURTER_BASE_URL = "https://api.frankfurter.app";
export const EXCHANGE_TIMEOUT_MS = 8_000;
export const EXCHANGE_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

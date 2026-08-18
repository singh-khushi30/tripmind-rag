import "server-only";

import {
  EXCHANGE_CACHE_TTL_MS,
  EXCHANGE_TIMEOUT_MS,
  FRANKFURTER_BASE_URL,
  type ExchangeRateResult,
} from "@/lib/currency/constants";

export { convertAmount } from "@/lib/currency/convert";
export type {
  ExchangeRateResult,
  ExchangeRateStatus,
} from "@/lib/currency/constants";

type CacheEntry = {
  expires_at: number;
  result: ExchangeRateResult;
};

const memoryCache = new Map<string, CacheEntry>();

function normalizeCurrency(code: string): string {
  return code.trim().toUpperCase();
}

export async function fetchExchangeRate(input: {
  sourceCurrency: string;
  targetCurrency: string;
  fetchImpl?: typeof fetch;
}): Promise<ExchangeRateResult> {
  const source = normalizeCurrency(input.sourceCurrency);
  const target = normalizeCurrency(input.targetCurrency);

  if (!/^[A-Z]{3}$/.test(source) || !/^[A-Z]{3}$/.test(target)) {
    return {
      source_currency: source,
      target_currency: target,
      rate: null,
      fetched_date: null,
      status: "unavailable",
    };
  }

  if (source === target) {
    return {
      source_currency: source,
      target_currency: target,
      rate: 1,
      fetched_date: new Date().toISOString().slice(0, 10),
      status: "not_required",
    };
  }

  const key = `${source}:${target}`;
  const cached = memoryCache.get(key);
  if (cached && cached.expires_at > Date.now()) {
    return { ...cached.result, status: "cached" };
  }

  const url = new URL(`${FRANKFURTER_BASE_URL}/latest`);
  url.searchParams.set("from", source);
  url.searchParams.set("to", target);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXCHANGE_TIMEOUT_MS);

  try {
    const response = await (input.fetchImpl ?? fetch)(url.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      return {
        source_currency: source,
        target_currency: target,
        rate: null,
        fetched_date: null,
        status: "unavailable",
      };
    }

    const payload = (await response.json()) as {
      date?: string;
      rates?: Record<string, number>;
    };
    const rate = payload.rates?.[target];
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      return {
        source_currency: source,
        target_currency: target,
        rate: null,
        fetched_date: null,
        status: "unavailable",
      };
    }

    const result: ExchangeRateResult = {
      source_currency: source,
      target_currency: target,
      rate,
      fetched_date: payload.date ?? new Date().toISOString().slice(0, 10),
      status: "live_or_latest",
    };

    memoryCache.set(key, {
      expires_at: Date.now() + EXCHANGE_CACHE_TTL_MS,
      result,
    });

    return result;
  } catch {
    return {
      source_currency: source,
      target_currency: target,
      rate: null,
      fetched_date: null,
      status: "unavailable",
    };
  } finally {
    clearTimeout(timer);
  }
}

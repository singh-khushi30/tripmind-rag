import { describe, expect, it, vi } from "vitest";

import { convertAmount } from "@/lib/currency/convert";
import { fetchExchangeRate } from "@/lib/currency/exchange-rate";
import { resolveLocalCurrency } from "@/lib/currency/local-currency";

describe("local currency mapping", () => {
  it("resolves common destinations deterministically", () => {
    expect(resolveLocalCurrency("Paris", "France")).toBe("EUR");
    expect(resolveLocalCurrency("Tokyo, Japan")).toBe("JPY");
    expect(resolveLocalCurrency("New York", "United States")).toBe("USD");
    expect(resolveLocalCurrency("London", "United Kingdom")).toBe("GBP");
  });
});

describe("currency conversion", () => {
  it("converts with a provided rate", () => {
    expect(convertAmount(2500, 0.0068)).toBe(17);
  });

  it("returns null when rate unavailable", () => {
    expect(convertAmount(100, null)).toBeNull();
  });

  it("keeps same-currency conversion at 1", async () => {
    const result = await fetchExchangeRate({
      sourceCurrency: "USD",
      targetCurrency: "USD",
    });
    expect(result.rate).toBe(1);
    expect(result.status).toBe("not_required");
  });

  it("falls back gracefully when API fails", async () => {
    const fetchImpl = vi.fn(async () => new Response("boom", { status: 500 }));
    const result = await fetchExchangeRate({
      sourceCurrency: "JPY",
      targetCurrency: "USD",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result.rate).toBeNull();
    expect(result.status).toBe("unavailable");
  });

  it("parses a live Frankfurter-shaped payload", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        amount: 1,
        base: "JPY",
        date: "2026-08-11",
        rates: { USD: 0.0068 },
      }),
    );
    const result = await fetchExchangeRate({
      sourceCurrency: "JPY",
      targetCurrency: "USD",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result.rate).toBe(0.0068);
    expect(result.status).toBe("live_or_latest");
  });
});

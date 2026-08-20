import { describe, expect, it } from "vitest";

import {
  isSessionExpired,
  resolveSessionStartedAtMs,
} from "@/lib/auth/session-timeout";

describe("session timeout", () => {
  it("expires after one hour", () => {
    const started = Date.parse("2026-08-19T10:00:00.000Z");
    const almostHour = Date.parse("2026-08-19T10:59:59.000Z");
    const afterHour = Date.parse("2026-08-19T11:00:00.000Z");
    const maxAge = 60 * 60 * 1000;

    expect(isSessionExpired(started, almostHour, maxAge)).toBe(false);
    expect(isSessionExpired(started, afterHour, maxAge)).toBe(true);
  });

  it("prefers cookie timestamp over last_sign_in_at", () => {
    expect(
      resolveSessionStartedAtMs({
        cookieValue: "1000",
        lastSignInAt: "2026-08-19T10:00:00.000Z",
      }),
    ).toBe(1000);
  });

  it("falls back to last_sign_in_at when cookie missing", () => {
    expect(
      resolveSessionStartedAtMs({
        cookieValue: null,
        lastSignInAt: "2026-08-19T10:00:00.000Z",
      }),
    ).toBe(Date.parse("2026-08-19T10:00:00.000Z"));
  });
});

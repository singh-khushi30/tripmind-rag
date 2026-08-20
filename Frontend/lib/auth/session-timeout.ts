/** App-enforced auth session lifetime (independent of Supabase refresh tokens). */

export const SESSION_STARTED_COOKIE = "tm_session_started_at";

/** Default: 1 hour. Override with SESSION_MAX_AGE_HOURS env (e.g. "1"). */
export function getSessionMaxAgeMs(): number {
  const raw = process.env.SESSION_MAX_AGE_HOURS?.trim();
  const hours = raw ? Number(raw) : 1;
  if (!Number.isFinite(hours) || hours <= 0) return 60 * 60 * 1000;
  return Math.round(hours * 60 * 60 * 1000);
}

export function isSessionExpired(
  startedAtMs: number,
  nowMs = Date.now(),
  maxAgeMs = getSessionMaxAgeMs(),
): boolean {
  if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) return true;
  return nowMs - startedAtMs >= maxAgeMs;
}

export function resolveSessionStartedAtMs(input: {
  cookieValue?: string | null;
  lastSignInAt?: string | null;
}): number | null {
  const fromCookie = Number(input.cookieValue);
  if (Number.isFinite(fromCookie) && fromCookie > 0) return fromCookie;

  if (input.lastSignInAt) {
    const fromSignIn = new Date(input.lastSignInAt).getTime();
    if (Number.isFinite(fromSignIn) && fromSignIn > 0) return fromSignIn;
  }

  return null;
}

export function sessionStartedCookieOptions(maxAgeSeconds?: number) {
  const maxAge =
    maxAgeSeconds ?? Math.ceil(getSessionMaxAgeMs() / 1000);
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

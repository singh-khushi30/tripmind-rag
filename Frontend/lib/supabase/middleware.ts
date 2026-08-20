import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  isSessionExpired,
  resolveSessionStartedAtMs,
  SESSION_STARTED_COOKIE,
  sessionStartedCookieOptions,
} from "@/lib/auth/session-timeout";
import { getSupabaseEnv } from "@/lib/supabase/env";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/trip",
  "/saved-trips",
  "/api/trips",
];
const AUTH_ROUTES = ["/login", "/signup"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh the session and validate the JWT — do not use getSession() for auth.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let activeUser = user;

  if (activeUser) {
    const startedAt = resolveSessionStartedAtMs({
      cookieValue: request.cookies.get(SESSION_STARTED_COOKIE)?.value,
      lastSignInAt: activeUser.last_sign_in_at,
    });

    if (startedAt == null || isSessionExpired(startedAt)) {
      await supabase.auth.signOut();
      supabaseResponse.cookies.set(SESSION_STARTED_COOKIE, "", {
        ...sessionStartedCookieOptions(0),
        maxAge: 0,
      });
      activeUser = null;
    }
  }

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!activeUser && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    redirectUrl.searchParams.set("reason", "session_expired");
    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    redirectResponse.cookies.set(SESSION_STARTED_COOKIE, "", {
      ...sessionStartedCookieOptions(0),
      maxAge: 0,
    });
    return redirectResponse;
  }

  if (activeUser && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.searchParams.delete("next");
    redirectUrl.searchParams.delete("reason");
    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}

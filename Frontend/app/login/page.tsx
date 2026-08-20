import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your TripMind account.",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; reason?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/dashboard";
  const sessionExpired = params.reason === "session_expired";

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to TripMind"
      description="Access your dashboard, saved trips, and personalized plans."
    >
      {sessionExpired ? (
        <div
          role="status"
          className="border-border/80 bg-secondary/50 text-muted-foreground mb-5 rounded-2xl border px-4 py-3 text-sm"
        >
          Your session expired after 1 hour. Please sign in again.
        </div>
      ) : null}
      <LoginForm nextPath={nextPath} />
    </AuthShell>
  );
}

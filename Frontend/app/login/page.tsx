import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your TripMind account.",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/dashboard";

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to TripMind"
      description="Access your dashboard, saved trips, and personalized plans."
    >
      <LoginForm nextPath={nextPath} />
    </AuthShell>
  );
}

import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your TripMind account.",
};

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      description="Save itineraries and pick up planning wherever you left off."
    >
      <SignupForm />
    </AuthShell>
  );
}

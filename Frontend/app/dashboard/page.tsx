import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bookmark, Map } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your TripMind home for planning and saved trips.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email ||
    "traveler";

  return (
    <Container className="space-y-10 py-10 sm:py-14">
      <div className="space-y-3">
        <p className="text-brand text-xs font-medium tracking-[0.16em] uppercase">
          Dashboard
        </p>
        <h1 className="font-heading text-foreground text-4xl tracking-tight sm:text-5xl">
          Welcome back, {displayName.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed sm:text-base">
          Plan a new trip or revisit the itineraries you’ve already saved.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="surface-card space-y-4 p-6">
          <div className="bg-secondary text-brand flex size-11 items-center justify-center rounded-2xl">
            <Map className="size-5" strokeWidth={1.75} />
          </div>
          <h2 className="text-foreground text-lg font-medium tracking-tight">
            Plan a trip
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Share your destination, budget, and style to generate a day-by-day
            preview.
          </p>
          <Button render={<Link href="/trip/plan" />}>
            Start planning
            <ArrowRight data-icon="inline-end" />
          </Button>
        </article>

        <article className="surface-card space-y-4 p-6">
          <div className="bg-secondary text-brand flex size-11 items-center justify-center rounded-2xl">
            <Bookmark className="size-5" strokeWidth={1.75} />
          </div>
          <h2 className="text-foreground text-lg font-medium tracking-tight">
            Saved trips
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Open your saved itineraries and continue where you left off.
          </p>
          <Button variant="outline" render={<Link href="/saved-trips" />}>
            View saved trips
            <ArrowRight data-icon="inline-end" />
          </Button>
        </article>
      </div>
    </Container>
  );
}

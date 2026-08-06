import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PlannerForm } from "@/components/trip/planner-form";

export const metadata: Metadata = {
  title: "Plan Your Trip",
  description:
    "Tell TripMind where you’re going — destination, budget, style, and interests.",
};

export default function TripPlanPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-3 text-center sm:text-left">
          <p className="text-brand text-xs font-medium tracking-[0.16em] uppercase">
            Trip planner
          </p>
          <h1 className="font-heading text-foreground text-4xl tracking-tight sm:text-5xl">
            Shape the trip before it shapes your week
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed sm:text-base">
            Share your destination, budget, and travel style — we’ll shape a
            clear day-by-day plan around what matters to you.
          </p>
        </div>
        <PlannerForm />
      </div>
    </Container>
  );
}

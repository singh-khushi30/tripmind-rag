import Link from "next/link";

import { Container } from "@/components/layout/container";

const LINKS = [
  { href: "/trip/plan", label: "Plan a trip" },
  { href: "/trip/results", label: "View demo" },
  { href: "/saved-trips", label: "Saved trips" },
];

export function Footer() {
  return (
    <footer className="border-border/70 mt-auto border-t">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="font-heading text-foreground text-2xl tracking-tight">
            TripMind
          </p>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            Personalized AI travel planning with budget-aware itineraries.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </Container>
      <div className="border-border/70 border-t">
        <Container className="text-muted-foreground flex h-12 items-center text-xs">
          © {new Date().getFullYear()} TripMind. Plan smarter. Travel better.
        </Container>
      </div>
    </footer>
  );
}

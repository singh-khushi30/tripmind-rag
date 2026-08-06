import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <section className="relative overflow-hidden py-12 sm:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="from-brand/20 via-accent/30 absolute -top-24 left-1/2 h-[24rem] w-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-br to-transparent blur-3xl" />
        <div className="hero-grid absolute inset-0 opacity-50" />
      </div>

      <Container className="relative">
        <div className="mx-auto max-w-md space-y-8">
          <div className="space-y-3 text-center">
            <p className="text-brand text-xs font-medium tracking-[0.16em] uppercase">
              {eyebrow}
            </p>
            <h1 className="font-heading text-foreground text-4xl tracking-tight">
              {title}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
          </div>
          <div className="surface-card p-6 sm:p-8">{children}</div>
        </div>
      </Container>
    </section>
  );
}

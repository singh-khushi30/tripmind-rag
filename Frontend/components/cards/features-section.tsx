"use client";

import {
  CalendarDays,
  Compass,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

import { FeatureCard } from "@/components/cards/feature-card";
import { Container } from "@/components/layout/container";
import { FEATURES } from "@/data/mock/planner-options";
import { fadeUp, staggerContainer } from "@/lib/motion";

const ICONS: Record<(typeof FEATURES)[number]["icon"], LucideIcon> = {
  Sparkles,
  Wallet,
  CalendarDays,
  Compass,
};

export function FeaturesSection() {
  return (
    <section className="py-8 sm:py-12">
      <Container>
        <div className="mb-10 max-w-2xl">
          <p className="text-brand text-xs font-medium tracking-[0.16em] uppercase">
            Why TripMind
          </p>
          <h2 className="font-heading text-foreground mt-3 text-4xl tracking-tight sm:text-5xl">
            Built for clarity, not clutter
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">
            Premium planning UI with the restraint of Linear, the polish of
            Vercel, and the wanderlust of a well-made travel product.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-4 sm:grid-cols-2"
        >
          {FEATURES.map((feature) => (
            <motion.div key={feature.title} variants={fadeUp}>
              <FeatureCard
                title={feature.title}
                description={feature.description}
                icon={ICONS[feature.icon]}
              />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

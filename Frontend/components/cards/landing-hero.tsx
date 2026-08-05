"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

import { LandingPreview } from "@/components/cards/landing-preview";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="from-brand/20 via-accent/30 absolute -top-24 left-1/2 h-[28rem] w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-br to-transparent blur-3xl" />
        <div className="hero-grid absolute inset-0 opacity-60" />
      </div>

      <Container className="relative">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <motion.p
            variants={fadeUp}
            className="font-heading text-brand mb-5 text-4xl tracking-tight sm:text-5xl"
          >
            TripMind
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="font-heading text-foreground text-5xl leading-[1.05] tracking-tight text-balance sm:text-6xl md:text-7xl"
          >
            Plan smarter. Travel better.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-muted-foreground mt-5 max-w-xl text-base leading-relaxed text-pretty sm:text-lg"
          >
            Create personalized, source-grounded itineraries with realistic
            budgets, thoughtful pacing, and trusted travel insights.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              className="h-12 px-6 text-base"
              render={<Link href="/plan" />}
            >
              Plan Your Trip
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-6 text-base"
              render={<Link href="/results" />}
            >
              <Play data-icon="inline-start" />
              View Demo
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14"
        >
          <LandingPreview />
        </motion.div>
      </Container>
    </section>
  );
}

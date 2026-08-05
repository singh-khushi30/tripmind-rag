"use client";

import { motion } from "framer-motion";

import { Container } from "@/components/layout/container";
import { HOW_IT_WORKS } from "@/data/mock/planner-options";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function HowItWorks() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="mb-10 max-w-2xl">
          <p className="text-brand text-xs font-medium tracking-[0.16em] uppercase">
            How it works
          </p>
          <h2 className="font-heading text-foreground mt-3 text-4xl tracking-tight sm:text-5xl">
            Three quiet steps to a clear plan
          </h2>
        </div>

        <motion.ol
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          className="grid gap-4 md:grid-cols-3"
        >
          {HOW_IT_WORKS.map((item) => (
            <motion.li
              key={item.step}
              variants={fadeUp}
              className="surface-card p-6"
            >
              <span className="text-brand font-mono text-xs tracking-[0.18em]">
                {item.step}
              </span>
              <h3 className="text-foreground mt-4 text-lg font-medium tracking-tight">
                {item.title}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {item.description}
              </p>
            </motion.li>
          ))}
        </motion.ol>
      </Container>
    </section>
  );
}

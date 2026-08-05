"use client";

import { Clock3, Wallet } from "lucide-react";

import { DestinationImage } from "@/components/ui/destination-image";
import { DESTINATION_IMAGES } from "@/lib/destinations";

const STOPS = [
  { time: "08:00", title: "Fushimi Inari", note: "Temple walk" },
  { time: "12:30", title: "Nishiki Market", note: "Lunch bites" },
  { time: "16:30", title: "Gion lanes", note: "Golden hour" },
] as const;

export function LandingPreview() {
  const kyoto = DESTINATION_IMAGES.kyoto;

  return (
    <div className="surface-card relative mx-auto max-w-4xl overflow-hidden p-0">
      <div className="from-brand/20 absolute inset-0 bg-gradient-to-br via-[#e7f3f6]/80 to-[#eef2f7]" />
      <div className="relative grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 p-6 sm:p-8">
          <p className="text-brand text-xs font-medium tracking-[0.16em] uppercase">
            Preview
          </p>
          <p className="font-heading text-foreground text-3xl tracking-tight">
            Kyoto in five unhurried days
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Temples at sunrise, market lunches, and a riverside evening —
            budgeted and thoughtfully paced.
          </p>

          <ul className="space-y-2.5 pt-1">
            {STOPS.map((stop, index) => (
              <li
                key={stop.title}
                className="bg-card/80 flex items-center gap-3 rounded-2xl px-3 py-2.5 shadow-sm ring-1 ring-black/5"
              >
                <span className="bg-brand/15 text-brand flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">
                    {stop.title}
                  </p>
                  <p className="text-muted-foreground text-xs">{stop.note}</p>
                </div>
                <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                  <Clock3 className="size-3" />
                  {stop.time}
                </span>
              </li>
            ))}
          </ul>

          <div className="bg-card/85 flex items-center justify-between rounded-2xl px-3.5 py-3 shadow-sm ring-1 ring-black/5">
            <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
              <Wallet className="text-brand size-4" />
              Trip budget
            </span>
            <span className="font-heading text-foreground text-xl tracking-tight">
              $3,200
            </span>
          </div>
        </div>

        <div className="border-border/60 relative flex min-h-72 flex-col border-t md:border-t-0 md:border-l">
          <DestinationImage
            src={kyoto.src}
            alt={kyoto.alt}
            className="h-40 w-full md:h-44"
            rounded="none"
            sizes="(max-width: 768px) 100vw, 420px"
            priority
          />

          <div className="relative min-h-40 flex-1 p-4">
            <div className="absolute inset-4 overflow-hidden rounded-2xl bg-[#dce8ef] shadow-[var(--shadow-soft)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,oklch(0.78_0.05_200/0.5),transparent_45%)]" />
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden
              >
                <g stroke="oklch(0.55 0.03 240 / 0.2)" strokeWidth="0.4">
                  <path d="M10 25 H90" />
                  <path d="M10 50 H90" />
                  <path d="M10 75 H90" />
                  <path d="M30 10 V90" />
                  <path d="M55 10 V90" />
                  <path d="M80 10 V90" />
                </g>
                <path
                  d="M24 68 C36 52, 48 40, 58 44 S72 58, 78 34"
                  fill="none"
                  stroke="oklch(0.48 0.09 205)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeDasharray="2 1.4"
                />
                {[
                  [24, 68],
                  [58, 44],
                  [78, 34],
                ].map(([x, y], i) => (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="2.4"
                    fill="oklch(0.48 0.09 205)"
                    stroke="white"
                    strokeWidth="0.8"
                  />
                ))}
              </svg>
              <div className="absolute inset-x-3 bottom-3 rounded-xl bg-white/90 px-3 py-2 backdrop-blur">
                <p className="text-foreground text-xs font-medium">
                  Kyoto day route
                </p>
                <p className="text-muted-foreground text-[11px]">
                  3 stops · walkable core
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

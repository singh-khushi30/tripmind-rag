"use client";

import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { TripMapMarker } from "@/types/trip";

type MapPlaceholderProps = {
  label: string;
  lat: number;
  lng: number;
  markers?: TripMapMarker[];
  className?: string;
};

const FALLBACK_MARKERS: TripMapMarker[] = [
  { x: 28, y: 58, label: "Center" },
  { x: 48, y: 38, label: "Landmark" },
  { x: 66, y: 50, label: "Food" },
  { x: 78, y: 30, label: "Walk" },
];

export function MapPlaceholder({
  label,
  lat,
  lng,
  markers = FALLBACK_MARKERS,
  className,
}: MapPlaceholderProps) {
  const routeMarkers = markers.length > 0 ? markers : FALLBACK_MARKERS;

  return (
    <div
      className={cn(
        "surface-card relative min-h-72 overflow-hidden p-0",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[#dce8ef]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,oklch(0.78_0.05_200/0.55),transparent_42%),radial-gradient(circle_at_75%_65%,oklch(0.82_0.04_150/0.4),transparent_40%)]" />

      <div className="absolute top-[18%] left-[12%] h-24 w-36 rounded-full bg-[#c5d9c8]/55 blur-2xl" />
      <div className="absolute right-[10%] bottom-[28%] h-28 w-40 rounded-full bg-[#b9cfe0]/50 blur-2xl" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <g stroke="oklch(0.55 0.03 240 / 0.18)" strokeWidth="0.35">
          <path d="M8 20 H92" />
          <path d="M8 40 H92" />
          <path d="M8 60 H92" />
          <path d="M8 80 H92" />
          <path d="M20 8 V92" />
          <path d="M40 8 V92" />
          <path d="M60 8 V92" />
          <path d="M80 8 V92" />
        </g>

        <path
          d="M22 58 C30 50, 38 42, 48 36 S62 42, 68 48 S74 34, 78 28"
          fill="none"
          stroke="oklch(0.48 0.09 205)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2.2 1.6"
          className="drop-shadow-sm"
        />
        <path
          d="M22 58 C30 50, 38 42, 48 36 S62 42, 68 48 S74 34, 78 28"
          fill="none"
          stroke="oklch(0.48 0.09 205 / 0.25)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>

      {routeMarkers.map((marker, index) => (
        <motion.div
          key={`${marker.label}-${index}`}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + index * 0.08, duration: 0.4 }}
        >
          <div className="flex flex-col items-center">
            <span className="mb-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-[oklch(0.28_0.04_240)] shadow-sm">
              {marker.label}
            </span>
            <span className="bg-brand text-brand-foreground flex size-6 items-center justify-center rounded-full shadow-[var(--shadow-soft)] ring-2 ring-white/80">
              <MapPin className="size-3" />
            </span>
          </div>
        </motion.div>
      ))}

      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="rounded-2xl bg-white/90 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-foreground text-sm font-medium">{label}</p>
              <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </p>
            </div>
            <span className="bg-secondary text-brand rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase">
              Day route
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

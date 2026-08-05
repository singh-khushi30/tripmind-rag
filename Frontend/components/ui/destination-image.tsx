"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";

import { FALLBACK_TRAVEL_IMAGE } from "@/lib/destinations";
import { cn } from "@/lib/utils";

type DestinationImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  overlay?: boolean;
  rounded?: "top" | "all" | "none";
};

const TONE_FALLBACK =
  "bg-gradient-to-br from-brand/25 via-accent to-secondary";

export function DestinationImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
  overlay = true,
  rounded = "top",
}: DestinationImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeSrc, setActiveSrc] = useState(src);

  const roundedClass =
    rounded === "top"
      ? "rounded-t-2xl"
      : rounded === "all"
        ? "rounded-2xl"
        : "";

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden",
        roundedClass,
        className,
      )}
    >
      {!loaded && !failed ? (
        <div
          className={cn(
            "absolute inset-0 animate-pulse",
            TONE_FALLBACK,
            roundedClass,
          )}
          aria-hidden
        />
      ) : null}

      {failed ? (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            TONE_FALLBACK,
          )}
        >
          <ImageOff className="text-brand/70 size-7" aria-hidden />
          <span className="sr-only">Image unavailable for {alt}</span>
        </div>
      ) : (
        <Image
          src={activeSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            "object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (activeSrc !== FALLBACK_TRAVEL_IMAGE) {
              setLoaded(false);
              setActiveSrc(FALLBACK_TRAVEL_IMAGE);
              return;
            }
            setFailed(true);
          }}
        />
      )}

      {overlay ? (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

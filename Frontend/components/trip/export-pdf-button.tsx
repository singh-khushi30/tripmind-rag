"use client";

import { useEffect, useState } from "react";
import { Check, FileDown, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExportPdfButtonProps = {
  tripId: string;
  className?: string;
};

export function ExportPdfButton({ tripId, className }: ExportPdfButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(false), 3200);
    return () => window.clearTimeout(timer);
  }, [success]);

  async function onExport() {
    if (pending) return;
    setPending(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/trips/${tripId}/pdf`, {
        method: "GET",
        credentials: "same-origin",
      });

      if (!response.ok) {
        let message =
          "We couldn’t prepare your itinerary PDF. Please try again.";
        try {
          const payload = (await response.json()) as { error?: string };
          if (payload.error) message = payload.error;
        } catch {
          // keep default
        }
        setError(message);
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const matched = disposition?.match(/filename="([^"]+)"/);
      const filename = matched?.[1] ?? `TripMind-${tripId}.pdf`;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch {
      setError("We couldn’t prepare your itinerary PDF. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const isDemo = !tripId || tripId.startsWith("trip_demo");

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        variant={success ? "secondary" : "outline"}
        onClick={onExport}
        disabled={pending || isDemo}
        aria-busy={pending}
        aria-label={
          pending
            ? "Preparing itinerary PDF"
            : success
              ? "PDF downloaded"
              : "Export itinerary as PDF"
        }
      >
        {pending ? (
          <LoaderCircle data-icon="inline-start" className="animate-spin" />
        ) : success ? (
          <Check data-icon="inline-start" />
        ) : (
          <FileDown data-icon="inline-start" />
        )}
        {pending
          ? "Preparing PDF…"
          : success
            ? "PDF downloaded"
            : "Export PDF"}
      </Button>
      {error ? (
        <p className="text-destructive text-xs leading-relaxed" role="alert">
          {error}{" "}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={onExport}
            disabled={pending}
          >
            Retry
          </button>
        </p>
      ) : null}
      {success && !error ? (
        <p className="text-muted-foreground text-xs" role="status">
          Your itinerary PDF is ready in your downloads.
        </p>
      ) : null}
    </div>
  );
}

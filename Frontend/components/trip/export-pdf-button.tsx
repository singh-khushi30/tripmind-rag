"use client";

import { useState } from "react";
import { FileDown, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ExportPdfButtonProps = {
  tripId: string;
  className?: string;
};

export function ExportPdfButton({ tripId, className }: ExportPdfButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/pdf`, {
        method: "GET",
        credentials: "same-origin",
      });

      if (!response.ok) {
        let message = "We couldn’t prepare your itinerary PDF. Please try again.";
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
    } catch {
      setError("We couldn’t prepare your itinerary PDF. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        onClick={onExport}
        disabled={pending || !tripId || tripId.startsWith("trip_demo")}
      >
        {pending ? (
          <LoaderCircle data-icon="inline-start" className="animate-spin" />
        ) : (
          <FileDown data-icon="inline-start" />
        )}
        {pending ? "Preparing your itinerary PDF…" : "Export PDF"}
      </Button>
      {error ? (
        <p className="text-destructive mt-2 text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

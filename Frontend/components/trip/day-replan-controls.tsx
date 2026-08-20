"use client";

import { useState, useTransition } from "react";
import { CloudRain, RotateCcw, Sparkles } from "lucide-react";

import {
  replanTripDayAction,
  undoTripDayReplanAction,
} from "@/app/trips/replan-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReplanReasonCode } from "@/lib/replanning/replan-day";
import type { ItineraryData } from "@/lib/gemini/schema";

const REASON_OPTIONS: Array<{ value: ReplanReasonCode; label: string }> = [
  { value: "raining", label: "It's raining" },
  { value: "running_late", label: "I'm running late" },
  { value: "tired", label: "I'm tired" },
  { value: "spend_less", label: "Spend less" },
  { value: "less_busy", label: "Make it less busy" },
  { value: "more_food", label: "More food" },
  { value: "more_culture", label: "More culture" },
  { value: "more_indoor", label: "More indoor activities" },
  { value: "custom", label: "Custom reason" },
];

const STATUS_MESSAGES = [
  "Reviewing today's constraints",
  "Checking weather and route",
  "Finding grounded alternatives",
  "Rebuilding your day",
  "Recalculating your budget",
];

type DayReplanControlsProps = {
  tripId: string;
  dayNumber: number;
  onItineraryUpdate?: (itinerary: ItineraryData) => void;
};

export function DayReplanControls({
  tripId,
  dayNumber,
  onItineraryUpdate,
}: DayReplanControlsProps) {
  const [open, setOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<ReplanReasonCode>("raining");
  const [customReason, setCustomReason] = useState("");
  const [hoursLate, setHoursLate] = useState("2");
  const [targetBudget, setTargetBudget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [pending, startTransition] = useTransition();

  function runReplan() {
    setError(null);
    setStatusIndex(0);
    const timer = window.setInterval(() => {
      setStatusIndex((index) => Math.min(index + 1, STATUS_MESSAGES.length - 1));
    }, 1600);

    startTransition(async () => {
      const label =
        REASON_OPTIONS.find((option) => option.value === reasonCode)?.label ??
        reasonCode;
      const result = await replanTripDayAction({
        tripId,
        dayNumber,
        reasonCode,
        reasonText:
          reasonCode === "custom" && customReason.trim()
            ? customReason.trim()
            : label,
        hoursLate:
          reasonCode === "running_late" ? Number(hoursLate) || null : null,
        targetDayBudget:
          reasonCode === "spend_less" && targetBudget
            ? Number(targetBudget)
            : null,
      });
      window.clearInterval(timer);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.itinerary && onItineraryUpdate) {
        onItineraryUpdate(result.itinerary as ItineraryData);
      } else {
        window.location.reload();
      }
      setOpen(false);
    });
  }

  function runUndo() {
    setError(null);
    startTransition(async () => {
      const result = await undoTripDayReplanAction({ tripId, dayNumber });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.itinerary && onItineraryUpdate) {
        onItineraryUpdate(result.itinerary as ItineraryData);
      } else {
        window.location.reload();
      }
    });
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setOpen((value) => !value)}
          disabled={pending}
        >
          <Sparkles data-icon="inline-start" />
          Re-plan this day
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={runUndo}
          disabled={pending}
        >
          <RotateCcw data-icon="inline-start" />
          Undo last change
        </Button>
      </div>

      {open ? (
        <div className="border-border/80 bg-secondary/30 space-y-3 rounded-2xl border p-4">
          <div className="space-y-2">
            <p className="text-foreground text-sm font-medium">
              Why re-plan day {dayNumber}?
            </p>
            <Select
              value={reasonCode}
              onValueChange={(value) =>
                setReasonCode(value as ReplanReasonCode)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reasonCode === "running_late" ? (
            <Input
              type="number"
              min={1}
              max={12}
              value={hoursLate}
              onChange={(event) => setHoursLate(event.target.value)}
              placeholder="Hours late"
            />
          ) : null}

          {reasonCode === "spend_less" ? (
            <Input
              type="number"
              min={0}
              value={targetBudget}
              onChange={(event) => setTargetBudget(event.target.value)}
              placeholder="Optional target day budget"
            />
          ) : null}

          {reasonCode === "custom" ? (
            <Input
              value={customReason}
              onChange={(event) => setCustomReason(event.target.value)}
              placeholder="Describe what you need"
            />
          ) : null}

          <Button type="button" onClick={runReplan} disabled={pending} aria-busy={pending}>
            {pending ? (
              <CloudRain data-icon="inline-start" className="animate-pulse" />
            ) : (
              <CloudRain data-icon="inline-start" />
            )}
            {pending ? "Re-planning…" : "Apply re-plan"}
          </Button>

          {pending ? (
            <p className="text-muted-foreground text-xs" role="status">
              {STATUS_MESSAGES[statusIndex]}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="text-destructive text-xs leading-relaxed" role="alert">
          {error}{" "}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={runReplan}
            disabled={pending}
          >
            Retry
          </button>
        </p>
      ) : null}
    </div>
  );
}

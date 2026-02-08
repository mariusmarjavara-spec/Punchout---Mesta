"use client";

import { useState } from "react";
import { useMotorState, useMotor } from "@/hooks/use-motor-state";
import { Check, RotateCcw } from "lucide-react";

/**
 * CompletionScreen - Shows after day is locked
 *
 * Reads dayLog for summary data, calls motor.startNewDay() for reset
 */
export function CompletionScreen() {
  const dayLog = useMotorState('dayLog');
  const motor = useMotor();

  const now = new Date();
  const dateStr = dayLog?.date || now.toLocaleDateString("no-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Calculate summary from dayLog
  const entryCount = dayLog?.entries?.length || 0;
  const schemaCount = dayLog?.schemas?.filter(s => s.status === "confirmed").length || 0;

  const [isResetting, setIsResetting] = useState(false);

  const handleReset = () => {
    if (isResetting) return;
    setIsResetting(true);
    motor?.startNewDay();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="flex flex-col items-center gap-8 text-center">
        {/* Success icon */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success">
          <Check className="h-12 w-12 text-success-foreground" />
        </div>

        {/* Message */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dagen er låst</h1>
          <p className="mt-2 text-lg text-muted-foreground">{dateStr}</p>
        </div>

        {/* Summary card */}
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Arbeidstimer</span>
              <span className="font-semibold text-card-foreground">
                {dayLog?.startTime || "?"} - {dayLog?.endTime || "?"}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Loggføringer</span>
              <span className="font-semibold text-card-foreground">{entryCount}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Skjema fullført</span>
              <span className="font-semibold text-card-foreground">{schemaCount}</span>
            </div>
          </div>
        </div>

        {/* Info text */}
        <p className="max-w-xs text-sm text-muted-foreground">
          Alle data er sendt og kan ikke endres. Kontakt leder hvis noe er feil.
        </p>

        {/* Reset button */}
        <button
          onClick={handleReset}
          disabled={isResetting}
          type="button"
          className="flex items-center gap-2 rounded-xl bg-secondary px-6 py-4 font-medium text-secondary-foreground transition-all active:scale-95 disabled:opacity-50"
        >
          <RotateCcw className="h-5 w-5" />
          {isResetting ? "Tilbakestiller..." : "Start ny dag"}
        </button>
      </div>
    </div>
  );
}

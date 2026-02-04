"use client";

import { useMotorState, useMotor, derivePhase } from "@/hooks/use-motor-state";
import { StartDayPhase } from "@/components/punchout/start-day-phase";
import { OperationsPhase } from "@/components/punchout/operations-phase";
import { EndDayPhase } from "@/components/punchout/end-day-phase";
import { CompletionScreen } from "@/components/punchout/completion-screen";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function PunchoutApp() {
  // Read state from motor (READ-ONLY)
  const appState = useMotorState('appState');
  const dayLog = useMotorState('dayLog');
  const motor = useMotor();

  // Derive current phase from motor state
  const currentPhase = derivePhase(appState, dayLog);

  // Local UI-only state (transitions, animations - NOT business logic)
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedPhase, setDisplayedPhase] = useState<string | null>(null);

  // Handle phase transitions (visual only)
  // Skip transition on initial mount (displayedPhase is null)
  useEffect(() => {
    if (displayedPhase === null) {
      // First render — show content immediately, no transition
      setDisplayedPhase(currentPhase);
      return;
    }
    if (currentPhase !== displayedPhase) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedPhase(currentPhase);
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentPhase, displayedPhase]);

  // Show loading state if motor not ready
  if (!motor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Laster...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Phase transition overlay */}
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-[100] bg-background transition-opacity duration-300",
          isTransitioning ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Content */}
      <div
        className={cn(
          "transition-opacity duration-200",
          isTransitioning ? "opacity-0" : "opacity-100"
        )}
      >
        {currentPhase === "start" && (
          <StartDayPhase />
        )}

        {currentPhase === "operations" && (
          <OperationsPhase />
        )}

        {currentPhase === "end" && (
          <EndDayPhase />
        )}

        {currentPhase === "complete" && (
          <CompletionScreen />
        )}
      </div>
    </div>
  );
}

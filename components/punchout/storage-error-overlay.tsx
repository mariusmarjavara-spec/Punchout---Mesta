"use client";

import { AlertCircle } from "lucide-react";
import type { StorageError } from "@/hooks/use-motor-state";

interface StorageErrorOverlayProps {
  error: StorageError;
  motor: NonNullable<typeof window.Motor>;
}

/**
 * StorageErrorOverlay - Shown when localStorage data is corrupt.
 *
 * Blocking: user must choose to reset or ignore before continuing.
 * Motor detects the error during loadFromStorage(), React projects it here.
 */
export function StorageErrorOverlay({ error, motor }: StorageErrorOverlayProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 bg-background">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-foreground">Lagringsfeil</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error.message}
          </p>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={() => motor.resetCurrentDayOnly()}
            type="button"
            className="flex w-full items-center justify-center rounded-xl bg-primary py-4 font-semibold text-primary-foreground transition-all active:scale-[0.98]"
          >
            Nullstill dagens data
          </button>
          <p className="text-xs text-muted-foreground">
            Historikk beholdes. Kun dagens (korrupte) data slettes.
          </p>

          <button
            onClick={() => motor.tryIgnoreError()}
            type="button"
            className="flex w-full items-center justify-center rounded-xl bg-secondary py-3 font-medium text-secondary-foreground transition-all active:scale-[0.98]"
          >
            Ignorer og fortsett
          </button>
        </div>
      </div>
    </div>
  );
}

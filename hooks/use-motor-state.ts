import { useState, useEffect, useCallback } from 'react';

// Type definitions for motor state
export interface DayLog {
  date: string;
  startTime: string;
  endTime?: string;
  phase: 'pre' | 'active' | 'ending';
  status?: string;
  entries: Entry[];
  drafts: Record<string, Draft>;
  schemas: Schema[];
  mainTimeHandled?: boolean;
  mainTimeDiscarded?: boolean;
  mainTimeDiscardReason?: 'no_work_done' | 'logged_elsewhere';
  externalTasks?: ExternalTask[];
}

export interface Entry {
  time: string;
  text: string;
  type: string;
  ruhDecision?: string;
  vaktloggConfirmed?: boolean;
  vaktloggDiscarded?: boolean;
  converted?: boolean;
  keptAsNote?: boolean;
}

export interface Draft {
  ordre: string;
  dato: string;
  fra_tid?: string;
  til_tid?: string;
  arbeidsbeskrivelse: string[];
  ressurser: string[];
  lonnskoder: LonnskodeEntry[];
  maskintimer?: MaskintimeEntry[];
  entryIndices: number[];
  status: 'draft' | 'confirmed' | 'discarded';
}

export interface LonnskodeEntry {
  kode: string;
  fra: string;
  til: string;
}

export interface MaskintimeEntry {
  maskintype: string;
  timer: string;
}

export interface Schema {
  id: string;
  type: string;
  origin: string;
  status: 'draft' | 'confirmed' | 'skipped' | 'discarded';
  fields: Record<string, unknown>;
  createdAt: string;
  confirmedAt?: string;
}

export interface ExternalTask {
  system: string;
  params: Record<string, string>;
  openedAt: string;
  confirmedByUser: boolean;
  confirmedAt?: string;
}

export interface UxState {
  activeOverlay: string | null;
  schemaId: string | null;
  draftOrdre: string | null;
  decisionPhase: string | null;
  decisionIndex: number;
  externalSystem?: string;
  externalInstructions?: string;
}

export type AppState = 'NOT_STARTED' | 'ACTIVE' | 'FINISHED' | 'LOCKED';

export interface MotorSnapshot {
  appState: AppState;
  dayLog: DayLog | null;
  uxState: UxState;
}

// Declare global Motor interface
declare global {
  interface Window {
    Motor?: {
      getSnapshot: () => MotorSnapshot;
      startDay: (text?: string) => void;
      endDay: () => void;
      lockDay: () => void;
      startNewDay: () => void;
      submitEntry: (text?: string, type?: string) => void;
      openSchemaEdit: (schemaId: string) => void;
      closeSchemaEdit: () => void;
      saveSchemaEdit: () => void;
      openDraftEdit: (ordre: string) => void;
      closeDraftEdit: () => void;
      saveDraftEdit: () => void;
      openTimeEntryOverlay: (ordre: string) => void;
      openMainTimeEntryOverlay: () => void;
      hideTimeEntryOverlay: () => void;
      confirmTimeEntry: () => void;
      confirmMainTimeEntry: () => void;
      discardMainTimeEntry: (reason: 'no_work_done' | 'logged_elsewhere') => void;
      draftDecision: (action: string) => void;
      schemaDecision: (action: string) => void;
      friksjonDecision: (action: string) => void;
      noteDecision: (action: string) => void;
      showPreDayOverlay: () => void;
      hidePreDayOverlay: () => void;
      continueFromPreDay: () => void;
      skipPreDaySchema: (schemaId: string) => void;
      isSchemaRequired: (schemaType: string) => boolean;
      openExternalSystem: (system: string, params?: Record<string, string>) => void;
      confirmExternalTask: (system: string) => void;
      closeExternalInstructionOverlay: () => void;
    };
  }
}

/**
 * Hook for reading motor state in React components.
 *
 * IMPORTANT: This hook provides READ-ONLY access to motor state.
 * UI should NEVER write directly to motor state - always call motor functions.
 *
 * The motor emits 'motor-state-change' events with { detail: { key } }
 * when state changes. This hook only re-renders when the specific key changes.
 *
 * @param key - The state key to subscribe to: 'appState' | 'dayLog' | 'uxState'
 * @returns The current value of that state key (immutable snapshot)
 */
export function useMotorState<K extends keyof MotorSnapshot>(key: K): MotorSnapshot[K] | undefined {
  // Initialize from snapshot (handles SSR and initial render)
  const [value, setValue] = useState<MotorSnapshot[K] | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    return window.Motor?.getSnapshot()?.[key];
  });

  useEffect(() => {
    // Handler for motor state changes
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string }>;
      // Only update if this is our key
      if (customEvent.detail.key === key) {
        const snapshot = window.Motor?.getSnapshot();
        if (snapshot) {
          setValue(snapshot[key]);
        }
      }
    };

    // Subscribe to motor state changes
    window.addEventListener('motor-state-change', handler);

    // Initial sync (in case motor state changed before effect ran)
    const snapshot = window.Motor?.getSnapshot();
    if (snapshot) {
      setValue(snapshot[key]);
    }

    return () => {
      window.removeEventListener('motor-state-change', handler);
    };
  }, [key]);

  return value;
}

/**
 * Hook for getting all motor state at once.
 * Use sparingly - prefer useMotorState(key) for granular updates.
 */
export function useMotorSnapshot(): MotorSnapshot | undefined {
  const [snapshot, setSnapshot] = useState<MotorSnapshot | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    return window.Motor?.getSnapshot();
  });

  useEffect(() => {
    const handler = () => {
      setSnapshot(window.Motor?.getSnapshot());
    };

    window.addEventListener('motor-state-change', handler);

    // Initial sync
    setSnapshot(window.Motor?.getSnapshot());

    return () => {
      window.removeEventListener('motor-state-change', handler);
    };
  }, []);

  return snapshot;
}

/**
 * Hook for calling motor functions.
 * Returns undefined if motor is not available (e.g., SSR).
 */
export function useMotor() {
  const [motor, setMotor] = useState<typeof window.Motor>(undefined);

  useEffect(() => {
    setMotor(window.Motor);
  }, []);

  return motor;
}

/**
 * Derive the current UI phase from motor state.
 * This is a pure function - no side effects.
 */
export function derivePhase(appState: AppState | undefined, dayLog: DayLog | null | undefined):
  'start' | 'operations' | 'end' | 'complete' {

  if (!appState || appState === 'NOT_STARTED') {
    return 'start';
  }

  if (appState === 'LOCKED') {
    return 'complete';
  }

  if (appState === 'FINISHED') {
    return 'complete';
  }

  if (appState === 'ACTIVE') {
    if (dayLog?.phase === 'ending') {
      return 'end';
    }
    if (dayLog?.phase === 'pre') {
      return 'start'; // Still in pre-day phase
    }
    return 'operations';
  }

  return 'start';
}

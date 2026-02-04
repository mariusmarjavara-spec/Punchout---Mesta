"use client";

import { useMotorState, useMotor, type DayLog, type UxState } from "@/hooks/use-motor-state";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronRight,
  Clock,
  FileText,
  Gauge,
  AlertCircle,
  Wrench,
  Lock,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";

/**
 * EndDayPhase - Renders end-of-day decision overlays
 *
 * IMPORTANT: This component is a PURE PROJECTION of motor state.
 * - It reads uxState.activeOverlay to determine what to show
 * - It calls motor functions for all actions
 * - It has NO business logic of its own
 * - It has a guard to prevent rendering if motor is not in correct state
 */
export function EndDayPhase() {
  const appState = useMotorState('appState');
  const dayLog = useMotorState('dayLog');
  const uxState = useMotorState('uxState');
  const motor = useMotor();

  // GUARD: Only render if motor is in ending phase
  // Belt & suspenders - prevents showing end-of-day UI during race/refresh/bug
  if (appState !== "ACTIVE" || dayLog?.phase !== "ending") {
    return null;
  }

  if (!motor || !uxState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Laster...</div>
      </div>
    );
  }

  // Route to correct overlay based on motor's uxState
  const renderOverlay = () => {
    switch (uxState.activeOverlay) {
      case "main_time_entry":
        return <MainTimeEntryOverlay dayLog={dayLog} motor={motor} />;

      case "draft_decision":
        return <DraftDecisionOverlay dayLog={dayLog} uxState={uxState} motor={motor} />;

      case "schema_decision":
        return <SchemaDecisionOverlay dayLog={dayLog} uxState={uxState} motor={motor} />;

      case "friksjon_decision":
        return <FriksjonDecisionOverlay dayLog={dayLog} uxState={uxState} motor={motor} />;

      case "note_decision":
        return <NoteDecisionOverlay dayLog={dayLog} uxState={uxState} motor={motor} />;

      case "time_entry":
        return <TimeEntryOverlay dayLog={dayLog} uxState={uxState} motor={motor} />;

      case "schema_edit":
        return <SchemaEditOverlay dayLog={dayLog} uxState={uxState} motor={motor} />;

      case "external_instruction":
        return <ExternalInstructionOverlay uxState={uxState} motor={motor} />;

      default:
        // Waiting for motor to set next overlay
        return <EndDayProgress dayLog={dayLog} />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background/95">
      {renderOverlay()}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS (all read from props, call motor functions)
// ============================================================

interface OverlayProps {
  dayLog: DayLog | null;
  uxState?: UxState;
  motor: NonNullable<typeof window.Motor>;
}

function MainTimeEntryOverlay({ dayLog, motor }: OverlayProps) {
  const [expanded, setExpanded] = useState(true);
  const [showDiscardOptions, setShowDiscardOptions] = useState(false);

  if (!dayLog) return null;

  const draft = dayLog.drafts?.["HOVED"];
  if (!draft) return null;

  const formatTime = (time: string) => time || "?";

  const handleDiscard = (reason: 'no_work_done' | 'logged_elsewhere') => {
    motor.discardMainTimeEntry(reason);
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card px-4 py-4">
        <h1 className="text-xl font-semibold text-foreground">Hovedtimefoering</h1>
        <p className="text-sm text-muted-foreground">
          Bekreft dagens arbeidstid for loenn
        </p>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {formatTime(dayLog.startTime)} - {formatTime(dayLog.endTime || "")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dayLog.date}
                </p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
            >
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Loennskoder
            </h3>
            {draft.lonnskoder && draft.lonnskoder.length > 0 ? (
              <div className="space-y-2">
                {draft.lonnskoder.map((lk, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="font-mono text-sm">{lk.kode}</span>
                    <span className="text-muted-foreground">{lk.fra} - {lk.til}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Ingen loennskoder lagt til</p>
            )}
          </div>
        )}

        {/* Discard options panel */}
        {showDiscardOptions && (
          <div className="mt-4 rounded-xl border-2 border-destructive/50 bg-destructive/5 p-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Forkast hovedtimefoering</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Dette skal kun gjoeres hvis du ikke har arbeidet, eller hvis timene allerede er foert i et annet system.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleDiscard('no_work_done')}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-destructive/50 active:scale-[0.98]"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">Jeg har ikke arbeidet i dag</p>
                  <p className="text-sm text-muted-foreground">Ingen timer aa foere</p>
                </div>
              </button>

              <button
                onClick={() => handleDiscard('logged_elsewhere')}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-destructive/50 active:scale-[0.98]"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">Timene er foert i annet system</p>
                  <p className="text-sm text-muted-foreground">F.eks. Maconomy, SAP, eller lignende</p>
                </div>
              </button>

              <button
                onClick={() => setShowDiscardOptions(false)}
                type="button"
                className="flex w-full items-center justify-center rounded-lg py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground"
              >
                Avbryt
              </button>
            </div>
          </div>
        )}
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm space-y-2">
        <button
          onClick={() => motor.confirmMainTimeEntry()}
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-5 text-lg font-semibold text-primary-foreground transition-all active:scale-[0.98]"
        >
          <Lock className="h-5 w-5" />
          Bekreft hovedtimeark
        </button>

        {!showDiscardOptions && (
          <button
            onClick={() => setShowDiscardOptions(true)}
            type="button"
            className="flex w-full items-center justify-center rounded-xl py-3 text-sm font-medium text-muted-foreground transition-all hover:text-destructive"
          >
            Forkast timefoering...
          </button>
        )}
      </div>
    </div>
  );
}

function DraftDecisionOverlay({ dayLog, uxState, motor }: OverlayProps) {
  if (!dayLog || !uxState) return null;

  // Get draft at current index (motor manages this)
  const drafts = Object.values(dayLog.drafts || {}).filter(d => d.status === "draft" && d.ordre !== "HOVED");
  const draft = drafts[uxState.decisionIndex];

  if (!draft) return null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card px-4 py-4">
        <h1 className="text-xl font-semibold text-foreground">
          Timeark for ordre {draft.ordre}
        </h1>
        <ProgressIndicator current={uxState.decisionIndex + 1} total={drafts.length} />
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dato</span>
              <span className="font-medium">{draft.dato}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tid</span>
              <span className="font-medium">{draft.fra_tid || "?"} - {draft.til_tid || "?"}</span>
            </div>
            {draft.arbeidsbeskrivelse.length > 0 && (
              <div>
                <span className="text-muted-foreground">Beskrivelse</span>
                <p className="mt-1 font-medium">{draft.arbeidsbeskrivelse.join(". ")}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm space-y-2">
        <button
          onClick={() => motor.draftDecision("timeentry")}
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground transition-all active:scale-[0.98]"
        >
          Fyll inn timefoering
        </button>
        <button
          onClick={() => motor.draftDecision("discard")}
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3 font-medium text-destructive transition-all active:scale-[0.98]"
        >
          Forkast kladd
        </button>
      </div>
    </div>
  );
}

function SchemaDecisionOverlay({ dayLog, uxState, motor }: OverlayProps) {
  if (!dayLog || !uxState) return null;

  const schemas = (dayLog.schemas || []).filter(s => s.status === "draft" || s.status === "skipped");
  const schema = schemas[uxState.decisionIndex];

  if (!schema) return null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card px-4 py-4">
        <h1 className="text-xl font-semibold text-foreground">{schema.type}</h1>
        <ProgressIndicator current={uxState.decisionIndex + 1} total={schemas.length} />
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(schema.fields, null, 2)}
          </pre>
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm space-y-2">
        <button
          onClick={() => motor.schemaDecision("confirm")}
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground transition-all active:scale-[0.98]"
        >
          <Check className="h-5 w-5" />
          Bekreft
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => motor.schemaDecision("edit")}
            type="button"
            className="flex flex-1 items-center justify-center rounded-xl bg-secondary py-3 font-medium text-secondary-foreground transition-all active:scale-[0.98]"
          >
            Endre
          </button>
          <button
            onClick={() => motor.schemaDecision("discard")}
            type="button"
            className="flex flex-1 items-center justify-center rounded-xl bg-destructive/10 py-3 font-medium text-destructive transition-all active:scale-[0.98]"
          >
            Forkast
          </button>
        </div>
      </div>
    </div>
  );
}

function FriksjonDecisionOverlay({ dayLog, uxState, motor }: OverlayProps) {
  if (!dayLog || !uxState) return null;

  const friksjonSchemas = (dayLog.schemas || []).filter(s => s.type === "friksjonsmaling" && s.status === "draft");
  const schema = friksjonSchemas[uxState.decisionIndex];

  if (!schema) return null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/20">
            <Gauge className="h-5 w-5 text-chart-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Friksjonsmaaling</h1>
            <ProgressIndicator current={uxState.decisionIndex + 1} total={friksjonSchemas.length} />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tidspunkt</span>
            <span className="font-medium">{String(schema.fields.tidspunkt) || "?"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sted</span>
            <span className="font-medium">{String(schema.fields.sted) || "?"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Verdi</span>
            <span className="font-medium">{String(schema.fields.verdi) || "?"}</span>
          </div>
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm space-y-2">
        <button
          onClick={() => motor.friksjonDecision("confirm")}
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground transition-all active:scale-[0.98]"
        >
          <Check className="h-5 w-5" />
          Bekreft
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => motor.friksjonDecision("edit")}
            type="button"
            className="flex flex-1 items-center justify-center rounded-xl bg-secondary py-3 font-medium text-secondary-foreground transition-all active:scale-[0.98]"
          >
            Endre
          </button>
          <button
            onClick={() => motor.friksjonDecision("discard")}
            type="button"
            className="flex flex-1 items-center justify-center rounded-xl bg-destructive/10 py-3 font-medium text-destructive transition-all active:scale-[0.98]"
          >
            Forkast
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteDecisionOverlay({ dayLog, uxState, motor }: OverlayProps) {
  if (!dayLog || !uxState) return null;

  const notes = (dayLog.entries || []).filter(e => e.type === "notat" && !e.converted && !e.keptAsNote);
  const note = notes[uxState.decisionIndex];

  if (!note) return null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <FileText className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Notat</h1>
            <ProgressIndicator current={uxState.decisionIndex + 1} total={notes.length} />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{note.time}</p>
          <p className="mt-2 text-lg font-medium">"{note.text}"</p>
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm space-y-2">
        <button
          onClick={() => motor.noteDecision("keep")}
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-4 font-medium text-secondary-foreground transition-all active:scale-[0.98]"
        >
          Behold som notat
        </button>
        <button
          onClick={() => motor.noteDecision("convert")}
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground transition-all active:scale-[0.98]"
        >
          Konverter til skjema
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function TimeEntryOverlay({ dayLog, uxState, motor }: OverlayProps) {
  if (!dayLog || !uxState || !uxState.draftOrdre) return null;

  const draft = dayLog.drafts?.[uxState.draftOrdre];
  if (!draft) return null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card px-4 py-4">
        <h1 className="text-xl font-semibold text-foreground">
          Timefoering - Ordre {draft.ordre}
        </h1>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-muted-foreground">Fyll inn loennskoder og maskintimer</p>
          {/* Motor handles the actual form rendering in existing HTML */}
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm space-y-2">
        <button
          onClick={() => motor.confirmTimeEntry()}
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground transition-all active:scale-[0.98]"
        >
          <Check className="h-5 w-5" />
          Bekreft timeark
        </button>
        <button
          onClick={() => motor.hideTimeEntryOverlay()}
          type="button"
          className="flex w-full items-center justify-center rounded-xl bg-secondary py-3 font-medium text-secondary-foreground transition-all active:scale-[0.98]"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}

function SchemaEditOverlay({ dayLog, uxState, motor }: OverlayProps) {
  if (!dayLog || !uxState || !uxState.schemaId) return null;

  const schema = dayLog.schemas?.find(s => s.id === uxState.schemaId);
  if (!schema) return null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card px-4 py-4">
        <h1 className="text-xl font-semibold text-foreground">Rediger {schema.type}</h1>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(schema.fields, null, 2)}
          </pre>
          {/* Motor handles actual form fields in existing HTML */}
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm space-y-2">
        <button
          onClick={() => motor.saveSchemaEdit()}
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground transition-all active:scale-[0.98]"
        >
          Lagre
        </button>
        <button
          onClick={() => motor.closeSchemaEdit()}
          type="button"
          className="flex w-full items-center justify-center rounded-xl bg-secondary py-3 font-medium text-secondary-foreground transition-all active:scale-[0.98]"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}

function ExternalInstructionOverlay({ uxState, motor }: { uxState: UxState; motor: NonNullable<typeof window.Motor> }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {uxState.externalSystem === "elrapp" ? "Elrapp" : uxState.externalSystem}
        </h2>
        <p className="text-muted-foreground mb-6">
          {uxState.externalInstructions}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Kom tilbake hit naar du er ferdig.
        </p>
        <div className="space-y-2">
          <button
            onClick={() => motor.confirmExternalTask(uxState.externalSystem || "")}
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground transition-all active:scale-[0.98]"
          >
            <Check className="h-5 w-5" />
            Jeg er ferdig
          </button>
          <button
            onClick={() => motor.closeExternalInstructionOverlay()}
            type="button"
            className="flex w-full items-center justify-center rounded-xl bg-secondary py-3 font-medium text-secondary-foreground transition-all active:scale-[0.98]"
          >
            Lukk (ikke ferdig)
          </button>
        </div>
      </div>
    </div>
  );
}

function EndDayProgress({ dayLog }: { dayLog: DayLog | null }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 mb-4">
        <Clock className="h-8 w-8 text-primary animate-pulse" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">Behandler...</h2>
      <p className="text-muted-foreground mt-2">Venter paa neste steg</p>
    </div>
  );
}

function ProgressIndicator({ current, total }: { current: number; total: number }) {
  return (
    <p className="text-sm text-muted-foreground">
      {current} av {total}
    </p>
  );
}

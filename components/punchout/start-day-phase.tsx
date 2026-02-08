"use client";

import { useMemo, useState, useEffect } from "react";
import { useMotorState, useMotor, Schema, UxState, DayLog } from "@/hooks/use-motor-state";
import { VoiceButton } from "./voice-button";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, ExternalLink, FileText, SkipForward, X, Languages } from "lucide-react";

// UI text translations (simple NO/EN toggle, UI-only)
const UI_TEXT = {
  NO: {
    greeting_morning: "God morgen",
    greeting_day: "Hei",
    greeting_evening: "God kveld",
    greeting_night: "God natt",
    ready_message: "Klar for en ny arbeidsdag",
    start_button: "Start",
    text_fallback: "Du kan skrive hvis du vil",
    suggested_tasks: "Anbefalte oppgaver",
    optional_message: "Disse er valgfrie - du kan gå videre når som helst",
    schemas_heading: "Skjema",
    external_heading: "Eksterne systemer",
    recommended: "Anbefalt",
    required: "Påkrevd",
    fill_in: "Fyll ut",
    skipped: "Hoppet over",
    open: "Åpne",
    go_to_operations: "Gå til drift",
    can_return: "Du kan alltid gå tilbake til disse senere",
    sja_label: "SJA (før arbeid)",
    vehicle_check_label: "Kjøretøysjekk",
  },
  EN: {
    greeting_morning: "Good morning",
    greeting_day: "Hello",
    greeting_evening: "Good evening",
    greeting_night: "Good night",
    ready_message: "Ready for a new workday",
    start_button: "Start",
    text_fallback: "You can type if you prefer",
    suggested_tasks: "Suggested tasks",
    optional_message: "These are optional - you can continue anytime",
    schemas_heading: "Forms",
    external_heading: "External systems",
    recommended: "Recommended",
    required: "Required",
    fill_in: "Fill in",
    skipped: "Skipped",
    open: "Open",
    go_to_operations: "Go to operations",
    can_return: "You can always return to these later",
    sja_label: "SJA (before work)",
    vehicle_check_label: "Vehicle check",
  }
} as const;

type Language = 'NO' | 'EN';

function getTimeBasedGreeting(lang: Language): string {
  const hour = new Date().getHours();
  const t = UI_TEXT[lang];

  if (hour >= 5 && hour < 10) {
    return t.greeting_morning;
  } else if (hour >= 10 && hour < 17) {
    return t.greeting_day;
  } else if (hour >= 17 && hour < 22) {
    return t.greeting_evening;
  } else {
    return t.greeting_night;
  }
}

// Pre-day suggestions (external systems - delegation only)
const EXTERNAL_SUGGESTIONS = [
  {
    id: "elrapp",
    title: "Logg inn i Elrapp",
    type: "external" as const,
    url: "https://elrapp.no"
  },
  {
    id: "linx",
    title: "Linx-innlogging",
    type: "external" as const,
    url: "https://linx.no"
  },
];

/**
 * StartDayPhase - Handles NOT_STARTED and ACTIVE(pre) phases
 *
 * Principles:
 * - All suggestions are RECOMMENDED, never blocking
 * - Motor owns all state, UI only projects
 * - External systems are delegation only (open URL, no verification)
 * - User can ALWAYS proceed to drift
 */
export function StartDayPhase() {
  const appState = useMotorState('appState');
  const dayLog = useMotorState('dayLog');
  const uxState = useMotorState('uxState');
  const isListening = useMotorState('isListening');
  const voiceSupported = useMotorState('voiceSupported');
  const motor = useMotor();

  // Language toggle (UI-only, not motor state)
  const [lang, setLang] = useState<Language>('NO');
  const t = UI_TEXT[lang];

  // UI-only state machine for start phase flow
  const [startUIState, setStartUIState] = useState<'idle' | 'listening' | 'review'>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);

  const greeting = useMemo(() => getTimeBasedGreeting(lang), [lang]);

  // Determine sub-phase
  const isNotStarted = appState === 'NOT_STARTED';
  const isPreDay = appState === 'ACTIVE' && dayLog?.phase === 'pre';

  // Auto-transition from listening to review when voice stops
  useEffect(() => {
    if (startUIState === 'listening' && !isListening) {
      setStartUIState('review');
    }
  }, [isListening, startUIState]);

  // Check if we're editing a schema (overlay state)
  const isEditingSchema = uxState?.activeOverlay === 'schema_edit' && uxState?.schemaId;

  // Get pre-day schemas from motor (not hard-coded)
  const preDaySchemas = useMemo(() => {
    if (!dayLog?.schemas) return [];
    return dayLog.schemas.filter(s => s.origin === "pre_day");
  }, [dayLog?.schemas]);

  // Check if any schemas are admin-required (via motor)
  const getSchemaStatus = (schema: Schema): "anbefalt" | "påkrevd" => {
    if (motor?.isSchemaRequired(schema.type)) {
      return "påkrevd";
    }
    return "anbefalt";
  };

  // Handle start day
  const handleStartDay = () => {
    motor?.startDay();
  };

  // Handle continue to drift (NEVER blocks)
  const handleContinue = () => {
    if (isContinuing) return;
    setIsContinuing(true);
    motor?.continueFromPreDay();
  };

  // Handle skip schema
  const handleSkipSchema = (schemaId: string) => {
    motor?.skipPreDaySchema(schemaId);
  };

  // Handle open schema for edit
  const handleOpenSchema = (schemaId: string) => {
    motor?.openSchemaEdit(schemaId);
  };

  // Handle external link (delegation only)
  const handleOpenExternal = (url: string) => {
    window.open(url, '_blank');
  };

  // --- NOT_STARTED: Show start button (idle state) ---
  if (isNotStarted && startUIState === 'idle') {
    return (
      <div className="flex min-h-screen flex-col px-4 py-8">
        {/* Language toggle - upper right corner */}
        <div className="flex justify-end mb-8">
          <button
            onClick={() => setLang(lang === 'NO' ? 'EN' : 'NO')}
            type="button"
            className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary"
          >
            <Languages className="h-4 w-4" />
            {lang}
          </button>
        </div>

        {/* Main content - centered */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">{greeting}</h1>
              <p className="mt-2 text-lg text-muted-foreground">
                {t.ready_message}
              </p>
            </div>

            <VoiceButton
              isListening={false}
              onClick={() => {
                setStartUIState('listening');
                motor?.toggleVoice();
              }}
              label={t.start_button}
              size="xl"
              disabled={!voiceSupported}
            />

            <p className="max-w-xs text-center text-sm text-muted-foreground">
              {t.text_fallback}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- NOT_STARTED: Listening state ---
  if (isNotStarted && startUIState === 'listening') {
    return (
      <div className="flex min-h-screen flex-col px-4 py-8">
        {/* Language toggle - upper right corner */}
        <div className="flex justify-end mb-8">
          <button
            onClick={() => setLang(lang === 'NO' ? 'EN' : 'NO')}
            type="button"
            className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary"
          >
            <Languages className="h-4 w-4" />
            {lang}
          </button>
        </div>

        {/* Main content - centered */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">{greeting}</h1>
              <p className="mt-2 text-lg text-muted-foreground">
                {t.ready_message}
              </p>
            </div>

            <VoiceButton
              isListening={true}
              onClick={() => motor?.toggleVoice()}
              label="Lytter..."
              size="xl"
              disabled={!voiceSupported}
            />

            <p className="max-w-xs text-center text-sm text-muted-foreground">
              Trykk igjen for å gå videre
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Schema Edit Overlay (during pre-day) ---
  if (isPreDay && isEditingSchema && motor && dayLog && uxState) {
    return <PreDaySchemaEditOverlay dayLog={dayLog} uxState={uxState} motor={motor} />;
  }

  // --- Review state OR ACTIVE (pre): Show pre-day suggestions ---
  if (startUIState === 'review' || isPreDay) {
    // Helper for schema labels
    const getSchemaLabel = (schemaType: string): string => {
      if (schemaType === "sja_preday") return t.sja_label;
      if (schemaType === "kjoretoyssjekk") return t.vehicle_check_label;
      return schemaType;
    };

    return (
      <div className="flex min-h-screen flex-col px-4 py-8 pb-24">
        {/* Language toggle - upper right corner */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === 'NO' ? 'EN' : 'NO')}
            type="button"
            className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary"
          >
            <Languages className="h-4 w-4" />
            {lang}
          </button>
        </div>

        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              {t.suggested_tasks}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.optional_message}
            </p>
          </div>

          {/* Pre-day schemas from motor */}
          {preDaySchemas.length > 0 && (
            <div className="mb-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t.schemas_heading}
              </h3>
              {preDaySchemas.map((schema) => {
                const status = getSchemaStatus(schema);
                const isCompleted = schema.status === "confirmed";
                const isSkipped = schema.status === "skipped";

                return (
                  <div
                    key={schema.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all",
                      isCompleted && "border-success/50 bg-success/10",
                      isSkipped && "border-muted bg-muted/30 opacity-60",
                      !isCompleted && !isSkipped && "border-border bg-card"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className={cn(
                          "h-5 w-5",
                          isCompleted ? "text-success" : "text-muted-foreground"
                        )} />
                        <div>
                          <p className={cn(
                            "font-medium",
                            isCompleted && "text-success",
                            isSkipped && "text-muted-foreground line-through"
                          )}>
                            {getSchemaLabel(schema.type)}
                          </p>
                          <span className={cn(
                            "text-xs",
                            status === "påkrevd" ? "text-destructive" : "text-muted-foreground"
                          )}>
                            {status === "påkrevd" ? t.required : t.recommended}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <Check className="h-5 w-5 text-success" />
                        ) : isSkipped ? (
                          <span className="text-xs text-muted-foreground">{t.skipped}</span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenSchema(schema.id)}
                              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                            >
                              {t.fill_in}
                            </button>
                            {status !== "påkrevd" && (
                              <button
                                onClick={() => handleSkipSchema(schema.id)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                                title={t.skipped}
                              >
                                <SkipForward className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* External suggestions (delegation only) */}
          <div className="mb-6 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {t.external_heading}
            </h3>
            {EXTERNAL_SUGGESTIONS.map((suggestion) => (
              <div
                key={suggestion.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{suggestion.title}</p>
                      <span className="text-xs text-muted-foreground">{t.recommended}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenExternal(suggestion.url)}
                    className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
                  >
                    {t.open}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Continue button - ALWAYS visible, NEVER blocking */}
          <button
            onClick={handleContinue}
            disabled={isContinuing}
            type="button"
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-5 text-lg font-semibold transition-all",
              "bg-primary text-primary-foreground",
              "active:scale-[0.98] disabled:opacity-50"
            )}
          >
            <Check className="h-6 w-6" />
            {isContinuing ? "Starter drift..." : t.go_to_operations}
            <ChevronRight className="h-5 w-5" />
          </button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            {t.can_return}
          </p>
        </div>
      </div>
    );
  }

  // Fallback (should not reach here)
  return null;
}

// ============================================================
// SCHEMA EDIT OVERLAY (for pre-day schemas)
// ============================================================

interface PreDaySchemaEditOverlayProps {
  dayLog: DayLog;
  uxState: UxState;
  motor: NonNullable<typeof window.Motor>;
}

// Schema field definitions (matching motor)
const SCHEMA_LABELS: Record<string, { label: string; fields: Record<string, string> }> = {
  sja_preday: {
    label: "SJA (før arbeid)",
    fields: {
      oppgave: "Oppgave",
      sted: "Sted",
      risiko: "Risiko",
      konsekvens: "Konsekvens",
      tiltak: "Tiltak",
      arbeidsvarsling: "Arbeidsvarsling",
      godkjent: "Godkjent"
    }
  },
  kjoretoyssjekk: {
    label: "Daglig kjøretøysjekk",
    fields: {
      kjoretoy: "Kjøretøy",
      dato: "Dato",
      lys_ok: "Lys OK",
      bremser_ok: "Bremser OK",
      dekk_ok: "Dekk OK",
      kommentar: "Kommentar"
    }
  }
};

function PreDaySchemaEditOverlay({ dayLog, uxState, motor }: PreDaySchemaEditOverlayProps) {
  const schema = dayLog.schemas?.find(s => s.id === uxState.schemaId);
  if (!schema) return null;

  const schemaDef = SCHEMA_LABELS[schema.type] || { label: schema.type, fields: {} };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{schemaDef.label}</h1>
            <p className="text-sm text-muted-foreground">Fyll ut skjemaet</p>
          </div>
          <button
            onClick={() => motor.closeSchemaEdit()}
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Form fields */}
      <main className="flex-1 px-4 py-6 overflow-auto">
        <div className="space-y-4">
          {Object.entries(schema.fields).map(([key, value]) => {
            const fieldLabel = schemaDef.fields[key] || key;
            const valueStr = value === null || value === undefined ? "" : String(value);

            return (
              <div key={key} className="rounded-xl border border-border bg-card p-4">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {fieldLabel}
                </label>
                {typeof value === "boolean" ? (
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-lg font-medium",
                      value === true ? "text-success" : value === false ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {value === true ? "Ja" : value === false ? "Nei" : "Ikke satt"}
                    </span>
                  </div>
                ) : (
                  <p className="text-foreground">
                    {valueStr || <span className="text-muted-foreground italic">Ikke utfylt</span>}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Skjemaredigering håndteres av motor.
          <br />
          Trykk Lagre for å bekrefte eller Avbryt for å gå tilbake.
        </p>
      </main>

      {/* Actions */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm space-y-2">
        <button
          onClick={() => motor.saveSchemaEdit()}
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground transition-all active:scale-[0.98]"
        >
          <Check className="h-5 w-5" />
          Lagre og bekreft
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

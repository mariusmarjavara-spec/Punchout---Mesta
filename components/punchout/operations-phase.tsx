"use client";

import { useState } from "react";
import { useMotorState, useMotor, Entry } from "@/hooks/use-motor-state";
import { VoiceButton } from "./voice-button";
import { cn } from "@/lib/utils";
import {
  Clock,
  FileText,
  Coffee,
  Gauge,
  AlertCircle,
  Radio,
  Wrench,
  ChevronDown,
} from "lucide-react";

/**
 * OperationsPhase - Active work phase
 *
 * IMPORTANT: This component is a PURE PROJECTION of motor state.
 * - Reads entries from dayLog.entries (motor state)
 * - Calls motor.submitEntry() for new entries
 * - Calls motor.endDay() to end the day
 * - NO local business state
 */

const LOG_TYPE_INFO: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  notat: { icon: FileText, label: "Notat", color: "bg-secondary" },
  vaktlogg: { icon: Radio, label: "Vaktlogg", color: "bg-accent" },
  friksjon: { icon: Gauge, label: "Friksjon", color: "bg-chart-4" },
  pause: { icon: Coffee, label: "Pause", color: "bg-muted" },
  ordre: { icon: Wrench, label: "Ordre", color: "bg-primary" },
  hendelse: { icon: AlertCircle, label: "Hendelse", color: "bg-destructive" },
};

export function OperationsPhase() {
  const dayLog = useMotorState('dayLog');
  const isListening = useMotorState('isListening');
  const voiceSupported = useMotorState('voiceSupported');
  const motor = useMotor();

  // UI-only state (not business logic)
  const [inputText, setInputText] = useState("");
  const [selectedType, setSelectedType] = useState<string>("notat");
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  // Get entries from motor (READ-ONLY)
  const entries = dayLog?.entries || [];

  // Format time helper
  const formatTime = (time: string) => time || "?";

  // Handle submit entry via motor
  const handleSubmitEntry = () => {
    if (!inputText.trim()) return;
    motor?.submitEntry(inputText.trim(), selectedType);
    setInputText("");
  };

  // Handle end day via motor
  const handleEndDay = () => {
    motor?.endDay();
  };

  // Count drafts (entries without confirmation where applicable)
  const draftCount = entries.filter(e =>
    (e.type === "hendelse" && !e.ruhDecision) ||
    (e.type === "vaktlogg" && !e.vaktloggConfirmed && !e.vaktloggDiscarded)
  ).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drift aktiv
              </p>
              <p className="text-xs text-muted-foreground">
                Startet {formatTime(dayLog?.startTime || "")}
              </p>
            </div>
          </div>
          {draftCount > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1">
              <AlertCircle className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">
                {draftCount} venter
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col">
        {/* Voice button area */}
        <div className="flex flex-col items-center gap-4 py-8">
          <VoiceButton
            isListening={!!isListening}
            onClick={() => motor?.toggleVoice()}
            label={isListening ? "Lytter..." : "Loggfør"}
            size="lg"
            disabled={!voiceSupported}
          />
          <p className="text-sm text-muted-foreground">
            Trykk for å logge hendelse, notat, eller ordre
          </p>
        </div>

        {/* Text input fallback */}
        <div className="px-4 mb-6">
          <div className="flex gap-2">
            {/* Type selector */}
            <div className="relative">
              <button
                onClick={() => setShowTypeSelector(!showTypeSelector)}
                type="button"
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-3 text-sm"
              >
                {LOG_TYPE_INFO[selectedType]?.label || selectedType}
                <ChevronDown className="h-4 w-4" />
              </button>
              {showTypeSelector && (
                <div className="absolute top-full left-0 mt-1 w-40 rounded-lg border border-border bg-card shadow-lg z-10">
                  {Object.entries(LOG_TYPE_INFO).map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedType(key);
                        setShowTypeSelector(false);
                      }}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <info.icon className="h-4 w-4" />
                      {info.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Text input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitEntry()}
              placeholder="Skriv loggføring..."
              className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {/* Submit button */}
            <button
              onClick={handleSubmitEntry}
              disabled={!inputText.trim()}
              type="button"
              className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Logg
            </button>
          </div>
        </div>

        {/* Log entries from motor */}
        <div className="flex-1 px-4 pb-24">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">
                Ingen loggføringer ennå
              </p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                Bruk mikrofonen eller skriv for å starte
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...entries].reverse().map((entry, index) => {
                const typeInfo = LOG_TYPE_INFO[entry.type] || LOG_TYPE_INFO.notat;
                const Icon = typeInfo.icon;
                const isConfirmed = entry.type === "vaktlogg" ? entry.vaktloggConfirmed :
                                   entry.type === "hendelse" ? !!entry.ruhDecision : true;

                return (
                  <div
                    key={index}
                    className={cn(
                      "rounded-xl border p-4 transition-all",
                      isConfirmed ? "border-border bg-card" : "border-accent/50 bg-accent/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        typeInfo.color
                      )}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {typeInfo.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {entry.time}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-foreground break-words">
                          {entry.text}
                        </p>
                        {!isConfirmed && (
                          <span className="inline-block mt-2 text-xs text-accent font-medium">
                            Venter på bekreftelse
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-4 py-4 backdrop-blur-sm">
        <button
          onClick={handleEndDay}
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-4 font-medium text-secondary-foreground transition-all active:scale-[0.98]"
        >
          Avslutt dagen
        </button>
      </div>
    </div>
  );
}

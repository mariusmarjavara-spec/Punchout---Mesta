"use client";

import { cn } from "@/lib/utils";
import { Check, ChevronRight, Type as type, LucideIcon } from "lucide-react";
import type { LogEntry } from "./operations-phase";

interface LogTypeInfo {
  icon: LucideIcon;
  label: string;
  color: string;
}

interface LogEntryListProps {
  entries: LogEntry[];
  onEntryAction: (
    entryId: string,
    action: "confirm" | "dismiss" | "convert"
  ) => void;
  logTypeInfo: Record<LogEntry["type"], LogTypeInfo>;
}

export function LogEntryList({
  entries,
  onEntryAction,
  logTypeInfo,
}: LogEntryListProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("no-NO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => {
        const typeInfo = logTypeInfo[entry.type];
        const Icon = typeInfo.icon;

        return (
          <div
            key={entry.id}
            className={cn(
              "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all",
              entry.status === "bekreftet" && "opacity-70"
            )}
          >
            {/* Header */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  typeInfo.color,
                  entry.type === "ordre" ||
                    entry.type === "hendelse" ||
                    entry.type === "friksjon"
                    ? "text-primary-foreground"
                    : "text-secondary-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {typeInfo.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                <p className="text-card-foreground">{entry.content}</p>
              </div>
            </div>

            {/* Status badge */}
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  entry.status === "kladd"
                    ? "bg-accent/20 text-accent"
                    : "bg-success/20 text-success"
                )}
              >
                {entry.status === "kladd" ? "Kladd" : "Bekreftet"}
              </span>

              {entry.status === "kladd" && !entry.requiresAction && (
                <button
                  onClick={() => onEntryAction(entry.id, "confirm")}
                  type="button"
                  className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-all active:scale-95"
                >
                  <Check className="h-4 w-4" />
                  Bekreft
                </button>
              )}
            </div>

            {/* Action prompt if required */}
            {entry.requiresAction && entry.actionPrompt && (
              <div className="flex flex-col gap-3 rounded-lg border border-accent/30 bg-accent/10 p-3">
                <p className="text-sm font-medium text-accent">
                  {entry.actionPrompt}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEntryAction(entry.id, "dismiss")}
                    type="button"
                    className="flex-1 rounded-lg bg-secondary py-3 text-sm font-medium text-secondary-foreground transition-all active:scale-[0.98]"
                  >
                    Nei
                  </button>
                  <button
                    onClick={() => onEntryAction(entry.id, "convert")}
                    type="button"
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-all active:scale-[0.98]"
                  >
                    Ja
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

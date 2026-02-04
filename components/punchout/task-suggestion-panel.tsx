"use client";

import { cn } from "@/lib/utils";
import { Check, ClipboardList, Car, LogIn, FileText, X } from "lucide-react";
import type { SuggestedTask } from "./start-day-phase";

interface TaskSuggestionPanelProps {
  tasks: SuggestedTask[];
  onTaskAction: (taskId: string, action: "complete" | "skip") => void;
}

const getTaskIcon = (title: string) => {
  if (title.toLowerCase().includes("elrapp")) return LogIn;
  if (title.toLowerCase().includes("sja")) return FileText;
  if (title.toLowerCase().includes("kjore")) return Car;
  if (title.toLowerCase().includes("linx")) return ClipboardList;
  return ClipboardList;
};

export function TaskSuggestionPanel({
  tasks,
  onTaskAction,
}: TaskSuggestionPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => {
        const Icon = getTaskIcon(task.title);
        const isHandled = task.completed || task.skipped;

        return (
          <div
            key={task.id}
            className={cn(
              "flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all",
              isHandled && "opacity-60"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                task.completed
                  ? "bg-success text-success-foreground"
                  : task.skipped
                    ? "bg-muted text-muted-foreground"
                    : "bg-secondary text-secondary-foreground"
              )}
            >
              {task.completed ? (
                <Check className="h-6 w-6" />
              ) : (
                <Icon className="h-6 w-6" />
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col gap-1">
              <span
                className={cn(
                  "font-medium text-card-foreground",
                  task.skipped && "line-through"
                )}
              >
                {task.title}
              </span>
              <span
                className={cn(
                  "text-xs font-medium uppercase tracking-wide",
                  task.status === "pakrevd"
                    ? "text-accent"
                    : "text-muted-foreground"
                )}
              >
                {task.status === "pakrevd" ? "Pakrevd" : "Anbefalt"}
              </span>
            </div>

            {/* Actions */}
            {!isHandled && (
              <div className="flex gap-2">
                <button
                  onClick={() => onTaskAction(task.id, "complete")}
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all active:scale-95"
                  aria-label={`Utfor ${task.title}`}
                >
                  <Check className="h-5 w-5" />
                </button>
                {task.status !== "pakrevd" && (
                  <button
                    onClick={() => onTaskAction(task.id, "skip")}
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground transition-all active:scale-95"
                    aria-label={`Hopp over ${task.title}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { Mic } from "lucide-react";

interface VoiceButtonProps {
  isListening: boolean;
  onClick: () => void;
  label: string;
  size?: "lg" | "xl";
  className?: string;
  disabled?: boolean;
}

export function VoiceButton({
  isListening,
  onClick,
  label,
  size = "xl",
  className,
  disabled = false,
}: VoiceButtonProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-full transition-all duration-300 active:scale-95",
        "bg-primary text-primary-foreground",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-ring",
        size === "xl" && "h-40 w-40 text-lg",
        size === "lg" && "h-28 w-28 text-base",
        isListening && "bg-voice-active",
        disabled && "opacity-50",
        className
      )}
      aria-label={label}
    >
      {/* Pulse rings when listening */}
      {isListening && (
        <>
          <span
            className="absolute inset-0 rounded-full bg-voice-pulse"
            style={{
              animation: "pulse-ring 1.5s ease-out infinite",
            }}
          />
          <span
            className="absolute inset-0 rounded-full bg-voice-pulse"
            style={{
              animation: "pulse-ring 1.5s ease-out infinite 0.5s",
            }}
          />
        </>
      )}

      <Mic
        className={cn(
          "relative z-10 transition-transform",
          size === "xl" && "h-12 w-12",
          size === "lg" && "h-8 w-8",
          isListening && "animate-pulse"
        )}
      />
      <span
        className={cn(
          "relative z-10 mt-2 font-medium",
          size === "xl" && "text-lg",
          size === "lg" && "text-sm"
        )}
      >
        {label}
      </span>

      {/* Audio wave visualization when listening */}
      {isListening && (
        <div className="absolute -bottom-8 flex items-end justify-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-primary"
              style={{
                height: "16px",
                animation: `listening-wave 0.8s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </button>
  );
}

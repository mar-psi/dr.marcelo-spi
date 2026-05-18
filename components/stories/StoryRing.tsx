"use client";

import React from "react";
import { cn } from "@/lib/utils";

type RingState = "new" | "seen" | "expired";

interface StoryRingProps {
  src?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  ringState?: RingState;
  newCount?: number;
  onClick?: () => void;
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { outer: "w-12 h-12", inner: "w-10 h-10", text: "text-[10px]", badge: "w-4 h-4 text-[8px]" },
  md: { outer: "w-16 h-16", inner: "w-13 h-13", text: "text-xs", badge: "w-5 h-5 text-[9px]" },
  lg: { outer: "w-20 h-20", inner: "w-17 h-17", text: "text-sm", badge: "w-5 h-5 text-[9px]" },
};

export function StoryRingComponent({
  src,
  name = "Dr. Marcelo",
  size = "md",
  ringState = "new",
  newCount,
  onClick,
  showLabel = true,
  className,
}: StoryRingProps) {
  const cfg = sizeConfig[size];
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <button
      onClick={onClick}
      className={cn("flex flex-col items-center gap-1.5 group cursor-pointer", className)}
      aria-label={`Story de ${name}${ringState === "new" ? " — não visto" : ""}`}
    >
      <div className="relative">
        {/* Ring wrapper */}
        <div
          className={cn(
            "rounded-full p-[2.5px] transition-all duration-300",
            cfg.outer,
            ringState === "new" &&
              "bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] animate-[storyRingPulse_2s_ease-in-out_infinite] group-hover:shadow-glow",
            ringState === "seen" &&
              "bg-gradient-to-br from-accent-primary to-accent-primary opacity-50",
            ringState === "expired" && "bg-content-disabled"
          )}
        >
          {/* White/dark gap ring */}
          <div className="w-full h-full rounded-full bg-background-primary p-[2px]">
            {/* Avatar */}
            <div className="w-full h-full rounded-full overflow-hidden bg-background-tertiary">
              {src ? (
                <img
                  src={src}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-primary to-accent-secondary">
                  <span className="text-white font-bold text-xs">{initials}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Badge counter */}
        {ringState === "new" && newCount && newCount > 0 && (
          <div
            className={cn(
              "absolute -top-0.5 -right-0.5 rounded-full bg-accent-primary border-2 border-background-primary flex items-center justify-center font-bold text-white",
              cfg.badge
            )}
          >
            {newCount > 9 ? "9+" : newCount}
          </div>
        )}
      </div>

      {showLabel && (
        <span
          className={cn(
            "font-medium max-w-[64px] truncate leading-tight",
            cfg.text,
            ringState === "new" ? "text-content-primary" : "text-content-secondary"
          )}
        >
          {name}
        </span>
      )}
    </button>
  );
}

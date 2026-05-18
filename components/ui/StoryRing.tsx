"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

type RingState = "new" | "seen" | "expired";

interface StoryRingProps {
  src?: string;
  name: string;
  ringState?: RingState;
  size?: "sm" | "md" | "lg";
  newCount?: number;
  onClick?: () => void;
  className?: string;
}

const ringSizeMap = {
  sm: { outer: "w-10 h-10", padding: "p-[2px]", gap: "gap-1", label: "text-xs" },
  md: { outer: "w-14 h-14", padding: "p-[2px]", gap: "gap-1.5", label: "text-xs" },
  lg: { outer: "w-20 h-20", padding: "p-[2.5px]", gap: "gap-2", label: "text-sm" },
};

const avatarSizeMap = {
  sm: "sm" as const,
  md: "md" as const,
  lg: "lg" as const,
};

export function StoryRing({
  src,
  name,
  ringState = "new",
  size = "md",
  newCount,
  onClick,
  className,
}: StoryRingProps) {
  const sizes = ringSizeMap[size];
  const avatarSize = avatarSizeMap[size];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center cursor-pointer group",
        sizes.gap,
        className
      )}
      aria-label={`Story de ${name}${ringState === "new" ? " — Novo" : ""}`}
    >
      <div className="relative">
        {/* Ring */}
        <div
          className={cn(
            "rounded-full flex items-center justify-center",
            sizes.outer,
            sizes.padding,
            ringState === "new" && "bg-gradient-to-br from-accent-primary to-blue-500 animate-[storyRingPulse_2s_ease-in-out_infinite]",
            ringState === "seen" && "bg-accent-primary opacity-50",
            ringState === "expired" && "bg-content-disabled"
          )}
        >
          <div className="rounded-full bg-background-primary p-[2px]">
            <Avatar
              src={src}
              name={name}
              size={avatarSize}
              ring="none"
            />
          </div>
        </div>

        {/* New badge */}
        {ringState === "new" && newCount && newCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-primary border-2 border-background-primary flex items-center justify-center">
            <span className="text-[9px] font-bold text-white leading-none">{newCount}</span>
          </div>
        )}
      </div>

      {/* Name label */}
      <span
        className={cn(
          sizes.label,
          "font-medium max-w-[72px] truncate leading-tight",
          ringState === "new" ? "text-content-primary" : "text-content-secondary"
        )}
      >
        {name}
      </span>
    </button>
  );
}

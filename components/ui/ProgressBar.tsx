"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: "primary" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

const colorMap = {
  primary: "bg-accent-primary",
  success: "bg-status-success",
  warning: "bg-status-warning",
  error: "bg-status-error",
};

const sizeMap = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  color = "primary",
  size = "md",
  animated = true,
  className,
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-content-secondary">{label}</span>}
          {showPercentage && (
            <span className="text-xs font-medium text-content-primary">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        ref={ref}
        className={cn(
          "w-full rounded-full bg-background-tertiary overflow-hidden",
          sizeMap[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            "h-full rounded-full",
            colorMap[color],
            animated && "transition-all duration-700 ease-out"
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

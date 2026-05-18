"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getUserLevel, getNextLevel, getLevelProgress, getXpToNextLevel } from "@/data/badges";
import { cn } from "@/lib/utils";

interface XPBarProps {
  xp: number;
  className?: string;
}

export function XPBar({ xp, className }: XPBarProps) {
  const [width, setWidth] = useState(0);
  const level = getUserLevel(xp);
  const next = getNextLevel(xp);
  const progress = getLevelProgress(xp);
  const toNext = getXpToNextLevel(xp);

  useEffect(() => {
    const t = setTimeout(() => setWidth(progress), 200);
    return () => clearTimeout(t);
  }, [progress]);

  return (
    <div className={cn("w-full", className)}>
      {/* Labels */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{level.icon}</span>
          <div>
            <p className="text-sm font-bold text-content-primary leading-tight">
              {level.name}
            </p>
            <p className="text-xs text-content-secondary">
              {xp.toLocaleString("pt-BR")} XP total
            </p>
          </div>
        </div>
        {next && (
          <div className="text-right">
            <p className="text-xs text-content-disabled">Próximo nível</p>
            <p className="text-sm font-semibold text-accent-secondary">
              {next.icon} {next.name}
            </p>
            <p className="text-xs text-content-disabled">
              faltam {toNext} XP
            </p>
          </div>
        )}
        {!next && (
          <div className="text-right">
            <p className="text-xs text-accent-secondary font-semibold">
              Nível máximo! 🏆
            </p>
          </div>
        )}
      </div>

      {/* Bar */}
      <div className="relative h-4 bg-background-tertiary rounded-full overflow-hidden border border-border-subtle">
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${level.color}88, ${level.color})`,
          }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Shimmer */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s infinite linear",
            }}
          />
        </motion.div>

        {/* Level markers */}
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="absolute top-0 bottom-0 w-px bg-background-primary/40"
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>

      {/* Progress text */}
      <p className="text-xs text-content-disabled mt-1.5 text-right">
        {progress}% do nível atual
      </p>
    </div>
  );
}

"use client";

import React from "react";
import { motion } from "framer-motion";
import { getUserLevel } from "@/data/badges";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  xp: number;
  size?: "sm" | "md" | "lg";
  showXp?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { wrapper: "px-2.5 py-1", icon: "text-sm", text: "text-xs", xp: "text-[10px]" },
  md: { wrapper: "px-4 py-2", icon: "text-xl", text: "text-sm", xp: "text-xs" },
  lg: { wrapper: "px-6 py-3", icon: "text-3xl", text: "text-lg", xp: "text-sm" },
};

export function LevelBadge({ xp, size = "md", showXp = false, className }: LevelBadgeProps) {
  const level = getUserLevel(xp);
  const cfg = sizeConfig[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border",
        cfg.wrapper,
        className
      )}
      style={{
        backgroundColor: `${level.color}18`,
        borderColor: `${level.color}50`,
      }}
    >
      <span className={cfg.icon}>{level.icon}</span>
      <div>
        <p className={cn("font-bold text-content-primary leading-tight", cfg.text)}>
          {level.name}
        </p>
        {showXp && (
          <p className={cn("text-content-disabled leading-tight", cfg.xp)}>
            {xp.toLocaleString("pt-BR")} XP
          </p>
        )}
      </div>
    </motion.div>
  );
}

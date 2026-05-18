"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, CheckCircle2, X, Sparkles, Star } from "lucide-react";
import type { BadgeDefinition } from "@/data/badges";
import { ProgressBar } from "@/components/ui";
import { cn } from "@/lib/utils";

interface BadgeCardProps {
  badge: BadgeDefinition;
  unlocked: boolean;
}

const rarityConfig: Record<string, { label: string; color: string; glow: string; border: string }> = {
  comum: {
    label: "Comum",
    color: "text-content-secondary",
    glow: "",
    border: "border-border-subtle",
  },
  raro: {
    label: "Raro",
    color: "text-blue-400",
    glow: "shadow-[0_0_16px_rgba(59,130,246,0.2)]",
    border: "border-[rgba(59,130,246,0.3)]",
  },
  epico: {
    label: "Épico",
    color: "text-accent-secondary",
    glow: "shadow-[0_0_20px_rgba(124,58,237,0.25)]",
    border: "border-[rgba(124,58,237,0.4)]",
  },
  lendario: {
    label: "Lendário",
    color: "text-yellow-400",
    glow: "shadow-[0_0_24px_rgba(250,204,21,0.3)]",
    border: "border-[rgba(250,204,21,0.4)]",
  },
};

export function BadgeCard({ badge, unlocked }: BadgeCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const rarity = rarityConfig[badge.rarity];
  const hasProgress = badge.progress !== undefined && badge.total !== undefined;

  return (
    <>
      <motion.div
        onClick={() => setModalOpen(true)}
        whileHover={{ scale: 1.04, y: -3 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative flex flex-col items-center text-center p-4 rounded-2xl border cursor-pointer",
          "bg-background-secondary transition-all duration-200",
          unlocked
            ? [rarity.border, rarity.glow, "hover:border-opacity-80"]
            : "border-border-subtle hover:border-border-DEFAULT",
          !unlocked && "opacity-70"
        )}
      >
        {/* Rarity indicator */}
        {unlocked && badge.rarity !== "comum" && (
          <div className="absolute top-2 right-2">
            <Star
              size={10}
              className={cn("fill-current", rarity.color)}
            />
          </div>
        )}

        {/* Icon container */}
        <div
          className={cn(
            "relative w-16 h-16 rounded-2xl flex items-center justify-center mb-3 text-3xl",
            "transition-all duration-200",
            unlocked
              ? "bg-background-tertiary"
              : "bg-background-tertiary grayscale"
          )}
        >
          <span
            className={cn(
              "transition-all duration-200",
              !unlocked && "opacity-40"
            )}
          >
            {badge.icon}
          </span>

          {/* Lock overlay */}
          {!unlocked && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background-secondary/60">
              <Lock size={16} className="text-content-disabled" />
            </div>
          )}

          {/* Unlocked sparkle */}
          {unlocked && (
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <Sparkles size={12} className={rarity.color} />
            </motion.div>
          )}
        </div>

        {/* Label */}
        <p
          className={cn(
            "text-sm font-bold leading-tight mb-1",
            unlocked ? "text-content-primary" : "text-content-disabled"
          )}
        >
          {badge.label}
        </p>

        {/* Rarity label */}
        <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2", rarity.color)}>
          {rarity.label}
        </p>

        {/* Unlocked status or progress */}
        {unlocked && badge.unlockedAt ? (
          <p className="text-[10px] text-content-disabled">
            Conquistado
          </p>
        ) : hasProgress && !unlocked ? (
          <div className="w-full mt-1">
            <ProgressBar
              value={badge.progress ?? 0}
              max={badge.total ?? 1}
              size="sm"
              color="primary"
            />
            <p className="text-[10px] text-content-disabled mt-1">
              {badge.progress}/{badge.total}
            </p>
          </div>
        ) : !unlocked ? (
          <p className="text-[10px] text-content-disabled">Bloqueado</p>
        ) : null}

        {/* XP badge */}
        <div className="absolute top-2 left-2">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent-primary/15 text-accent-secondary border border-accent-primary/30">
            +{badge.xpReward} XP
          </span>
        </div>
      </motion.div>

      {/* Detail modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={cn(
                "relative z-10 w-full max-w-sm bg-background-secondary rounded-2xl border p-6 shadow-card",
                unlocked ? rarity.border : "border-border-subtle"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-background-tertiary transition-colors"
              >
                <X size={15} />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center text-4xl",
                    "bg-background-tertiary border",
                    unlocked ? rarity.border : "border-border-subtle",
                    !unlocked && "grayscale opacity-50"
                  )}
                >
                  {badge.icon}
                </motion.div>
              </div>

              {/* Info */}
              <div className="text-center mb-5">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-content-primary">
                    {badge.label}
                  </h3>
                  <span className={cn("text-xs font-semibold", rarity.color)}>
                    {rarity.label}
                  </span>
                </div>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-5">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-background-tertiary">
                  <CheckCircle2 size={14} className="text-accent-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-content-primary mb-0.5">
                      Requisito
                    </p>
                    <p className="text-xs text-content-secondary">{badge.requirement}</p>
                  </div>
                </div>

                {!unlocked && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-accent-primary/08 border border-accent-primary/20">
                    <Sparkles size={14} className="text-accent-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-accent-secondary mb-0.5">
                        Dica
                      </p>
                      <p className="text-xs text-content-secondary">{badge.hint}</p>
                    </div>
                  </div>
                )}

                {hasProgress && !unlocked && (
                  <div className="p-3 rounded-xl bg-background-tertiary">
                    <p className="text-xs font-semibold text-content-primary mb-2">
                      Progresso atual
                    </p>
                    <ProgressBar
                      value={badge.progress ?? 0}
                      max={badge.total ?? 1}
                      size="md"
                      color="primary"
                      showPercentage
                    />
                    <p className="text-xs text-content-secondary mt-1">
                      {badge.progress} de {badge.total} concluídos
                    </p>
                  </div>
                )}
              </div>

              {/* XP reward */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-accent-primary/10 border border-accent-primary/20">
                <span className="text-sm text-content-secondary">Recompensa XP</span>
                <span className="text-base font-bold text-accent-secondary">
                  +{badge.xpReward} XP
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

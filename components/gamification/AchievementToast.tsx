"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import type { BadgeDefinition } from "@/data/badges";

interface AchievementToastProps {
  badge: BadgeDefinition | null;
  onClose: () => void;
}

export function AchievementToast({ badge, onClose }: AchievementToastProps) {
  React.useEffect(() => {
    if (!badge) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [badge, onClose]);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.9 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed bottom-24 lg:bottom-8 right-5 z-[9999] w-80 bg-background-secondary border border-[rgba(124,58,237,0.5)] rounded-2xl shadow-[0_0_40px_rgba(124,58,237,0.3)] overflow-hidden"
        >
          {/* Top glow bar */}
          <div className="h-1 w-full bg-gradient-to-r from-accent-primary via-accent-secondary to-blue-500" />

          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Badge icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 250, damping: 12 }}
                className="w-14 h-14 rounded-2xl bg-accent-primary/20 border border-accent-primary/40 flex items-center justify-center text-3xl shrink-0"
              >
                {badge.icon}
              </motion.div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Sparkles size={12} className="text-accent-secondary" />
                  <p className="text-xs font-semibold text-accent-secondary uppercase tracking-wider">
                    Conquista Desbloqueada!
                  </p>
                </div>
                <p className="text-sm font-bold text-content-primary leading-tight">
                  {badge.label}
                </p>
                <p className="text-xs text-content-secondary mt-0.5 line-clamp-2">
                  {badge.description}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-primary/15 border border-accent-primary/30">
                  <span className="text-xs font-bold text-accent-secondary">
                    +{badge.xpReward} XP
                  </span>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-content-disabled hover:text-content-secondary transition-colors"
              >
                <X size={13} />
              </button>
            </div>

            {/* Progress bar (auto-dismiss timer) */}
            <motion.div
              className="mt-3 h-0.5 rounded-full bg-accent-primary"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

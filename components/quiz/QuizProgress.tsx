"use client";

import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizProgressProps {
  current: number;
  total: number;
  onExit: () => void;
  quizTitle: string;
}

export function QuizProgress({ current, total, onExit, quizTitle }: QuizProgressProps) {
  const [showConfirm, setShowConfirm] = React.useState(false);
  const percentage = ((current) / total) * 100;

  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-8 py-4 border-b border-border-subtle bg-background-secondary/80 backdrop-blur-sm shrink-0">
        {/* Quiz label */}
        <div className="hidden sm:block min-w-0 max-w-[200px]">
          <p className="text-xs text-content-disabled truncate">{quizTitle}</p>
        </div>

        {/* Central progress */}
        <div className="flex-1 max-w-sm mx-auto px-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-content-secondary font-medium">
              Pergunta {current} de {total}
            </span>
            <span className="text-xs text-content-secondary font-medium">
              {Math.round(percentage)}%
            </span>
          </div>
          {/* Segmented progress */}
          <div className="flex gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full bg-background-tertiary overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    i < current - 1
                      ? "bg-status-success"
                      : i === current - 1
                      ? "bg-accent-primary"
                      : "bg-transparent"
                  )}
                  initial={{ width: "0%" }}
                  animate={{
                    width: i < current ? "100%" : "0%",
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Exit button */}
        <div className="flex justify-end min-w-[60px]">
          <button
            onClick={() => setShowConfirm(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-background-tertiary transition-colors"
            aria-label="Sair do quiz"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Exit confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-background-secondary rounded-2xl border border-border-subtle p-6 shadow-card"
          >
            <h3 className="text-lg font-bold text-content-primary mb-2">
              Sair do quiz?
            </h3>
            <p className="text-sm text-content-secondary mb-6">
              Seu progresso neste quiz não será salvo e você precisará recomeçar do início.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-11 rounded-xl border border-border-subtle bg-background-tertiary text-sm font-medium text-content-secondary hover:text-content-primary transition-colors"
              >
                Continuar quiz
              </button>
              <button
                onClick={onExit}
                className="flex-1 h-11 rounded-xl bg-status-error text-white text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Sair
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

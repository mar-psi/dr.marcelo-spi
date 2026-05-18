"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import type { QuizQuestion as QuizQuestionType } from "@/data/quizzes";
import { cn } from "@/lib/utils";

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionIndex: number;
  selectedId: string | null;
  confirmed: boolean;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onNext: () => void;
  isLast: boolean;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

export function QuizQuestion({
  question,
  questionIndex,
  selectedId,
  confirmed,
  onSelect,
  onConfirm,
  onNext,
  isLast,
}: QuizQuestionProps) {
  const isCorrect = selectedId === question.correctId;

  const getOptionStyle = (optionId: string) => {
    if (!confirmed) {
      return selectedId === optionId
        ? "border-accent-primary bg-[rgba(124,58,237,0.15)] text-content-primary scale-[1.01]"
        : "border-border-subtle bg-background-tertiary text-content-secondary hover:border-accent-primary/60 hover:text-content-primary hover:bg-[rgba(124,58,237,0.06)]";
    }
    if (optionId === question.correctId) {
      return "border-status-success bg-status-successBg text-status-success";
    }
    if (optionId === selectedId && optionId !== question.correctId) {
      return "border-status-error bg-status-errorBg text-status-error";
    }
    return "border-border-subtle bg-background-tertiary text-content-disabled opacity-50";
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="flex flex-col flex-1 w-full max-w-2xl mx-auto px-4 lg:px-0"
      >
        {/* Question number indicator */}
        <div className="flex justify-center mb-6">
          <span className="text-xs font-semibold text-accent-secondary bg-accent-primary/10 border border-accent-primary/30 px-3 py-1 rounded-full">
            Pergunta {questionIndex + 1}
          </span>
        </div>

        {/* Question text */}
        <h2 className="text-xl lg:text-2xl font-bold text-content-primary text-center leading-snug mb-8 px-2">
          {question.question}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {question.options.map((option, i) => (
            <motion.button
              key={option.id}
              whileHover={!confirmed ? { x: 3 } : {}}
              whileTap={!confirmed ? { scale: 0.99 } : {}}
              onClick={() => !confirmed && onSelect(option.id)}
              disabled={confirmed}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left",
                "transition-all duration-200 font-medium text-sm lg:text-base",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary",
                getOptionStyle(option.id)
              )}
            >
              {/* Letter bubble */}
              <span className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-colors duration-200",
                confirmed && option.id === question.correctId
                  ? "border-status-success bg-status-success text-white"
                  : confirmed && option.id === selectedId && !isCorrect
                  ? "border-status-error bg-status-error text-white"
                  : "border-current"
              )}>
                {OPTION_LETTERS[i]}
              </span>

              <span className="flex-1">{option.text}</span>

              {/* Check/X icon when confirmed */}
              {confirmed && option.id === question.correctId && (
                <CheckCircle2 size={18} className="text-status-success shrink-0" />
              )}
              {confirmed && option.id === selectedId && option.id !== question.correctId && (
                <XCircle size={18} className="text-status-error shrink-0" />
              )}
            </motion.button>
          ))}
        </div>

        {/* Feedback box */}
        <AnimatePresence>
          {confirmed && (
            <motion.div
              initial={{ opacity: 0, y: 14, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 14, height: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "rounded-xl border p-4 mb-6 overflow-hidden",
                isCorrect
                  ? "bg-status-successBg border-[rgba(34,197,94,0.4)]"
                  : "bg-status-errorBg border-[rgba(239,68,68,0.4)]"
              )}
            >
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle2 size={18} className="text-status-success shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={18} className="text-status-error shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={cn(
                    "text-sm font-bold mb-1",
                    isCorrect ? "text-status-success" : "text-status-error"
                  )}>
                    {isCorrect ? "Correto! Muito bem!" : "Ops! Não foi dessa vez."}
                  </p>
                  <p className="text-sm text-content-secondary leading-relaxed">
                    {question.explanation}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

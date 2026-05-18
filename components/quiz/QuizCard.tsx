"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  BarChart2,
  ChevronRight,
  RefreshCw,
  Play,
} from "lucide-react";
import { Badge, ProgressBar } from "@/components/ui";
import type { Quiz } from "@/data/quizzes";
import { cn } from "@/lib/utils";

interface QuizCardProps {
  quiz: Quiz;
}

const difficultyColor: Record<string, string> = {
  Fácil: "text-status-success border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.1)]",
  Médio: "text-status-warning border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.1)]",
  Difícil: "text-status-error border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.1)]",
};

const categoryVariant: Record<string, "doencas" | "transtornos" | "curiosidades"> = {
  doencas: "doencas",
  transtornos: "transtornos",
  curiosidades: "curiosidades",
};

const categoryLabel: Record<string, string> = {
  doencas: "Doenças",
  transtornos: "Transtornos",
  curiosidades: "Curiosidades",
};

export function QuizCard({ quiz }: QuizCardProps) {
  const isDone = quiz.status === "concluido";
  const inProgress = quiz.status === "em_progresso";

  const actionHref = isDone
    ? `/quizzes/${quiz.slug}?refazer=true`
    : `/quizzes/${quiz.slug}`;

  return (
    <motion.div
      className="group relative rounded-xl overflow-hidden bg-background-secondary border border-border-subtle shadow-card flex flex-col"
      whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(124,58,237,0.2)" }}
      transition={{ duration: 0.2 }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={quiz.thumbnailUrl}
          alt={quiz.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,15,0.85)] via-[rgba(10,10,15,0.3)] to-transparent" />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center border-2 backdrop-blur-sm",
            isDone
              ? "bg-[rgba(34,197,94,0.2)] border-status-success"
              : "bg-[rgba(124,58,237,0.2)] border-accent-primary"
          )}>
            {isDone ? (
              <CheckCircle2 size={26} className="text-status-success" />
            ) : (
              <HelpCircle size={26} className="text-accent-secondary" />
            )}
          </div>
        </div>

        {/* Completed overlay */}
        {isDone && (
          <div className="absolute inset-0 bg-[rgba(10,10,15,0.4)]" />
        )}

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          <Badge variant={categoryVariant[quiz.category]} size="sm">
            {categoryLabel[quiz.category]}
          </Badge>
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
            difficultyColor[quiz.difficulty]
          )}>
            {quiz.difficulty}
          </span>
        </div>

        {/* Score overlay on completed */}
        {isDone && quiz.score !== undefined && (
          <div className="absolute bottom-2 right-2">
            <div className="flex items-center gap-1.5 bg-status-successBg border border-[rgba(34,197,94,0.4)] rounded-lg px-2.5 py-1">
              <CheckCircle2 size={11} className="text-status-success" />
              <span className="text-xs font-bold text-status-success">{quiz.score}%</span>
            </div>
          </div>
        )}

        {/* In progress badge */}
        {inProgress && (
          <div className="absolute bottom-2 right-2">
            <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-accent-primary/20 border border-accent-primary/40 text-accent-secondary">
              Em progresso
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-sm font-bold text-content-primary line-clamp-2 leading-snug mb-2 group-hover:text-accent-secondary transition-colors duration-200">
          {quiz.title}
        </h3>
        <p className="text-xs text-content-secondary line-clamp-2 mb-3 flex-1">
          {quiz.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-content-disabled mb-4">
          <span className="flex items-center gap-1">
            <HelpCircle size={11} />
            {quiz.questions.length} perguntas
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            ~{quiz.estimatedMinutes} min
          </span>
          {quiz.attempts !== undefined && quiz.attempts > 0 && (
            <span className="flex items-center gap-1">
              <BarChart2 size={11} />
              {quiz.attempts}x tentativa{quiz.attempts > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Score bar if completed */}
        {isDone && quiz.score !== undefined && (
          <div className="mb-4">
            <ProgressBar
              value={quiz.score}
              color={quiz.score >= 70 ? "success" : "warning"}
              size="sm"
              label="Sua melhor pontuação"
              showPercentage
            />
          </div>
        )}

        {/* CTA */}
        <Link href={actionHref}>
          <motion.div
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
              isDone
                ? "bg-background-tertiary border border-border-subtle text-content-secondary hover:border-accent-primary/40 hover:text-content-primary"
                : inProgress
                ? "bg-accent-primary text-white shadow-glow hover:bg-accent-primaryHover"
                : "bg-accent-primary text-white shadow-glow hover:bg-accent-primaryHover"
            )}
          >
            {isDone ? (
              <>
                <RefreshCw size={14} />
                Refazer Quiz
              </>
            ) : inProgress ? (
              <>
                <Play size={14} fill="white" />
                Continuar
              </>
            ) : (
              <>
                <Play size={14} fill="white" />
                Começar Quiz
              </>
            )}
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
}

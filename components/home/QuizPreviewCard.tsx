"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HelpCircle, CheckCircle2, Clock } from "lucide-react";
import { Badge, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/utils";

interface QuizPreviewCardProps {
  item: {
    id: string;
    slug: string;
    title: string;
    questions: number;
    difficulty: string;
    category: "doencas" | "transtornos" | "curiosidades";
    thumbnailUrl: string;
    completed: boolean;
    score: number | null;
  };
}

const difficultyColor: Record<string, string> = {
  Fácil: "text-status-success",
  Médio: "text-status-warning",
  Difícil: "text-status-error",
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

export function QuizPreviewCard({ item }: QuizPreviewCardProps) {
  return (
    <motion.div
      className="group relative rounded-xl overflow-hidden bg-background-secondary border border-border-subtle shadow-card"
      whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(124,58,237,0.2)" }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/quizzes/${item.slug}`}>
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,15,0.85)] to-transparent" />

          {/* Icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              item.completed
                ? "bg-status-success/20 border-2 border-status-success"
                : "bg-accent-primary/20 border-2 border-accent-primary"
            )}>
              {item.completed ? (
                <CheckCircle2 size={22} className="text-status-success" />
              ) : (
                <HelpCircle size={22} className="text-accent-primary" />
              )}
            </div>
          </div>

          {/* Completed overlay */}
          {item.completed && (
            <div className="absolute top-2 right-2">
              <Badge variant="success">
                <CheckCircle2 size={10} className="mr-1" />
                {item.score}% correto
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={categoryVariant[item.category]} size="sm">
              {categoryLabel[item.category]}
            </Badge>
            <span className={cn("text-xs font-medium", difficultyColor[item.difficulty])}>
              {item.difficulty}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-content-primary line-clamp-2 leading-snug mb-2 group-hover:text-accent-secondary transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-content-secondary">
            <span className="flex items-center gap-1">
              <HelpCircle size={11} />
              {item.questions} perguntas
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              ~{Math.ceil(item.questions * 0.5)} min
            </span>
          </div>
          {item.completed && item.score !== null && (
            <div className="mt-2">
              <ProgressBar value={item.score} color="success" size="sm" />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

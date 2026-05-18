"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Share2,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Badge, ProgressBar } from "@/components/ui";
import type { QuizQuestion } from "@/data/quizzes";
import { cn } from "@/lib/utils";

interface QuizResultProps {
  quizTitle: string;
  quizSlug: string;
  questions: QuizQuestion[];
  answers: string[];
  totalTimeSeconds: number;
  onRetry: () => void;
  nextQuizSlug?: string;
}

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

function Confetti({ active }: { active: boolean }) {
  const colors = ["#7C3AED", "#A78BFA", "#3B82F6", "#22C55E", "#F59E0B"];
  const particles: ConfettiParticle[] = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    size: 4 + Math.random() * 8,
  }));

  if (!active) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm top-0"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: 0, rotate: 720 }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}min ${sec}s` : `${sec}s`;
}

const badgeDefs = [
  {
    id: "primeira_vez",
    label: "Primeira vez",
    icon: "🎯",
    condition: (score: number, attempts: number) => attempts === 1,
    xp: 10,
  },
  {
    id: "perfeito",
    label: "Perfeito!",
    icon: "🏆",
    condition: (score: number) => score === 100,
    xp: 25,
  },
  {
    id: "persistente",
    label: "Persistente",
    icon: "💪",
    condition: (score: number, attempts: number) => attempts > 1,
    xp: 5,
  },
];

export function QuizResult({
  quizTitle,
  quizSlug,
  questions,
  answers,
  totalTimeSeconds,
  onRetry,
  nextQuizSlug,
}: QuizResultProps) {
  const [showAnswers, setShowAnswers] = useState(false);

  const correctCount = answers.filter((a, i) => a === questions[i]?.correctId).length;
  const score = Math.round((correctCount / questions.length) * 100);
  const isExcellent = score === 100;
  const isGood = score >= 70;

  const animatedScore = useCountUp(score, 1000);
  const unlockedBadges = badgeDefs.filter((b) => b.condition(score, 1));

  const titleMap = {
    excellent: "Perfeito! Você arrasou! 🏆",
    good: "Muito bem! Continue assim! ⭐",
    ok: "Bom esforço! Revise e tente de novo 📚",
  };
  const resultTitle = isExcellent
    ? titleMap.excellent
    : isGood
    ? titleMap.good
    : titleMap.ok;

  const handleShare = async () => {
    const text = `Fiz o quiz "${quizTitle}" na plataforma Dr. Marcelo Psiquiatra e tirei ${score}%! 🧠`;
    try {
      if (navigator.share) {
        await navigator.share({ title: quizTitle, text });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {}
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-background-primary overflow-hidden">
      {/* Confetti */}
      <Confetti active={isGood} />

      {/* Glow background */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{
          background: isExcellent
            ? "rgba(250,204,21,0.12)"
            : isGood
            ? "rgba(124,58,237,0.15)"
            : "rgba(100,116,139,0.1)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-xl mx-auto px-4 py-12">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
          className="mb-6"
        >
          {isExcellent ? (
            <div className="w-24 h-24 rounded-full bg-[rgba(250,204,21,0.15)] border-2 border-[rgba(250,204,21,0.4)] flex items-center justify-center shadow-[0_0_40px_rgba(250,204,21,0.3)]">
              <Trophy size={48} className="text-yellow-400" />
            </div>
          ) : isGood ? (
            <div className="w-24 h-24 rounded-full bg-[rgba(124,58,237,0.15)] border-2 border-accent-primary flex items-center justify-center shadow-glow">
              <Star size={48} className="text-accent-secondary" fill="currentColor" />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-background-tertiary border-2 border-border-DEFAULT flex items-center justify-center">
              <BookOpen size={48} className="text-content-secondary" />
            </div>
          )}
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-2xl lg:text-3xl font-bold text-content-primary text-center mb-2"
        >
          {resultTitle}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-content-secondary text-center mb-8"
        >
          {quizTitle}
        </motion.p>

        {/* Score circle + bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full bg-background-secondary rounded-2xl border border-border-subtle p-6 mb-5"
        >
          {/* Big score */}
          <div className="flex items-center justify-center mb-5">
            <div className="text-center">
              <span
                className={cn(
                  "text-7xl font-bold tabular-nums",
                  isExcellent
                    ? "text-yellow-400"
                    : isGood
                    ? "text-gradient-purple"
                    : "text-content-secondary"
                )}
              >
                {animatedScore}
              </span>
              <span className="text-2xl font-bold text-content-secondary">%</span>
            </div>
          </div>

          {/* Progress bar */}
          <ProgressBar
            value={score}
            color={isExcellent ? "success" : isGood ? "primary" : "warning"}
            size="lg"
            animated
          />

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-background-tertiary">
              <CheckCircle2 size={18} className="text-status-success" />
              <span className="text-lg font-bold text-content-primary">{correctCount}</span>
              <span className="text-[10px] text-content-disabled text-center">Corretas</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-background-tertiary">
              <XCircle size={18} className="text-status-error" />
              <span className="text-lg font-bold text-content-primary">
                {questions.length - correctCount}
              </span>
              <span className="text-[10px] text-content-disabled text-center">Erradas</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-background-tertiary">
              <Clock size={18} className="text-accent-secondary" />
              <span className="text-lg font-bold text-content-primary">
                {formatTime(totalTimeSeconds)}
              </span>
              <span className="text-[10px] text-content-disabled text-center">Tempo total</span>
            </div>
          </div>
        </motion.div>

        {/* Badges */}
        {unlockedBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full bg-background-secondary rounded-2xl border border-[rgba(124,58,237,0.3)] p-4 mb-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-accent-secondary" />
              <p className="text-xs font-semibold text-accent-secondary uppercase tracking-wider">
                Conquistas desbloqueadas
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {unlockedBadges.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.7 + i * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background-tertiary border border-accent-primary/30"
                >
                  <span className="text-lg">{badge.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-content-primary">{badge.label}</p>
                    <p className="text-[10px] text-accent-secondary">+{badge.xp} XP</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Show answers toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="w-full mb-5"
        >
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-background-secondary border border-border-subtle hover:border-accent-primary/40 transition-colors"
          >
            <span className="text-sm font-medium text-content-primary">
              Ver respostas e explicações
            </span>
            {showAnswers ? (
              <ChevronUp size={16} className="text-content-secondary" />
            ) : (
              <ChevronDown size={16} className="text-content-secondary" />
            )}
          </button>

          <AnimatePresence>
            {showAnswers && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-3">
                  {questions.map((q, i) => {
                    const userAnswer = answers[i];
                    const isRight = userAnswer === q.correctId;
                    const userOption = q.options.find((o) => o.id === userAnswer);
                    const correctOption = q.options.find((o) => o.id === q.correctId);

                    return (
                      <div
                        key={q.id}
                        className={cn(
                          "p-4 rounded-xl border",
                          isRight
                            ? "bg-status-successBg border-[rgba(34,197,94,0.3)]"
                            : "bg-status-errorBg border-[rgba(239,68,68,0.3)]"
                        )}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          {isRight ? (
                            <CheckCircle2 size={15} className="text-status-success shrink-0 mt-0.5" />
                          ) : (
                            <XCircle size={15} className="text-status-error shrink-0 mt-0.5" />
                          )}
                          <p className="text-sm font-semibold text-content-primary leading-snug">
                            {i + 1}. {q.question}
                          </p>
                        </div>
                        {!isRight && (
                          <p className="text-xs text-status-error mb-1 ml-5">
                            Sua resposta: {userOption?.text ?? "Não respondida"}
                          </p>
                        )}
                        <p className="text-xs text-status-success mb-2 ml-5">
                          Correta: {correctOption?.text}
                        </p>
                        <p className="text-xs text-content-secondary leading-relaxed ml-5 border-t border-white/10 pt-2 mt-1">
                          {q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="w-full flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-border-subtle bg-background-secondary text-sm font-medium text-content-secondary hover:text-content-primary hover:border-accent-primary/40 transition-all"
          >
            <RefreshCw size={14} />
            Refazer
          </button>

          <Link href="/aulas" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-border-subtle bg-background-secondary text-sm font-medium text-content-secondary hover:text-content-primary hover:border-accent-primary/40 transition-all">
              <ArrowLeft size={14} />
              Voltar às aulas
            </button>
          </Link>

          {nextQuizSlug ? (
            <Link href={`/quizzes/${nextQuizSlug}`} className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-accent-primary text-white text-sm font-semibold shadow-glow hover:bg-accent-primaryHover transition-all">
                Próximo quiz
                <ChevronRight size={14} />
              </button>
            </Link>
          ) : (
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-accent-primary text-white text-sm font-semibold shadow-glow hover:bg-accent-primaryHover transition-all"
            >
              <Share2 size={14} />
              Compartilhar
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import React, { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Play,
  HelpCircle,
  Clock,
  BarChart2,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import { QuizQuestion } from "@/components/quiz/QuizQuestion";
import { Badge, Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { loadQuizBySlug } from "@/lib/quizzes";
import { cn } from "@/lib/utils";
import type { Quiz } from "@/data/quizzes";

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

const difficultyColor: Record<string, string> = {
  Fácil: "text-status-success bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.4)]",
  Médio: "text-status-warning bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.4)]",
  Difícil: "text-status-error bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.4)]",
};

type Phase = "intro" | "quiz" | "result";

export default function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let active = true;

    const loadQuiz = async () => {
      setLoading(true);
      const loadedQuiz = await loadQuizBySlug(slug, user?.id);
      if (!active) return;
      setQuiz(loadedQuiz);
      setLoading(false);
    };

    void loadQuiz();

    return () => {
      active = false;
    };
  }, [slug, user?.id]);

  // Timer
  useEffect(() => {
    if (phase === "quiz") {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, startTime]);

  const startQuiz = () => {
    if (!quiz || quiz.questions.length === 0) return;
    setPhase("quiz");
    setCurrentQ(0);
    setSelectedId(null);
    setConfirmed(false);
    setAnswers([]);
    const now = Date.now();
    setStartTime(now);
    setElapsed(0);
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    setConfirmed(true);
    setAnswers((prev) => [...prev, selectedId]);
  };

  const handleNext = () => {
    if (!quiz || currentQ + 1 >= quiz.questions.length) {
      setPhase("result");
    } else {
      setCurrentQ((p) => p + 1);
      setSelectedId(null);
      setConfirmed(false);
    }
  };

  const handleRetry = () => {
    startQuiz();
  };

  const handleExit = () => {
    router.push("/quizzes");
  };

  if (!quiz) {
    if (loading) {
      return (
        <div className="min-h-screen bg-background-primary flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <HelpCircle size={36} className="text-content-disabled mx-auto mb-4" />
          <h1 className="text-xl font-bold text-content-primary mb-2">
            Quiz não encontrado
          </h1>
          <p className="text-sm text-content-secondary mb-5">
            Cadastre quizzes pelo painel admin para disponibilizar esta área.
          </p>
          <Button variant="primary" onClick={() => router.push("/quizzes")}>
            Voltar para quizzes
          </Button>
        </div>
      </div>
    );
  }

  // ── INTRO ───────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          {/* Thumbnail */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 shadow-card">
            <img
              src={quiz.thumbnailUrl}
              alt={quiz.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,15,0.85)] via-[rgba(10,10,15,0.3)] to-transparent" />

            {/* Centered icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-full bg-accent-primary/30 border-2 border-accent-primary flex items-center justify-center backdrop-blur-sm"
              >
                <HelpCircle size={32} className="text-white" />
              </motion.div>
            </div>

            {/* Gradient overlay with gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/20 to-transparent" />
          </div>

          {/* Content card */}
          <div className="bg-background-secondary rounded-2xl border border-border-subtle p-6 shadow-card">
            {/* Category + Difficulty */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={categoryVariant[quiz.category]}>
                {categoryLabel[quiz.category]}
              </Badge>
              <span className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full border",
                difficultyColor[quiz.difficulty]
              )}>
                {quiz.difficulty}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-content-primary mb-3 leading-snug">
              {quiz.title}
            </h1>

            {/* Description */}
            <p className="text-sm text-content-secondary leading-relaxed mb-6">
              {quiz.description}
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                {
                  icon: HelpCircle,
                  label: "Perguntas",
                  value: `${quiz.questions.length}`,
                  color: "text-accent-secondary",
                },
                {
                  icon: Clock,
                  label: "Tempo est.",
                  value: `~${quiz.estimatedMinutes} min`,
                  color: "text-status-warning",
                },
                {
                  icon: BarChart2,
                  label: "Dificuldade",
                  value: quiz.difficulty,
                  color:
                    quiz.difficulty === "Fácil"
                      ? "text-status-success"
                      : quiz.difficulty === "Médio"
                      ? "text-status-warning"
                      : "text-status-error",
                },
              ].map(({ icon: Icon, label, value, color }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-background-tertiary border border-border-subtle"
                >
                  <Icon size={16} className={color} />
                  <span className="text-base font-bold text-content-primary">{value}</span>
                  <span className="text-[10px] text-content-disabled text-center">{label}</span>
                </div>
              ))}
            </div>

            {/* Previous attempts */}
            {quiz.attempts !== undefined && quiz.attempts > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-background-tertiary border border-border-subtle mb-5">
                <BookOpen size={14} className="text-content-secondary shrink-0" />
                <p className="text-xs text-content-secondary">
                  Você já tentou este quiz{" "}
                  <span className="font-semibold text-content-primary">
                    {quiz.attempts}x
                  </span>
                  {quiz.score !== undefined && (
                    <>
                      {" "}— melhor pontuação:{" "}
                      <span className="font-semibold text-status-success">{quiz.score}%</span>
                    </>
                  )}
                </p>
              </div>
            )}

            {/* CTA */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<Play size={17} fill="white" />}
              onClick={startQuiz}
              disabled={quiz.questions.length === 0}
            >
              {quiz.questions.length === 0 ? "Quiz sem perguntas" : "Começar Quiz"}
            </Button>

            <button
              onClick={() => router.push("/quizzes")}
              className="w-full text-center mt-3 text-xs text-content-disabled hover:text-content-secondary transition-colors"
            >
              Voltar aos quizzes
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── RESULT — redirect to result page ───────────────────────
  if (phase === "result") {
    // Pass answers via sessionStorage for the result page
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        `quiz_result_${quiz.slug}`,
        JSON.stringify({ quizId: quiz.id, answers, elapsed })
      );
    }
    router.push(`/quizzes/${quiz.slug}/resultado`);
    return null;
  }

  // ── QUIZ ────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[50] bg-background-primary flex flex-col">
      {/* Progress bar header */}
      <QuizProgress
        current={currentQ + 1}
        total={quiz.questions.length}
        onExit={handleExit}
        quizTitle={quiz.title}
      />

      {/* Timer floating badge */}
      <div className="absolute top-20 right-4 lg:right-8 z-10">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-secondary border border-border-subtle shadow-card">
          <Clock size={12} className="text-content-secondary" />
          <span className="text-xs font-mono text-content-secondary tabular-nums">
            {Math.floor(elapsed / 60).toString().padStart(2, "0")}:
            {(elapsed % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-center py-8">
        <QuizQuestion
          question={quiz.questions[currentQ]}
          questionIndex={currentQ}
          selectedId={selectedId}
          confirmed={confirmed}
          onSelect={setSelectedId}
          onConfirm={handleConfirm}
          onNext={handleNext}
          isLast={currentQ === quiz.questions.length - 1}
        />
      </div>

      {/* Bottom action bar */}
      <div className="shrink-0 border-t border-border-subtle bg-background-secondary/80 backdrop-blur-sm px-4 lg:px-8 py-4">
        <div className="max-w-2xl mx-auto">
          {!confirmed ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleConfirm}
              disabled={!selectedId}
            >
              Confirmar resposta
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={<ChevronRight size={16} />}
              onClick={handleNext}
            >
              {currentQ + 1 >= quiz.questions.length
                ? "Ver resultado"
                : "Próxima pergunta"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

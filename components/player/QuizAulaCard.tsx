"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Trophy,
  X,
  ArrowRight,
} from "lucide-react";
import { Button, ProgressBar, Badge } from "@/components/ui";
import type { QuizAula } from "@/data/aulas";
import { cn } from "@/lib/utils";

interface QuizAulaCardProps {
  quiz: QuizAula;
}

const lessonQuestions = [
  {
    id: 1,
    question: "Quantos critérios do DSM-5 são necessários para o diagnóstico de Depressão Maior?",
    options: ["3 critérios por 1 semana", "5 critérios por 2 semanas", "7 critérios por 1 mês", "2 critérios por 6 meses"],
    correct: 1,
    explanation: "O DSM-5 exige 5 ou mais dos 9 sintomas por pelo menos 2 semanas, com pelo menos um sendo humor deprimido ou anedonia.",
  },
  {
    id: 2,
    question: "Qual neurotransmissor é o principal alvo dos antidepressivos ISRS?",
    options: ["Dopamina", "GABA", "Serotonina", "Acetilcolina"],
    correct: 2,
    explanation: "Os ISRS (Inibidores Seletivos da Recaptação de Serotonina) atuam inibindo a recaptação de serotonina na fenda sináptica.",
  },
  {
    id: 3,
    question: "Em quanto tempo os antidepressivos geralmente começam a apresentar efeito terapêutico?",
    options: ["24 a 48 horas", "3 a 5 dias", "2 a 4 semanas", "3 a 6 meses"],
    correct: 2,
    explanation: "A maioria dos antidepressivos leva de 2 a 4 semanas para apresentar efeito terapêutico completo, embora alguns efeitos parciais possam ocorrer antes.",
  },
];

export function QuizAulaCard({ quiz }: QuizAulaCardProps) {
  const [quizOpen, setQuizOpen] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  const q = lessonQuestions[currentQ];
  const score = Math.round((answers.filter(Boolean).length / lessonQuestions.length) * 100);

  const resetQuiz = () => {
    setCurrentQ(0);
    setSelected(null);
    setConfirmed(false);
    setAnswers([]);
    setFinished(false);
  };

  const openQuiz = () => {
    resetQuiz();
    setQuizOpen(true);
  };

  const confirm = () => {
    if (selected === null) return;
    setConfirmed(true);
    setAnswers((prev) => [...prev, selected === q.correct]);
  };

  const next = () => {
    if (currentQ + 1 >= lessonQuestions.length) {
      setFinished(true);
    } else {
      setCurrentQ((p) => p + 1);
      setSelected(null);
      setConfirmed(false);
    }
  };

  const optionStyle = (i: number) => {
    if (!confirmed) {
      return selected === i
        ? "border-accent-primary bg-accent-primary/15 text-content-primary"
        : "border-border-subtle bg-background-tertiary text-content-secondary hover:border-accent-primary/50 hover:text-content-primary";
    }
    if (i === q.correct) return "border-status-success bg-status-successBg text-status-success";
    if (i === selected && selected !== q.correct) return "border-status-error bg-status-errorBg text-status-error";
    return "border-border-subtle bg-background-tertiary text-content-disabled opacity-60";
  };

  return (
    <>
      {/* Card */}
      <div className="rounded-xl border border-accent-primary/40 bg-[rgba(124,58,237,0.06)] p-5 shadow-glow">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/20 flex items-center justify-center shrink-0">
            <HelpCircle size={18} className="text-accent-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-content-primary">{quiz.title}</h3>
            <p className="text-xs text-content-secondary mt-0.5">
              {quiz.questions} perguntas · Testa o conteúdo desta aula
            </p>
          </div>
        </div>

        {quiz.completed && quiz.score !== undefined ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 size={16} className="text-status-success shrink-0" />
              <div className="flex-1">
                <ProgressBar
                  value={quiz.score}
                  color={quiz.score >= 70 ? "success" : "warning"}
                  size="sm"
                  showPercentage
                  label={`Sua pontuação`}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RefreshCw size={13} />}
                onClick={openQuiz}
              >
                Refazer Quiz
              </Button>
              <Link href={`/quizzes/${quiz.slug}`}>
                <Button variant="secondary" size="sm" rightIcon={<ChevronRight size={13} />}>
                  Ver completo
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <Button
            variant="primary"
            size="md"
            fullWidth
            leftIcon={<HelpCircle size={15} />}
            onClick={openQuiz}
          >
            Começar Quiz da Aula
          </Button>
        )}
      </div>

      {/* Quiz modal fullscreen */}
      <AnimatePresence>
        {quizOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-background-primary flex flex-col"
          >
            {!finished ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
                  <div className="text-xs text-content-secondary font-medium">
                    {quiz.title}
                  </div>
                  {/* Progress bar central */}
                  <div className="flex-1 max-w-xs mx-6">
                    <ProgressBar
                      value={currentQ + 1}
                      max={lessonQuestions.length}
                      size="sm"
                      label={`Pergunta ${currentQ + 1} de ${lessonQuestions.length}`}
                    />
                  </div>
                  <button
                    onClick={() => setQuizOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-background-tertiary transition-colors"
                    aria-label="Sair do quiz"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Question */}
                <div className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQ}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.25 }}
                    >
                      {/* Question text */}
                      <h2 className="text-xl lg:text-2xl font-bold text-content-primary text-center mb-8 leading-snug">
                        {q.question}
                      </h2>

                      {/* Options */}
                      <div className="space-y-3">
                        {q.options.map((opt, i) => (
                          <motion.button
                            key={i}
                            whileHover={!confirmed ? { scale: 1.01 } : {}}
                            whileTap={!confirmed ? { scale: 0.99 } : {}}
                            onClick={() => !confirmed && setSelected(i)}
                            disabled={confirmed}
                            className={cn(
                              "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 font-medium text-sm",
                              optionStyle(i)
                            )}
                          >
                            <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center shrink-0 text-xs font-bold">
                              {["A", "B", "C", "D"][i]}
                            </span>
                            {opt}
                          </motion.button>
                        ))}
                      </div>

                      {/* Feedback box */}
                      <AnimatePresence>
                        {confirmed && (
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "mt-5 p-4 rounded-xl border",
                              selected === q.correct
                                ? "bg-status-successBg border-[rgba(34,197,94,0.4)]"
                                : "bg-status-errorBg border-[rgba(239,68,68,0.4)]"
                            )}
                          >
                            <p className={cn(
                              "text-sm font-bold mb-1",
                              selected === q.correct ? "text-status-success" : "text-status-error"
                            )}>
                              {selected === q.correct ? "✓ Correto!" : "✗ Ops, não foi dessa vez!"}
                            </p>
                            <p className="text-xs text-content-secondary leading-relaxed">
                              {q.explanation}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bottom action */}
                <div className="shrink-0 px-6 pb-6 pt-3 border-t border-border-subtle max-w-2xl mx-auto w-full">
                  {!confirmed ? (
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      onClick={confirm}
                      disabled={selected === null}
                    >
                      Confirmar resposta
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      rightIcon={<ArrowRight size={16} />}
                      onClick={next}
                    >
                      {currentQ + 1 >= lessonQuestions.length ? "Ver resultado" : "Próxima pergunta"}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              /* Result screen */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center px-6 text-center"
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mb-6"
                >
                  {score === 100 ? (
                    <Trophy size={64} className="text-yellow-400" />
                  ) : score >= 70 ? (
                    <CheckCircle2 size={64} className="text-status-success" />
                  ) : (
                    <HelpCircle size={64} className="text-accent-secondary" />
                  )}
                </motion.div>

                <h2 className="text-3xl font-bold text-content-primary mb-2">
                  {score === 100
                    ? "Perfeito!"
                    : score >= 70
                    ? "Muito bem!"
                    : "Continue estudando!"}
                </h2>

                <div className="text-6xl font-bold text-gradient-purple my-4">
                  {score}%
                </div>

                <p className="text-content-secondary text-sm mb-2">
                  {answers.filter(Boolean).length} de {lessonQuestions.length} corretas
                </p>

                <div className="w-full max-w-xs mb-8">
                  <ProgressBar
                    value={score}
                    color={score >= 70 ? "success" : score >= 40 ? "warning" : "error"}
                    size="lg"
                    animated
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="ghost" size="md" leftIcon={<RefreshCw size={15} />} onClick={resetQuiz}>
                    Refazer quiz
                  </Button>
                  <Button variant="secondary" size="md" onClick={() => setQuizOpen(false)}>
                    Voltar à aula
                  </Button>
                  <Link href={`/quizzes/${quiz.slug}`}>
                    <Button variant="primary" size="md" rightIcon={<ChevronRight size={15} />}>
                      Ver próximo Quiz
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

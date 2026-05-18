"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuizResult } from "@/components/quiz/QuizResult";
import { useAuth } from "@/hooks/useAuth";
import { loadQuizBySlug, saveQuizAttempt } from "@/lib/quizzes";
import type { Quiz } from "@/data/quizzes";

export default function QuizResultPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const loadResult = async () => {
      const stored = sessionStorage.getItem(`quiz_result_${slug}`);
      if (!stored) {
        router.replace(`/quizzes/${slug}`);
        return;
      }

      const parsed = JSON.parse(stored);
      const loadedQuiz = await loadQuizBySlug(slug, user?.id);
      if (!active) return;

      if (!loadedQuiz) {
        setQuiz(null);
        setReady(true);
        return;
      }

      const parsedAnswers = parsed.answers ?? [];
      const parsedElapsed = parsed.elapsed ?? 0;
      const correctCount = parsedAnswers.filter(
        (answer: string, index: number) => answer === loadedQuiz.questions[index]?.correctId
      ).length;
      const score =
        loadedQuiz.questions.length > 0
          ? Math.round((correctCount / loadedQuiz.questions.length) * 100)
          : 0;

      if (user?.id && !parsed.saved) {
        const { error } = await saveQuizAttempt({
          quizId: loadedQuiz.id,
          userId: user.id,
          score,
          answers: parsedAnswers,
          elapsedSeconds: parsedElapsed,
        });

        if (!error) {
          sessionStorage.setItem(
            `quiz_result_${slug}`,
            JSON.stringify({ ...parsed, saved: true })
          );
        }
      }

      setQuiz(loadedQuiz);
      setAnswers(parsedAnswers);
      setElapsed(parsedElapsed);
      setReady(true);
    };

    void loadResult();

    return () => {
      active = false;
    };
  }, [slug, router, user?.id]);

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-lg font-bold text-content-primary mb-2">
            Resultado indisponível
          </p>
          <p className="text-sm text-content-secondary">
            Este quiz ainda não existe no banco de dados.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleRetry = () => {
    sessionStorage.removeItem(`quiz_result_${slug}`);
    router.push(`/quizzes/${slug}`);
  };

  return (
    <QuizResult
      quizTitle={quiz.title}
      quizSlug={quiz.slug}
      questions={quiz.questions}
      answers={answers}
      totalTimeSeconds={elapsed}
      onRetry={handleRetry}
    />
  );
}

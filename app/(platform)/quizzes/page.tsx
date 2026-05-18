"use client";

import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, X, HelpCircle, CheckCircle2, Clock } from "lucide-react";
import { QuizCard } from "@/components/quiz/QuizCard";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { EMPTY_IMAGE, getSignedStorageUrl } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import type { Quiz } from "@/data/quizzes";
import type { Database } from "@/types/database";

type StatusFilter = "todos" | "nao_iniciado" | "em_progresso" | "concluido";
type CategoryFilter = "todos" | "doencas" | "transtornos" | "curiosidades";
type DifficultyFilter = "todos" | "Fácil" | "Médio" | "Difícil";
type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type QuestionRow = Database["public"]["Tables"]["quiz_questions"]["Row"];
type AttemptRow = Database["public"]["Tables"]["quiz_attempts"]["Row"];

const statusTabs: { key: StatusFilter; label: string; icon: React.ElementType }[] = [
  { key: "todos", label: "Todos", icon: HelpCircle },
  { key: "nao_iniciado", label: "Não iniciados", icon: HelpCircle },
  { key: "em_progresso", label: "Em progresso", icon: Clock },
  { key: "concluido", label: "Concluídos", icon: CheckCircle2 },
];

const categoryOptions: { key: CategoryFilter; label: string }[] = [
  { key: "todos", label: "Todas categorias" },
  { key: "doencas", label: "Doenças" },
  { key: "transtornos", label: "Transtornos" },
  { key: "curiosidades", label: "Curiosidades" },
];

const diffOptions: { key: DifficultyFilter; label: string }[] = [
  { key: "todos", label: "Qualquer nível" },
  { key: "Fácil", label: "Fácil" },
  { key: "Médio", label: "Médio" },
  { key: "Difícil", label: "Difícil" },
];

export default function QuizzesPage() {
  const supabase = createSupabaseBrowserClient();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("todos");
  const [diffFilter, setDiffFilter] = useState<DifficultyFilter>("todos");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadQuizzes = async () => {
      setLoading(true);

      const [quizzesResponse, questionsResponse, attemptsResponse] = await Promise.all([
        supabase
          .from("quizzes")
          .select(
            "id,content_id,slug,title,description,category,status,access,difficulty,estimated_minutes,thumbnail_path,created_by,published_at,created_at,updated_at"
          )
          .eq("status", "published")
          .order("published_at", { ascending: false }),
        supabase
          .from("quiz_questions")
          .select("id,quiz_id,question,explanation,sort_order,created_at"),
        user
          ? supabase
              .from("quiz_attempts")
              .select("id,quiz_id,user_id,score,answers,elapsed_seconds,created_at")
              .eq("user_id", user.id)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (!active) return;
      if (quizzesResponse.error || questionsResponse.error || attemptsResponse.error) {
        setQuizzes([]);
        setLoading(false);
        return;
      }

      const questionCountByQuiz = new Map<string, number>();
      (questionsResponse.data as QuestionRow[]).forEach((question) => {
        questionCountByQuiz.set(
          question.quiz_id,
          (questionCountByQuiz.get(question.quiz_id) ?? 0) + 1
        );
      });

      const attemptsByQuiz = new Map<string, AttemptRow[]>();
      (attemptsResponse.data as AttemptRow[]).forEach((attempt) => {
        const current = attemptsByQuiz.get(attempt.quiz_id) ?? [];
        current.push(attempt);
        attemptsByQuiz.set(attempt.quiz_id, current);
      });

      const mapped = await Promise.all(
        ((quizzesResponse.data ?? []) as QuizRow[]).map(async (quiz) => {
          const attempts = attemptsByQuiz.get(quiz.id) ?? [];
          const bestScore =
            attempts.length > 0 ? Math.max(...attempts.map((attempt) => attempt.score)) : undefined;

          return {
            id: quiz.id,
            slug: quiz.slug,
            title: quiz.title,
            description: quiz.description,
            thumbnailUrl:
              (await getSignedStorageUrl("content-media", quiz.thumbnail_path)) ?? EMPTY_IMAGE,
            category: quiz.category,
            difficulty: quiz.difficulty as Quiz["difficulty"],
            questions: Array.from({ length: questionCountByQuiz.get(quiz.id) ?? 0 }).map(
              (_, index) => ({
                id: `${quiz.id}-${index}`,
                question: "",
                options: [],
                correctId: "",
                explanation: "",
              })
            ),
            estimatedMinutes: quiz.estimated_minutes,
            status: attempts.length > 0 ? "concluido" : "nao_iniciado",
            score: bestScore,
            attempts: attempts.length,
          } satisfies Quiz;
        })
      );

      setQuizzes(mapped);
      setLoading(false);
    };

    void loadQuizzes();

    return () => {
      active = false;
    };
  }, [supabase, user]);

  const filtered = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return quizzes.filter((quiz) => {
      const matchSearch =
        !normalizedSearch ||
        quiz.title.toLowerCase().includes(normalizedSearch) ||
        quiz.description.toLowerCase().includes(normalizedSearch);
      const matchStatus = statusFilter === "todos" || quiz.status === statusFilter;
      const matchCategory = categoryFilter === "todos" || quiz.category === categoryFilter;
      const matchDifficulty = diffFilter === "todos" || quiz.difficulty === diffFilter;
      return matchSearch && matchStatus && matchCategory && matchDifficulty;
    });
  }, [quizzes, deferredSearch, statusFilter, categoryFilter, diffFilter]);

  const counts = {
    total: quizzes.length,
    done: quizzes.filter((quiz) => quiz.status === "concluido").length,
    available: quizzes.filter((quiz) => quiz.status === "nao_iniciado").length,
  };

  const hasFilters =
    search ||
    statusFilter !== "todos" ||
    categoryFilter !== "todos" ||
    diffFilter !== "todos";

  const clearAll = () => {
    setSearch("");
    setStatusFilter("todos");
    setCategoryFilter("todos");
    setDiffFilter("todos");
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-content-primary mb-1">Quizzes</h1>
        <p className="text-sm text-content-secondary">
          Teste seus conhecimentos e ganhe XP a cada quiz concluído
        </p>

        <div className="flex flex-wrap gap-3 mt-4">
          {[
            {
              label: "Disponíveis",
              value: counts.available,
              color: "text-accent-secondary",
              bg: "bg-[rgba(124,58,237,0.08)] border-[rgba(124,58,237,0.2)]",
            },
            {
              label: "Concluídos",
              value: counts.done,
              color: "text-status-success",
              bg: "bg-status-successBg border-[rgba(34,197,94,0.2)]",
            },
            {
              label: "Total",
              value: counts.total,
              color: "text-content-primary",
              bg: "bg-background-secondary border-border-subtle",
            },
          ].map(({ label, value, color, bg }) => (
            <div
              key={label}
              className={cn("flex items-center gap-2.5 px-4 py-2.5 rounded-xl border", bg)}
            >
              <span className={cn("text-2xl font-bold tabular-nums", color)}>{value}</span>
              <span className="text-xs text-content-secondary">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
        {statusTabs.map((tab) => {
          const Icon = tab.icon;
          const count =
            tab.key === "todos"
              ? quizzes.length
              : quizzes.filter((quiz) => quiz.status === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-all duration-200",
                statusFilter === tab.key
                  ? "bg-accent-primary text-white border-accent-primary shadow-glow"
                  : "bg-background-secondary border-border-subtle text-content-secondary hover:border-accent-primary/40"
              )}
            >
              <Icon size={14} />
              {tab.label}
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-bold",
                  statusFilter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-background-tertiary text-content-disabled"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar quizzes…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leftIcon={<Search size={16} />}
            rightIcon={
              search ? (
                <button onClick={() => setSearch("")} aria-label="Limpar busca">
                  <X size={15} />
                </button>
              ) : null
            }
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {categoryOptions.map((category) => (
            <button
              key={category.key}
              onClick={() => setCategoryFilter(category.key)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 whitespace-nowrap",
                categoryFilter === category.key
                  ? "bg-accent-primary/15 border-accent-primary/50 text-accent-secondary"
                  : "bg-background-secondary border-border-subtle text-content-secondary hover:border-accent-primary/30"
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {diffOptions.map((difficulty) => {
            const colorMap: Record<string, string> = {
              Fácil:
                diffFilter === difficulty.key
                  ? "bg-[rgba(34,197,94,0.2)] border-[rgba(34,197,94,0.5)] text-status-success"
                  : "",
              Médio:
                diffFilter === difficulty.key
                  ? "bg-[rgba(245,158,11,0.2)] border-[rgba(245,158,11,0.5)] text-status-warning"
                  : "",
              Difícil:
                diffFilter === difficulty.key
                  ? "bg-[rgba(239,68,68,0.2)] border-[rgba(239,68,68,0.5)] text-status-error"
                  : "",
            };

            return (
              <button
                key={difficulty.key}
                onClick={() => setDiffFilter(difficulty.key)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 whitespace-nowrap",
                  diffFilter === difficulty.key && difficulty.key !== "todos"
                    ? colorMap[difficulty.key]
                    : diffFilter === difficulty.key
                    ? "bg-accent-primary/15 border-accent-primary/50 text-accent-secondary"
                    : "bg-background-secondary border-border-subtle text-content-secondary hover:border-accent-primary/30"
                )}
              >
                {difficulty.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-content-secondary">Carregando quizzes...</div>
      ) : hasFilters ? (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-content-secondary">
            <span className="text-content-primary font-semibold">{filtered.length}</span> quiz
            {filtered.length !== 1 ? "zes" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-accent-secondary hover:text-accent-primary transition-colors"
          >
            <X size={12} />
            Limpar filtros
          </button>
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((quiz, index) => (
            <motion.div
              key={quiz.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.3 }}
            >
              <QuizCard quiz={quiz} />
            </motion.div>
          ))}
        </motion.div>
      ) : !loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-background-tertiary border border-border-subtle flex items-center justify-center mb-4">
            <HelpCircle size={24} className="text-content-disabled" />
          </div>
          <h3 className="text-lg font-semibold text-content-primary mb-2">Nenhum quiz encontrado</h3>
          <p className="text-sm text-content-secondary max-w-xs">
            Tente outros termos ou remova os filtros.
          </p>
          <button
            onClick={clearAll}
            className="mt-4 text-sm text-accent-secondary hover:text-accent-primary transition-colors"
          >
            Limpar filtros
          </button>
        </motion.div>
      ) : null}
    </div>
  );
}

"use client";

import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, BarChart2, HelpCircle, Search, X } from "lucide-react";
import { Badge, Button, ProgressBar, Input, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type QuestionRow = Database["public"]["Tables"]["quiz_questions"]["Row"];
type OptionRow = Database["public"]["Tables"]["quiz_options"]["Row"];
type AttemptRow = Database["public"]["Tables"]["quiz_attempts"]["Row"];
type ContentRow = Database["public"]["Tables"]["content_items"]["Row"];

interface AdminQuizRow {
  id: string;
  slug: string;
  contentId: string | null;
  title: string;
  description: string;
  category: "doencas" | "transtornos" | "curiosidades";
  difficulty: "Fácil" | "Médio" | "Difícil";
  access: "free" | "subscriber";
  questions: number;
  attempts: number;
  avgScore: number;
  status: "publicado" | "rascunho";
}

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

const diffColor: Record<string, string> = {
  Fácil: "text-status-success",
  Médio: "text-status-warning",
  Difícil: "text-status-error",
};

type QuizFormQuestion = {
  id?: string;
  question: string;
  explanation: string;
  options: string[];
  correctIndex: number;
};

const emptyQuestion = (): QuizFormQuestion => ({
  question: "",
  explanation: "",
  options: ["", "", "", ""],
  correctIndex: 0,
});

const createSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

function QuizFormModal({
  quiz,
  onClose,
  onSaved,
}: {
  quiz: AdminQuizRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createSupabaseBrowserClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(Boolean(quiz));
  const [title, setTitle] = useState(quiz?.title ?? "");
  const [description, setDescription] = useState(quiz?.description ?? "");
  const [category, setCategory] = useState<"doencas" | "transtornos" | "curiosidades">(quiz?.category ?? "doencas");
  const [difficulty, setDifficulty] = useState<"Fácil" | "Médio" | "Difícil">(quiz?.difficulty ?? "Médio");
  const [status, setStatus] = useState<"publicado" | "rascunho">(quiz?.status ?? "rascunho");
  const [access, setAccess] = useState<"free" | "subscriber">(quiz?.access ?? "subscriber");
  const [contentId, setContentId] = useState(quiz?.contentId ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(5);
  const [questions, setQuestions] = useState<QuizFormQuestion[]>([emptyQuestion()]);
  const [lessonSearch, setLessonSearch] = useState("");
  const deferredLessonSearch = useDeferredValue(lessonSearch);
  const [lessonResults, setLessonResults] = useState<
    Array<{ id: string; title: string; category: "doencas" | "transtornos" | "curiosidades" }>
  >([]);
  const [selectedLesson, setSelectedLesson] = useState<{
    id: string;
    title: string;
    category: "doencas" | "transtornos" | "curiosidades";
  } | null>(null);
  const [lessonPickerOpen, setLessonPickerOpen] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);

  useEffect(() => {
    let active = true;

    const loadQuestions = async () => {
      if (!quiz) {
        setLoadingQuestions(false);
        return;
      }

      const questionsResponse = await supabase
        .from("quiz_questions")
        .select("id,quiz_id,question,explanation,sort_order,created_at")
        .eq("quiz_id", quiz.id)
        .order("sort_order", { ascending: true });

      if (!active) return;
      if (questionsResponse.error) {
        setLoadingQuestions(false);
        return;
      }

      const questionRows = (questionsResponse.data ?? []) as QuestionRow[];
      const optionsResponse =
        questionRows.length > 0
          ? await supabase
              .from("quiz_options")
              .select("id,question_id,text,is_correct,sort_order,created_at")
              .in(
                "question_id",
                questionRows.map((question) => question.id)
              )
              .order("sort_order", { ascending: true })
          : { data: [], error: null };

      if (!active) return;
      if (optionsResponse.error) {
        setLoadingQuestions(false);
        return;
      }

      const optionsByQuestion = new Map<string, OptionRow[]>();
      ((optionsResponse.data ?? []) as OptionRow[]).forEach((option) => {
        const current = optionsByQuestion.get(option.question_id) ?? [];
        current.push(option);
        optionsByQuestion.set(option.question_id, current);
      });

      setQuestions(
        questionRows.length > 0
          ? questionRows.map((question) => {
              const options = optionsByQuestion.get(question.id) ?? [];
              const normalizedOptions = [...options.map((option) => option.text), "", "", "", ""].slice(0, 4);
              const correctIndex = Math.max(0, options.findIndex((option) => option.is_correct));
              return {
                id: question.id,
                question: question.question,
                explanation: question.explanation,
                options: normalizedOptions,
                correctIndex,
              };
            })
          : [emptyQuestion()]
      );
      setLoadingQuestions(false);
    };

    void loadQuestions();

    return () => {
      active = false;
    };
  }, [quiz, supabase]);

  useEffect(() => {
    let active = true;

    const loadLessons = async () => {
      setLoadingLessons(true);
      const searchTerm = deferredLessonSearch.trim();
      let query = supabase
        .from("content_items")
        .select("id,title,category")
        .eq("type", "lesson")
        .order("created_at", { ascending: false })
        .limit(12);

      if (searchTerm.length >= 2) {
        query = query.ilike("title", `%${searchTerm}%`);
      }

      const lessonsResponse = await query;
      const selectedResponse =
        contentId
          ? await supabase
              .from("content_items")
              .select("id,title,category")
              .eq("id", contentId)
              .maybeSingle()
          : { data: null, error: null };

      if (!active) return;

      if (lessonsResponse.error || selectedResponse.error) {
        setLessonResults([]);
        setLoadingLessons(false);
        return;
      }

      const results = ((lessonsResponse.data ?? []) as Pick<ContentRow, "id" | "title" | "category">[]).map(
        (lesson) => ({
          id: lesson.id,
          title: lesson.title,
          category: lesson.category,
        })
      );
      const selected = selectedResponse.data as Pick<ContentRow, "id" | "title" | "category"> | null;
      const merged =
        selected && !results.some((lesson) => lesson.id === selected.id)
          ? [{ id: selected.id, title: selected.title, category: selected.category }, ...results]
          : results;

      setLessonResults(merged);
      setSelectedLesson(merged.find((lesson) => lesson.id === contentId) ?? null);
      setLoadingLessons(false);
    };

    void loadLessons();

    return () => {
      active = false;
    };
  }, [contentId, deferredLessonSearch, supabase]);

  const setQuestionField = (index: number, patch: Partial<QuizFormQuestion>) => {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question
      )
    );
  };

  const setOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((current) =>
      current.map((question, index) => {
        if (index !== questionIndex) return question;
        const options = question.options.slice();
        options[optionIndex] = value;
        return { ...question, options };
      })
    );
  };

  const validate = () => {
    if (!title.trim()) return "Informe o título do quiz.";
    if (questions.length === 0) return "Adicione pelo menos uma pergunta.";
    const invalidQuestion = questions.find(
      (question) =>
        !question.question.trim() ||
        question.options.filter((option) => option.trim()).length < 2 ||
        !question.options[question.correctIndex]?.trim()
    );
    if (invalidQuestion) return "Cada pergunta precisa de texto, pelo menos 2 opções e uma alternativa correta.";
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      toast({ variant: "error", title: "Revise o quiz", message: validationError });
      return;
    }

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const quizPayload = {
      slug: quiz?.slug ?? `${createSlug(title) || "quiz"}-${Date.now().toString().slice(-5)}`,
      title: title.trim(),
      description: description.trim() || title.trim(),
      category,
      difficulty,
      access,
      content_id: contentId || null,
      estimated_minutes: Math.max(1, estimatedMinutes),
      status: (status === "publicado" ? "published" : "draft") as Database["public"]["Enums"]["content_status"],
      published_at: status === "publicado" ? new Date().toISOString() : null,
      created_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    };

    const quizResult = quiz
      ? await supabase.from("quizzes").update(quizPayload).eq("id", quiz.id).select("id").single()
      : await supabase.from("quizzes").insert(quizPayload).select("id").single();

    if (quizResult.error || !quizResult.data) {
      setLoading(false);
      toast({ variant: "error", title: "Não foi possível salvar", message: quizResult.error?.message });
      return;
    }

    const quizId = quizResult.data.id;
    if (quiz) {
      await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
    }

    for (const [index, question] of questions.entries()) {
      const questionResult = await supabase
        .from("quiz_questions")
        .insert({
          quiz_id: quizId,
          question: question.question.trim(),
          explanation: question.explanation.trim(),
          sort_order: index,
        })
        .select("id")
        .single();

      if (questionResult.error || !questionResult.data) {
        setLoading(false);
        toast({ variant: "error", title: "Erro ao salvar pergunta", message: questionResult.error?.message });
        return;
      }

      const optionsPayload = question.options
        .map((option, optionIndex) => ({
          question_id: questionResult.data.id,
          text: option.trim(),
          is_correct: optionIndex === question.correctIndex,
          sort_order: optionIndex,
        }))
        .filter((option) => option.text);

      const optionsResult = await supabase.from("quiz_options").insert(optionsPayload);
      if (optionsResult.error) {
        setLoading(false);
        toast({ variant: "error", title: "Erro ao salvar alternativas", message: optionsResult.error.message });
        return;
      }
    }

    setLoading(false);
    toast({ variant: "success", title: quiz ? "Quiz atualizado" : "Quiz criado" });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border-subtle bg-background-secondary shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-background-secondary px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-content-primary">{quiz ? "Editar quiz" : "Novo quiz"}</h2>
            <p className="text-xs text-content-secondary">Vincule a uma aula e cadastre perguntas com alternativas.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-content-secondary hover:bg-background-tertiary">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Título" value={title} onChange={(event) => setTitle(event.target.value)} />
            <div className="relative space-y-1.5">
              <label className="text-xs font-semibold text-content-secondary uppercase">Aula vinculada</label>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-disabled" />
                <input
                  value={lessonSearch}
                  onFocus={() => setLessonPickerOpen(true)}
                  onChange={(event) => {
                    setLessonSearch(event.target.value);
                    setLessonPickerOpen(true);
                  }}
                  placeholder={selectedLesson ? "Buscar outra aula..." : "Buscar aula por título..."}
                  className="h-11 w-full rounded-xl border border-border-subtle bg-background-tertiary pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent-primary"
                />
              </div>

              {selectedLesson ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-accent-primary/25 bg-accent-primary/10 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-content-primary">{selectedLesson.title}</p>
                    <p className="text-[10px] text-content-disabled">{categoryLabel[selectedLesson.category]}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setContentId("");
                      setSelectedLesson(null);
                      setLessonSearch("");
                    }}
                    className="shrink-0 rounded-lg p-1 text-content-disabled hover:bg-background-tertiary hover:text-content-primary"
                    aria-label="Remover aula vinculada"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-content-disabled">Opcional. Busque e selecione uma aula específica.</p>
              )}

              {lessonPickerOpen && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-border-subtle bg-background-secondary shadow-2xl">
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setContentId("");
                      setSelectedLesson(null);
                      setLessonSearch("");
                      setLessonPickerOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-content-secondary hover:bg-background-tertiary"
                  >
                    Sem aula vinculada
                  </button>
                  <div className="max-h-64 overflow-y-auto border-t border-border-subtle">
                    {loadingLessons ? (
                      <div className="px-3 py-4 text-center text-xs text-content-secondary">Buscando aulas...</div>
                    ) : lessonResults.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-content-secondary">Nenhuma aula encontrada.</div>
                    ) : (
                      lessonResults.map((lesson) => (
                        <button
                          type="button"
                          key={lesson.id}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setContentId(lesson.id);
                            setSelectedLesson(lesson);
                            setCategory(lesson.category);
                            setLessonSearch("");
                            setLessonPickerOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-start justify-between gap-3 px-3 py-2 text-left hover:bg-background-tertiary",
                            contentId === lesson.id && "bg-accent-primary/10"
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold text-content-primary">{lesson.title}</span>
                            <span className="text-[10px] text-content-disabled">{categoryLabel[lesson.category]}</span>
                          </span>
                          {contentId === lesson.id && <span className="text-[10px] font-bold text-accent-secondary">Selecionada</span>}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descrição do quiz"
            rows={3}
            className="w-full rounded-xl border border-border-subtle bg-background-tertiary p-3 text-sm outline-none focus:border-accent-primary"
          />

          <div className="grid gap-3 md:grid-cols-4">
            <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="h-11 rounded-xl border border-border-subtle bg-background-tertiary px-3 text-sm">
              <option value="doencas">Doenças</option>
              <option value="transtornos">Transtornos</option>
              <option value="curiosidades">Curiosidades</option>
            </select>
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)} className="h-11 rounded-xl border border-border-subtle bg-background-tertiary px-3 text-sm">
              <option value="Fácil">Fácil</option>
              <option value="Médio">Médio</option>
              <option value="Difícil">Difícil</option>
            </select>
            <select value={access} onChange={(event) => setAccess(event.target.value as typeof access)} className="h-11 rounded-xl border border-border-subtle bg-background-tertiary px-3 text-sm">
              <option value="free">Grátis</option>
              <option value="subscriber">Assinantes</option>
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-11 rounded-xl border border-border-subtle bg-background-tertiary px-3 text-sm">
              <option value="rascunho">Rascunho</option>
              <option value="publicado">Publicado</option>
            </select>
          </div>

          <Input label="Tempo estimado em minutos" type="number" min={1} value={estimatedMinutes} onChange={(event) => setEstimatedMinutes(Number(event.target.value))} />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-content-primary">Perguntas</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setQuestions((current) => [...current, emptyQuestion()])}>
                Adicionar pergunta
              </Button>
            </div>

            {loadingQuestions ? (
              <div className="rounded-xl border border-border-subtle bg-background-tertiary p-4 text-sm text-content-secondary">Carregando perguntas...</div>
            ) : questions.map((question, questionIndex) => (
              <div key={questionIndex} className="rounded-2xl border border-border-subtle bg-background-tertiary p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase text-content-secondary">Pergunta {questionIndex + 1}</p>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => setQuestions((current) => current.filter((_, index) => index !== questionIndex))} className="text-xs text-status-error">
                      Remover
                    </button>
                  )}
                </div>
                <textarea value={question.question} onChange={(event) => setQuestionField(questionIndex, { question: event.target.value })} placeholder="Enunciado" rows={2} className="mb-3 w-full rounded-xl border border-border-subtle bg-background-secondary p-3 text-sm outline-none focus:border-accent-primary" />
                <div className="grid gap-2 md:grid-cols-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-center gap-2 rounded-xl border border-border-subtle bg-background-secondary px-3 py-2">
                      <input type="radio" checked={question.correctIndex === optionIndex} onChange={() => setQuestionField(questionIndex, { correctIndex: optionIndex })} />
                      <input value={option} onChange={(event) => setOption(questionIndex, optionIndex, event.target.value)} placeholder={`Alternativa ${optionIndex + 1}`} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                    </label>
                  ))}
                </div>
                <textarea value={question.explanation} onChange={(event) => setQuestionField(questionIndex, { explanation: event.target.value })} placeholder="Explicação exibida após responder" rows={2} className="mt-3 w-full rounded-xl border border-border-subtle bg-background-secondary p-3 text-sm outline-none focus:border-accent-primary" />
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border-subtle bg-background-secondary px-5 py-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={loading} disabled={loading}>Salvar quiz</Button>
        </div>
      </form>
    </div>
  );
}

export default function AdminQuizzesPage() {
  const supabase = createSupabaseBrowserClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<"todos" | "publicado" | "rascunho">("todos");
  const [quizzes, setQuizzes] = useState<AdminQuizRow[]>([]);
  const [modalQuiz, setModalQuiz] = useState<AdminQuizRow | null | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
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
          .order("created_at", { ascending: false }),
        supabase.from("quiz_questions").select("id,quiz_id,question,explanation,sort_order,created_at"),
        supabase.from("quiz_attempts").select("id,quiz_id,user_id,score,answers,elapsed_seconds,created_at"),
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

      const mapped = ((quizzesResponse.data ?? []) as QuizRow[]).map((quiz) => {
        const attempts = attemptsByQuiz.get(quiz.id) ?? [];
        const avgScore =
          attempts.length > 0
            ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
            : 0;

        return {
          id: quiz.id,
          slug: quiz.slug,
          contentId: quiz.content_id,
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          difficulty: quiz.difficulty as AdminQuizRow["difficulty"],
          access: quiz.access,
          questions: questionCountByQuiz.get(quiz.id) ?? 0,
          attempts: attempts.length,
          avgScore,
          status: quiz.status === "published" ? "publicado" : "rascunho",
        } satisfies AdminQuizRow;
      });

      setQuizzes(mapped);
      setLoading(false);
    };

    void loadQuizzes();

    return () => {
      active = false;
    };
  }, [supabase, refreshKey]);

  const handleDelete = async (quiz: AdminQuizRow) => {
    const confirmed = window.confirm(`Excluir o quiz "${quiz.title}"?`);
    if (!confirmed) return;

    const { error } = await supabase.from("quizzes").delete().eq("id", quiz.id);
    if (error) {
      toast({ variant: "error", title: "Não foi possível excluir", message: error.message });
      return;
    }

    toast({ variant: "success", title: "Quiz excluído" });
    setRefreshKey((current) => current + 1);
  };

  const filtered = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    return quizzes.filter((quiz) => {
      const matchSearch = !normalizedSearch || quiz.title.toLowerCase().includes(normalizedSearch);
      const matchStatus = statusFilter === "todos" || quiz.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [quizzes, deferredSearch, statusFilter]);

  return (
    <div className="px-5 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-content-primary mb-1">Quizzes</h1>
          <p className="text-sm text-content-secondary">
            {quizzes.length} quizzes criados · {quizzes.reduce((sum, quiz) => sum + quiz.attempts, 0).toLocaleString("pt-BR")} tentativas totais
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => setModalQuiz(null)}
        >
          Novo quiz
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar quiz por título..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leftIcon={<Search size={15} />}
            rightIcon={search ? <button onClick={() => setSearch("")}><X size={14} /></button> : null}
          />
        </div>
        <div className="flex gap-2">
          {(["todos", "publicado", "rascunho"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200",
                statusFilter === status
                  ? "bg-accent-primary text-white border-accent-primary shadow-glow"
                  : "bg-background-secondary border-border-subtle text-content-secondary hover:border-accent-primary/40"
              )}
            >
              {status === "todos" ? "Todos" : status === "publicado" ? "Publicados" : "Rascunhos"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-14 text-center text-sm text-content-secondary">Carregando quizzes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((quiz, index) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              className="bg-background-secondary rounded-2xl border border-border-subtle p-5 hover:border-accent-primary/30 hover:shadow-glow transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={categoryVariant[quiz.category]} size="sm">
                    {categoryLabel[quiz.category]}
                  </Badge>
                  <span className={cn("text-xs font-semibold", diffColor[quiz.difficulty])}>
                    {quiz.difficulty}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    quiz.status === "publicado"
                      ? "bg-status-successBg text-status-success"
                      : "bg-background-tertiary text-content-disabled"
                  )}
                >
                  {quiz.status === "publicado" ? "Publicado" : "Rascunho"}
                </span>
              </div>

              <h3 className="text-sm font-bold text-content-primary mb-4 leading-snug line-clamp-2">
                {quiz.title}
              </h3>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Perguntas", value: quiz.questions, icon: HelpCircle },
                  { label: "Tentativas", value: quiz.attempts.toLocaleString("pt-BR"), icon: BarChart2 },
                  { label: "Média", value: quiz.attempts > 0 ? `${quiz.avgScore}%` : "—", icon: BarChart2 },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex flex-col items-center p-2 rounded-xl bg-background-tertiary">
                    <Icon size={12} className="text-content-disabled mb-1" />
                    <span className="text-sm font-bold text-content-primary">{value}</span>
                    <span className="text-[9px] text-content-disabled">{label}</span>
                  </div>
                ))}
              </div>

              {quiz.attempts > 0 && (
                <div className="mb-4">
                  <ProgressBar
                    value={quiz.avgScore}
                    size="sm"
                    color={quiz.avgScore >= 70 ? "success" : "warning"}
                    label="Média de acerto"
                    showPercentage
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-border-subtle">
                <button
                  onClick={() => setModalQuiz(quiz)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent-secondary bg-accent-primary/10 hover:bg-accent-primary/20 transition-colors"
                >
                  <Edit2 size={11} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(quiz)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-status-error bg-status-errorBg hover:opacity-80 transition-opacity ml-auto"
                >
                  <Trash2 size={11} />
                  Excluir
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-content-secondary">Nenhum quiz encontrado.</div>
      )}

      {modalQuiz !== undefined && (
        <QuizFormModal
          quiz={modalQuiz}
          onClose={() => setModalQuiz(undefined)}
          onSaved={() => {
            setModalQuiz(undefined);
            setRefreshKey((current) => current + 1);
          }}
        />
      )}
    </div>
  );
}

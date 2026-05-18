import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { EMPTY_IMAGE, getSignedStorageUrl } from "@/lib/storage";
import type { Quiz, QuizQuestion } from "@/data/quizzes";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type QuestionRow = Database["public"]["Tables"]["quiz_questions"]["Row"];
type OptionRow = Database["public"]["Tables"]["quiz_options"]["Row"];
type AttemptRow = Database["public"]["Tables"]["quiz_attempts"]["Row"];

export async function loadQuizBySlug(slug: string, userId?: string | null): Promise<Quiz | null> {
  const supabase = createSupabaseBrowserClient();

  const quizResponse = await supabase
    .from("quizzes")
    .select(
      "id,content_id,slug,title,description,category,status,access,difficulty,estimated_minutes,thumbnail_path,created_by,published_at,created_at,updated_at"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (quizResponse.error || !quizResponse.data) return null;

  const quiz = quizResponse.data as QuizRow;
  const [questionsResponse, attemptsResponse] = await Promise.all([
    supabase
      .from("quiz_questions")
      .select("id,quiz_id,question,explanation,sort_order,created_at")
      .eq("quiz_id", quiz.id)
      .order("sort_order", { ascending: true }),
    userId
      ? supabase
          .from("quiz_attempts")
          .select("id,quiz_id,user_id,score,answers,elapsed_seconds,created_at")
          .eq("user_id", userId)
          .eq("quiz_id", quiz.id)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (questionsResponse.error || attemptsResponse.error) return null;

  const questions = (questionsResponse.data ?? []) as QuestionRow[];
  const optionsResponse =
    questions.length > 0
      ? await supabase
          .from("quiz_options")
          .select("id,question_id,text,is_correct,sort_order,created_at")
          .in(
            "question_id",
            questions.map((question) => question.id)
          )
          .order("sort_order", { ascending: true })
      : { data: [], error: null };

  if (optionsResponse.error) return null;

  const optionsByQuestion = new Map<string, OptionRow[]>();
  ((optionsResponse.data ?? []) as OptionRow[]).forEach((option) => {
    const current = optionsByQuestion.get(option.question_id) ?? [];
    current.push(option);
    optionsByQuestion.set(option.question_id, current);
  });

  const mappedQuestions: QuizQuestion[] = questions.map((question) => {
    const options = optionsByQuestion.get(question.id) ?? [];
    const correct = options.find((option) => option.is_correct);

    return {
      id: question.id,
      question: question.question,
      options: options.map((option) => ({
        id: option.id,
        text: option.text,
      })),
      correctId: correct?.id ?? "",
      explanation: question.explanation,
    };
  });

  const attempts = (attemptsResponse.data ?? []) as AttemptRow[];
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((attempt) => attempt.score)) : undefined;

  return {
    id: quiz.id,
    slug: quiz.slug,
    title: quiz.title,
    description: quiz.description,
    thumbnailUrl: (await getSignedStorageUrl("content-media", quiz.thumbnail_path)) ?? EMPTY_IMAGE,
    category: quiz.category,
    difficulty: quiz.difficulty as Quiz["difficulty"],
    questions: mappedQuestions,
    estimatedMinutes: quiz.estimated_minutes,
    status: attempts.length > 0 ? "concluido" : "nao_iniciado",
    score: bestScore,
    attempts: attempts.length,
  };
}

export async function saveQuizAttempt({
  quizId,
  userId,
  score,
  answers,
  elapsedSeconds,
}: {
  quizId: string;
  userId: string;
  score: number;
  answers: string[];
  elapsedSeconds: number;
}) {
  const supabase = createSupabaseBrowserClient();
  return supabase.from("quiz_attempts").insert({
    quiz_id: quizId,
    user_id: userId,
    score,
    answers,
    elapsed_seconds: elapsedSeconds,
  });
}

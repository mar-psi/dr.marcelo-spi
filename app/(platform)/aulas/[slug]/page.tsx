"use client";

import React, { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Eye,
  Share2,
  Sparkles,
  Tag,
} from "lucide-react";
import { ContentCarousel } from "@/components/home/ContentCarousel";
import { PaywallModal } from "@/components/home/PaywallModal";
import { MaterialCard } from "@/components/player/PDFViewer";
import { QuizAulaCard } from "@/components/player/QuizAulaCard";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { Badge, ProgressBar, useToast } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import {
  formatLessonDuration,
  getLessonProgressPercent,
  resolveContentThumbnail,
} from "@/lib/content";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSignedStorageUrl } from "@/lib/storage";
import { formatDate, cn } from "@/lib/utils";
import type { Material, QuizAula } from "@/data/aulas";
import type { ContentItem } from "@/data/content";
import type { Database } from "@/types/database";

type ContentRow = Database["public"]["Tables"]["content_items"]["Row"];
type TagRow = Database["public"]["Tables"]["content_tags"]["Row"];
type MaterialRow = Database["public"]["Tables"]["content_materials"]["Row"];
type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type QuestionRow = Database["public"]["Tables"]["quiz_questions"]["Row"];
type ProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];

type LessonDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  fullDescription: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: "doencas" | "transtornos" | "curiosidades";
  duration: string;
  durationSeconds: number;
  progressSeconds: number;
  views: number;
  publishedAt: string;
  isFree: boolean;
  tags: string[];
  progress: number;
  materials: Material[];
  quiz: QuizAula | null;
  relatedItems: ContentItem[];
  prevLesson: ContentItem | null;
  nextLesson: ContentItem | null;
};

const categoryLabel: Record<string, string> = {
  doencas: "Doenças",
  transtornos: "Transtornos",
  curiosidades: "Curiosidades",
};

const categoryVariant: Record<string, "doencas" | "transtornos" | "curiosidades"> = {
  doencas: "doencas",
  transtornos: "transtornos",
  curiosidades: "curiosidades",
};

function isNewContent(publishedAt: string | null) {
  if (!publishedAt) return false;
  return Date.now() - new Date(publishedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
}

export default function AulaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const supabase = createSupabaseBrowserClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const lastProgressPersistedAtRef = useRef(0);
  const lastProgressSecondsRef = useRef(0);
  const durationPersistedRef = useRef(false);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [saved, setSaved] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);

  useEffect(() => {
    let active = true;

    const loadLesson = async () => {
      setLoading(true);

      const contentResponse = await supabase
        .from("content_items")
        .select(
          "id,slug,title,description,type,category,status,access,thumbnail_path,thumbnail_url,video_path,video_url,duration_seconds,published_at,created_by,created_at,updated_at,body"
        )
        .eq("slug", slug)
        .eq("type", "lesson")
        .maybeSingle();

      if (!active) return;
      if (contentResponse.error || !contentResponse.data) {
        setLesson(null);
        setLoading(false);
        return;
      }

      const current = contentResponse.data as ContentRow;
      const [
        tagsResponse,
        materialsResponse,
        progressResponse,
        savedResponse,
        relatedResponse,
        quizResponse,
      ] = await Promise.all([
        supabase.from("content_tags").select("id,content_id,tag").eq("content_id", current.id),
        supabase
          .from("content_materials")
          .select("id,content_id,title,type,storage_path,external_url,pages,sort_order,created_at")
          .eq("content_id", current.id)
          .order("sort_order", { ascending: true }),
        user
          ? supabase
              .from("lesson_progress")
              .select("user_id,content_id,progress_seconds,completed_at,updated_at")
              .eq("user_id", user.id)
              .eq("content_id", current.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        user
          ? supabase
              .from("saved_content")
              .select("user_id,content_id,saved_at")
              .eq("user_id", user.id)
              .eq("content_id", current.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from("content_items")
          .select(
            "id,slug,title,description,type,category,status,access,thumbnail_path,thumbnail_url,video_path,video_url,duration_seconds,published_at,created_by,created_at,updated_at,body"
          )
          .eq("type", "lesson")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(12),
        supabase
          .from("quizzes")
          .select(
            "id,content_id,slug,title,description,category,status,access,difficulty,estimated_minutes,thumbnail_path,created_by,published_at,created_at,updated_at"
          )
          .eq("content_id", current.id)
          .eq("status", "published")
          .maybeSingle(),
      ]);

      if (!active) return;

      const tags = ((tagsResponse.data ?? []) as TagRow[]).map((tag) => tag.tag);
      const progressSeconds = (progressResponse.data as ProgressRow | null)?.progress_seconds ?? 0;
      lastProgressSecondsRef.current = progressSeconds;
      durationPersistedRef.current = false;
      const progressPercent = getLessonProgressPercent(progressSeconds, current.duration_seconds) ?? 0;

      const materials = await Promise.all(
        ((materialsResponse.data ?? []) as MaterialRow[]).map(async (material) => ({
          id: material.id,
          title: material.title,
          type: (material.type === "ebook" ? "ebook" : "pdf") as Material["type"],
          pages: material.pages,
          fileUrl:
            material.external_url ??
            (await getSignedStorageUrl("content-materials", material.storage_path)) ??
            "",
          coverUrl: await resolveContentThumbnail(current),
        }))
      );

      const quiz = quizResponse.data as QuizRow | null;
      let quizItem: QuizAula | null = null;
      if (quiz) {
        const questionsResponse = await supabase
          .from("quiz_questions")
          .select("id,quiz_id,question,explanation,sort_order,created_at")
          .eq("quiz_id", quiz.id);
        quizItem = {
          id: quiz.id,
          slug: quiz.slug,
          title: quiz.title,
          questions: ((questionsResponse.data ?? []) as QuestionRow[]).length,
          completed: false,
        };
      }

      const relatedRows = ((relatedResponse.data ?? []) as ContentRow[]).filter(
        (item) => item.id !== current.id
      );
      const relatedItems = await Promise.all(
        relatedRows.map(async (item) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          description: item.description,
          thumbnailUrl: await resolveContentThumbnail(item),
          category: item.category,
          contentType: "video" as const,
          duration: formatLessonDuration(item.duration_seconds),
          views: 0,
          isFree: item.access === "free",
          isNew: isNewContent(item.published_at),
          publishedAt: item.published_at ?? item.created_at,
          tags: [],
        }))
      );

      const allLessons = [current, ...relatedRows]
        .sort(
          (a, b) =>
            new Date(b.published_at ?? b.created_at).getTime() -
            new Date(a.published_at ?? a.created_at).getTime()
        );
      const currentIndex = allLessons.findIndex((item) => item.id === current.id);
      const toCard = async (item: ContentRow | undefined): Promise<ContentItem | null> => {
        if (!item) return null;
        return {
          id: item.id,
          slug: item.slug,
          title: item.title,
          description: item.description,
          thumbnailUrl: await resolveContentThumbnail(item),
          category: item.category,
          contentType: "video",
          duration: formatLessonDuration(item.duration_seconds),
          views: 0,
          isFree: item.access === "free",
          isNew: isNewContent(item.published_at),
          publishedAt: item.published_at ?? item.created_at,
          tags: [],
        };
      };

      const [prevLesson, nextLesson] = await Promise.all([
        toCard(allLessons[currentIndex - 1]),
        toCard(allLessons[currentIndex + 1]),
      ]);

      const detail = {
        id: current.id,
        slug: current.slug,
        title: current.title,
        description: current.description,
        fullDescription: current.body || current.description,
        videoUrl: current.video_url || current.video_path || "",
        thumbnailUrl: await resolveContentThumbnail(current),
        category: current.category,
        duration: formatLessonDuration(current.duration_seconds),
        durationSeconds: current.duration_seconds,
        progressSeconds,
        views: 0,
        publishedAt: current.published_at ?? current.created_at,
        isFree: current.access === "free",
        tags,
        progress: progressPercent,
        materials,
        quiz: quizItem,
        relatedItems,
        prevLesson,
        nextLesson,
      } satisfies LessonDetail;

      setLesson(detail);
      setProgress(progressPercent);
      setCompleted(progressPercent >= 90);
      setSaved(Boolean(savedResponse.data));
      setLoading(false);
    };

    void loadLesson();

    return () => {
      active = false;
    };
  }, [slug, supabase, user]);

  const breadcrumbs = useMemo(() => {
    if (!lesson) return [];
    return [
      { label: "Home", href: "/" },
      { label: categoryLabel[lesson.category], href: `/aulas?categoria=${lesson.category}` },
      { label: lesson.title, href: null },
    ];
  }, [lesson]);

  const handleProgressUpdate = async (pct: number, currentSeconds: number, totalSeconds: number) => {
    const roundedPct = Math.round(pct);
    setProgress((current) => (current === roundedPct ? current : roundedPct));
    if (!lesson || !user || currentSeconds <= 0) return;

    if (!durationPersistedRef.current && lesson.durationSeconds <= 0 && totalSeconds > 0) {
      durationPersistedRef.current = true;
      const resolvedDuration = Math.round(totalSeconds);

      void supabase
        .from("content_items")
        .update({ duration_seconds: resolvedDuration })
        .eq("id", lesson.id)
        .eq("duration_seconds", 0);

      setLesson((current) =>
        current
          ? {
              ...current,
              durationSeconds: resolvedDuration,
              duration: formatLessonDuration(resolvedDuration),
            }
          : current
      );
    }

    const progressSeconds = Math.round(currentSeconds);
    const now = Date.now();
    const shouldPersist =
      roundedPct >= 90 ||
      Math.abs(progressSeconds - lastProgressSecondsRef.current) >= 5 ||
      now - lastProgressPersistedAtRef.current >= 5000;

    if (!shouldPersist) return;

    lastProgressPersistedAtRef.current = now;
    lastProgressSecondsRef.current = progressSeconds;

    await supabase.from("lesson_progress").upsert(
      {
        user_id: user.id,
        content_id: lesson.id,
        progress_seconds: progressSeconds,
        completed_at: pct >= 90 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,content_id" }
    );
  };

  const handleComplete = () => {
    if (completed) return;
    setCompleted(true);
    setShowCompletionBanner(true);
    toast({
      variant: "success",
      title: "Aula concluida!",
      message: "+20 XP ganhos. Continue assim!",
      duration: 5000,
    });
    setTimeout(() => setShowCompletionBanner(false), 6000);
  };

  const handleSave = async () => {
    if (!lesson || !user) return;
    setSaving(true);

    const previousSaved = saved;
    setSaved(!previousSaved);

    const { error } = previousSaved
      ? await supabase
          .from("saved_content")
          .delete()
          .eq("user_id", user.id)
          .eq("content_id", lesson.id)
      : await supabase
          .from("saved_content")
          .upsert(
            {
              user_id: user.id,
              content_id: lesson.id,
              saved_at: new Date().toISOString(),
            },
            { onConflict: "user_id,content_id" }
          );

    setSaving(false);

    if (error) {
      setSaved(previousSaved);
      toast({
        variant: "error",
        title: "Nao foi possivel salvar",
        message: error.message,
      });
      return;
    }

    toast({
      variant: "info",
      title: previousSaved ? "Removido da lista" : "Salvo na sua lista",
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ variant: "success", title: "Link copiado!" });
    } catch {
      toast({ variant: "error", title: "Nao foi possivel copiar o link." });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary px-4">
        <div className="text-sm text-content-secondary">Carregando aula...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary px-4">
        <div className="max-w-md text-center">
          <BookOpen size={36} className="mx-auto mb-4 text-content-disabled" />
          <h1 className="mb-2 text-xl font-bold text-content-primary">Aula nao encontrada</h1>
          <p className="mb-5 text-sm text-content-secondary">
            Esta aula nao esta publicada ou nao existe mais.
          </p>
          <Link
            href="/aulas"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-accent-primary px-4 text-sm font-medium text-white transition-colors hover:bg-accent-primaryHover"
          >
            Voltar para aulas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <AnimatePresence>
        {showCompletionBanner && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-2xl border border-[rgba(34,197,94,0.4)] bg-status-successBg px-5 py-3 shadow-card"
          >
            <Sparkles size={18} className="text-status-success" />
            <p className="text-sm font-semibold text-status-success">
              Aula concluida! +20 XP ganhos
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pb-2 pt-4 lg:px-6">
        <nav className="flex items-center gap-1.5 overflow-x-auto text-xs text-content-disabled">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight size={12} className="shrink-0 opacity-50" />}
              {crumb.href ? (
                <Link href={crumb.href} className="shrink-0 hover:text-accent-secondary">
                  {crumb.label}
                </Link>
              ) : (
                <span className="max-w-[220px] truncate font-medium text-content-secondary">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="px-4 pb-32 lg:px-6 lg:pb-12">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1 lg:max-w-[70%]">
            <div className="mb-5 overflow-hidden rounded-xl shadow-card">
              <VideoPlayer
                videoUrl={lesson.videoUrl}
                thumbnailUrl={lesson.thumbnailUrl}
                title={lesson.title}
                slug={lesson.slug}
                isFree={lesson.isFree}
                savedProgress={lesson.progressSeconds}
                onProgressUpdate={handleProgressUpdate}
                onComplete={handleComplete}
              />
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant={categoryVariant[lesson.category]}>
                {categoryLabel[lesson.category]}
              </Badge>
              {completed && (
                <Badge variant="success">
                  <CheckCircle2 size={11} className="mr-1" />
                  Concluida
                </Badge>
              )}
              {lesson.isFree && <Badge variant="free">Gratis</Badge>}
            </div>

            <h1 className="mb-3 text-2xl font-bold leading-snug text-content-primary lg:text-3xl">
              {lesson.title}
            </h1>

            <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-content-secondary">
              <span className="flex items-center gap-1.5">
                <Eye size={13} />
                {lesson.views.toLocaleString("pt-BR")} visualizacoes
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                {formatDate(lesson.publishedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {lesson.duration}
              </span>
            </div>

            {progress > 0 && (
              <div className="mb-5">
                <ProgressBar
                  value={progress}
                  label="Progresso da aula"
                  showPercentage
                  color={completed ? "success" : "primary"}
                  size="md"
                  animated
                />
              </div>
            )}

            <div className="mb-6 flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all disabled:opacity-60",
                  saved
                    ? "border-accent-primary/40 bg-accent-primary/15 text-accent-secondary"
                    : "border-border-subtle bg-background-tertiary text-content-secondary hover:border-accent-primary/40 hover:text-content-primary"
                )}
              >
                {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                {saved ? "Salvo" : "Salvar"}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleShare}
                className="flex items-center gap-2 rounded-lg border border-border-subtle bg-background-tertiary px-4 py-2 text-sm font-medium text-content-secondary transition-all hover:border-accent-primary/40 hover:text-content-primary"
              >
                <Share2 size={15} />
                Compartilhar
              </motion.button>
            </div>

            <div className="mb-6 rounded-xl border border-border-subtle bg-background-secondary p-5">
              <h2 className="mb-3 text-base font-semibold text-content-primary">Sobre esta aula</h2>
              <div className="relative">
                <div
                  className={cn(
                    "whitespace-pre-line text-sm leading-relaxed text-content-secondary transition-all",
                    !descExpanded && "line-clamp-3"
                  )}
                >
                  {lesson.fullDescription}
                </div>
                {!descExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background-secondary to-transparent" />
                )}
              </div>
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-3 flex items-center gap-1 text-xs font-semibold text-accent-secondary hover:text-accent-primary"
              >
                {descExpanded ? (
                  <>
                    <ChevronUp size={14} /> Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} /> Ver mais
                  </>
                )}
              </button>
            </div>

            {lesson.tags.length > 0 && (
              <div className="mb-8 flex flex-wrap items-center gap-2">
                <Tag size={13} className="text-content-disabled" />
                {lesson.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/aulas?q=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-border-subtle bg-background-tertiary px-3 py-1 text-xs text-content-secondary transition-all hover:border-accent-primary/50 hover:text-accent-secondary"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {lesson.relatedItems.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-bold text-content-primary">Conteudos Relacionados</h2>
                <ContentCarousel
                  items={lesson.relatedItems}
                  onPaywallTrigger={() => setPaywallOpen(true)}
                />
              </div>
            )}
          </div>

          <aside className="hidden w-[320px] shrink-0 flex-col gap-5 lg:flex xl:w-[360px]">
            {progress > 0 && (
              <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
                <p className="mb-2 text-xs font-medium text-content-secondary">Seu progresso nesta aula</p>
                <ProgressBar
                  value={progress}
                  showPercentage
                  color={completed ? "success" : "primary"}
                  size="md"
                  animated
                />
              </div>
            )}

            {lesson.materials.length > 0 && (
              <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
                <div className="mb-4 flex items-center gap-2">
                  <BookOpen size={15} className="shrink-0 text-accent-primary" />
                  <h2 className="text-sm font-bold text-content-primary">Materiais de Apoio</h2>
                </div>
                <div className="space-y-2">
                  {lesson.materials.map((material) => (
                    <MaterialCard key={material.id} material={material} />
                  ))}
                </div>
              </div>
            )}

            {lesson.quiz && <QuizAulaCard quiz={lesson.quiz} />}
          </aside>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-30 bg-gradient-to-t from-background-primary via-background-primary/95 to-transparent px-4 pb-3 pt-6 lg:hidden">
        <div className="flex gap-2">
          {lesson.prevLesson ? (
            <Link href={`/aulas/${lesson.prevLesson.slug}`} className="flex-1">
              <div className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border-subtle bg-background-secondary text-sm font-medium text-content-secondary">
                <ArrowLeft size={15} />
                Anterior
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {lesson.nextLesson ? (
            <Link href={`/aulas/${lesson.nextLesson.slug}`} className="flex-1">
              <div className="flex h-11 items-center justify-center gap-2 rounded-xl bg-accent-primary text-sm font-semibold text-white shadow-glow">
                Proxima
                <ArrowRight size={15} />
              </div>
            </Link>
          ) : (
            <div className="flex h-11 flex-1 items-center justify-center rounded-xl border border-border-subtle bg-background-secondary text-sm text-content-disabled">
              Ultima aula
            </div>
          )}
        </div>
      </div>

      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}

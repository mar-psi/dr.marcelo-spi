"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Eye, Layers, Play } from "lucide-react";
import { ContentCarousel } from "@/components/home/ContentCarousel";
import { SectionHeader } from "@/components/home/SectionHeader";
import { EbookCard } from "@/components/home/EbookCard";
import { QuizPreviewCard } from "@/components/home/QuizPreviewCard";
import { WelcomeBanner } from "@/components/home/WelcomeBanner";
import { BackToTop } from "@/components/home/BackToTop";
import { PaywallModal } from "@/components/home/PaywallModal";
import { Badge, Button, ContentCard } from "@/components/ui";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { formatLessonDuration, getLessonProgressPercent, resolveContentThumbnail } from "@/lib/content";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { EMPTY_IMAGE, getSignedStorageUrl } from "@/lib/storage";
import type { ContentItem, EbookItem } from "@/data/content";
import type { Database } from "@/types/database";

type ContentRow = Database["public"]["Tables"]["content_items"]["Row"];
type TagRow = Database["public"]["Tables"]["content_tags"]["Row"];
type MaterialRow = Database["public"]["Tables"]["content_materials"]["Row"];
type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type QuizQuestionRow = Database["public"]["Tables"]["quiz_questions"]["Row"];
type QuizAttemptRow = Database["public"]["Tables"]["quiz_attempts"]["Row"];
type ProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];

type HomeQuizItem = {
  id: string;
  slug: string;
  title: string;
  category: "doencas" | "transtornos" | "curiosidades";
  questions: number;
  difficulty: string;
  thumbnailUrl: string;
  completed: boolean;
  score: number | null;
};

type StorySummary = {
  id: string;
  title: string;
  category: "doencas" | "transtornos" | "curiosidades";
};

function FadeSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

function isNewContent(publishedAt: string | null) {
  if (!publishedAt) return false;
  return Date.now() - new Date(publishedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
}

export default function HomePage() {
  const supabase = createSupabaseBrowserClient();
  const { isSubscriber } = useSubscription();
  const { user } = useAuth();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallContent, setPaywallContent] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<ContentItem[]>([]);
  const [ebooks, setEbooks] = useState<EbookItem[]>([]);
  const [quizzes, setQuizzes] = useState<HomeQuizItem[]>([]);
  const [stories, setStories] = useState<StorySummary[]>([]);

  const triggerPaywall = (title?: string) => {
    if (isSubscriber) return;
    setPaywallContent(title);
    setPaywallOpen(true);
  };

  useEffect(() => {
    let active = true;

    const loadHome = async () => {
      setLoading(true);

      const [
        contentResponse,
        tagsResponse,
        materialsResponse,
        quizzesResponse,
        questionResponse,
        attemptResponse,
        storiesResponse,
        progressResponse,
      ] = await Promise.all([
        supabase
          .from("content_items")
          .select(
            "id,slug,title,description,type,category,status,access,thumbnail_path,thumbnail_url,video_path,video_url,duration_seconds,published_at,created_by,created_at,updated_at,body"
          )
          .in("type", ["lesson", "ebook"])
          .eq("status", "published")
          .order("published_at", { ascending: false }),
        supabase.from("content_tags").select("id,content_id,tag"),
        supabase
          .from("content_materials")
          .select("id,content_id,title,type,storage_path,external_url,pages,sort_order,created_at")
          .order("sort_order", { ascending: true }),
        supabase
          .from("quizzes")
          .select(
            "id,content_id,slug,title,description,category,status,access,difficulty,estimated_minutes,thumbnail_path,created_by,published_at,created_at,updated_at"
          )
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(6),
        supabase.from("quiz_questions").select("id,quiz_id,question,explanation,sort_order,created_at"),
        user
          ? supabase
              .from("quiz_attempts")
              .select("id,quiz_id,user_id,score,answers,elapsed_seconds,created_at")
              .eq("user_id", user.id)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("stories")
          .select(
            "id,title,theme,category,status,access,media_path,thumbnail_path,duration_seconds,reactions,published_at,expires_at,created_by,created_at,updated_at"
          )
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(8),
        user
          ? supabase
              .from("lesson_progress")
              .select("user_id,content_id,progress_seconds,completed_at,updated_at")
              .eq("user_id", user.id)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (!active) return;
      if (
        contentResponse.error ||
        tagsResponse.error ||
        materialsResponse.error ||
        quizzesResponse.error ||
        questionResponse.error ||
        attemptResponse.error ||
        storiesResponse.error ||
        progressResponse.error
      ) {
        setLessons([]);
        setEbooks([]);
        setQuizzes([]);
        setStories([]);
        setLoading(false);
        return;
      }

      const tagsByContent = new Map<string, string[]>();
      (tagsResponse.data as TagRow[]).forEach((tag) => {
        const current = tagsByContent.get(tag.content_id) ?? [];
        current.push(tag.tag);
        tagsByContent.set(tag.content_id, current);
      });

      const materialsByContent = new Map<string, MaterialRow>();
      (materialsResponse.data as MaterialRow[]).forEach((material) => {
        if (!materialsByContent.has(material.content_id)) {
          materialsByContent.set(material.content_id, material);
        }
      });

      const progressByContent = new Map<string, { seconds: number; updatedAt: string }>();
      (progressResponse.data as ProgressRow[]).forEach((progress) => {
        progressByContent.set(progress.content_id, {
          seconds: progress.progress_seconds,
          updatedAt: progress.updated_at,
        });
      });

      const questionCounts = new Map<string, number>();
      (questionResponse.data as QuizQuestionRow[]).forEach((question) => {
        questionCounts.set(question.quiz_id, (questionCounts.get(question.quiz_id) ?? 0) + 1);
      });

      const attemptsByQuiz = new Map<string, QuizAttemptRow>();
      (attemptResponse.data as QuizAttemptRow[]).forEach((attempt) => {
        const current = attemptsByQuiz.get(attempt.quiz_id);
        if (!current || new Date(attempt.created_at).getTime() > new Date(current.created_at).getTime()) {
          attemptsByQuiz.set(attempt.quiz_id, attempt);
        }
      });

      const contentRows = (contentResponse.data ?? []) as ContentRow[];
      const lessonRows = contentRows.filter((item) => item.type === "lesson");
      const ebookRows = contentRows.filter((item) => item.type === "ebook");

      const mappedLessons = await Promise.all(
        lessonRows.map(async (item) => {
          const progressMeta = progressByContent.get(item.id);
          const progressSeconds = progressMeta?.seconds ?? 0;
          const progressPercent = getLessonProgressPercent(progressSeconds, item.duration_seconds);

          return {
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
            progress: progressPercent,
            progressText: progressSeconds > 0 ? "Retomar aula" : undefined,
            publishedAt: item.published_at ?? item.created_at,
            resumeUpdatedAt: progressMeta?.updatedAt,
            tags: tagsByContent.get(item.id) ?? [],
          } satisfies ContentItem;
        })
      );

      const mappedEbooks = await Promise.all(
        ebookRows.map(async (item) => {
          const material = materialsByContent.get(item.id);

          return {
            id: item.id,
            slug: item.slug,
            title: item.title,
            coverUrl:
              item.thumbnail_url ??
              (await getSignedStorageUrl("content-media", item.thumbnail_path)) ??
              EMPTY_IMAGE,
            category: item.category,
            pages: material?.pages ?? 0,
            isFree: item.access === "free",
            isNew: isNewContent(item.published_at),
          } satisfies EbookItem;
        })
      );

      const mappedQuizzes = await Promise.all(
        ((quizzesResponse.data ?? []) as QuizRow[]).map(async (quiz) => {
          const latestAttempt = attemptsByQuiz.get(quiz.id);

          return {
            id: quiz.id,
            slug: quiz.slug,
            title: quiz.title,
            category: quiz.category,
            questions: questionCounts.get(quiz.id) ?? 0,
            difficulty: quiz.difficulty,
            thumbnailUrl:
              (await getSignedStorageUrl("content-media", quiz.thumbnail_path)) ?? EMPTY_IMAGE,
            completed: Boolean(latestAttempt),
            score: latestAttempt?.score ?? null,
          };
        })
      );

      const mappedStories = ((storiesResponse.data ?? []) as StoryRow[]).map((story) => ({
        id: story.id,
        title: story.title,
        category: story.category,
      }));

      setLessons(mappedLessons);
      setEbooks(mappedEbooks);
      setQuizzes(mappedQuizzes);
      setStories(mappedStories);
      setLoading(false);
    };

    void loadHome();

    return () => {
      active = false;
    };
  }, [supabase, user]);

  const featuredLesson = lessons[0] ?? null;
  const continueWatchingItems = useMemo(
    () =>
      lessons
        .filter((item) => Boolean(item.progressText))
        .sort(
          (a, b) =>
            new Date(b.resumeUpdatedAt ?? 0).getTime() -
            new Date(a.resumeUpdatedAt ?? 0).getTime()
        )
        .slice(0, 8),
    [lessons]
  );
  const doencasItems = useMemo(
    () => lessons.filter((item) => item.category === "doencas").slice(0, 8),
    [lessons]
  );
  const transtornosItems = useMemo(
    () => lessons.filter((item) => item.category === "transtornos").slice(0, 8),
    [lessons]
  );
  const curiosidadesItems = useMemo(
    () => lessons.filter((item) => item.category === "curiosidades").slice(0, 8),
    [lessons]
  );
  const recentItems = useMemo(() => lessons.slice(0, 8), [lessons]);

  return (
    <>
      <div className="px-4 lg:px-6 pt-4">
        {stories.length > 0 ? (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-background-secondary px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-secondary">
                Stories do Dr. Marcelo
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {stories.slice(0, 5).map((story) => (
                  <Link
                    key={story.id}
                    href="/stories"
                    className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-background-tertiary px-3 py-1.5 text-xs text-content-primary hover:border-accent-primary/40"
                  >
                    <Layers size={12} className="text-accent-secondary" />
                    {story.title}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href="/stories"
              className="hidden sm:inline-flex items-center gap-2 text-sm text-accent-secondary hover:text-accent-primary"
            >
              Ver tudo <ArrowRight size={14} />
            </Link>
          </div>
        ) : null}
      </div>

      <div className="px-4 lg:px-6 pt-6">
        {featuredLesson ? (
          <div className="relative overflow-hidden rounded-[28px] border border-border-subtle bg-background-secondary shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div className="absolute inset-0">
              <img
                src={featuredLesson.thumbnailUrl}
                alt={featuredLesson.title}
                className="h-full w-full object-cover opacity-18 blur-[2px] scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(10,10,15,0.98)] via-[rgba(10,10,15,0.9)] to-[rgba(10,10,15,0.66)]" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background-primary/55 to-transparent" />
            </div>
            <div className="relative grid items-center gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,500px)] lg:px-10 lg:py-14">
              <div className="max-w-2xl">
                <Badge variant={featuredLesson.category} className="mb-4">
                  Destaque da semana
                </Badge>
                <h1 className="max-w-xl text-3xl font-bold text-content-primary lg:text-5xl">
                  {featuredLesson.title}
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-content-secondary lg:text-base">
                  {featuredLesson.description}
                </p>
                <div className="mt-5 flex items-center gap-3 text-xs text-content-secondary">
                  <span>{featuredLesson.duration}</span>
                  <span>•</span>
                  <span>{featuredLesson.isFree ? "Acesso gratuito" : "Exclusivo para assinantes"}</span>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<Play size={16} fill="white" />}
                    asChild
                  >
                    <Link href={`/aulas/${featuredLesson.slug}`}>Assistir agora</Link>
                  </Button>
                  <Button variant="ghost" size="lg" asChild>
                    <Link href="/aulas">Explorar aulas</Link>
                  </Button>
                </div>
              </div>
              <div className="hidden lg:flex justify-end">
                <Link
                  href={`/aulas/${featuredLesson.slug}`}
                  onClick={(event) => {
                    if (!featuredLesson.isFree && !isSubscriber) {
                      event.preventDefault();
                      triggerPaywall(featuredLesson.title);
                    }
                  }}
                  className="group relative w-full max-w-[460px] overflow-hidden rounded-[22px] border border-white/12 bg-black/55 shadow-[0_24px_70px_rgba(0,0,0,0.42)] transition-transform duration-300 hover:-translate-y-1"
                  aria-label={`Assistir ${featuredLesson.title}`}
                >
                  <div className="relative aspect-video bg-black">
                    <img
                      src={featuredLesson.thumbnailUrl}
                      alt={featuredLesson.title}
                      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/12 to-black/10" />
                    <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                      <Badge variant={featuredLesson.category} overImage>
                        {featuredLesson.category === "doencas"
                          ? "Doenças"
                          : featuredLesson.category === "transtornos"
                          ? "Transtornos"
                          : "Curiosidades"}
                      </Badge>
                      {featuredLesson.isFree ? <Badge variant="free" overImage>Grátis</Badge> : null}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-2xl transition-transform duration-300 group-hover:scale-105">
                        <Play size={26} className="ml-1" fill="currentColor" />
                      </div>
                    </div>
                    {featuredLesson.progress !== undefined && featuredLesson.progress > 0 ? (
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/15">
                        <div
                          className="h-full bg-accent-primary"
                          style={{ width: `${featuredLesson.progress}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-content-primary">
                        {featuredLesson.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-content-secondary">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {featuredLesson.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {featuredLesson.views.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-content-primary">
                      Assistir
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-border-subtle bg-background-secondary px-6 py-16">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-secondary">
              Plataforma pronta
            </p>
            <h1 className="mt-3 text-3xl font-bold text-content-primary">
              Cadastre o primeiro conteúdo no painel admin
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-content-secondary">
              A home agora está pronta para exibir dados reais do Supabase. Assim que houver aulas,
              quizzes, e-books e stories publicados, eles aparecem automaticamente aqui.
            </p>
          </div>
        )}
      </div>

      <div className="px-4 lg:px-6 space-y-12 pb-12 pt-8">
        {continueWatchingItems.length > 0 ? (
          <FadeSection delay={0.05}>
            <section aria-label="Continue assistindo">
              <SectionHeader
                title="Continue Assistindo"
                variant="continuar"
                href="/aulas"
                subtitle="Suas aulas em andamento aparecem aqui para retomar sem procurar."
              />
              <ContentCarousel
                items={continueWatchingItems}
                onPaywallTrigger={(title) => triggerPaywall(title)}
              />
            </section>
          </FadeSection>
        ) : (
          <FadeSection delay={0.05}>
            <WelcomeBanner />
          </FadeSection>
        )}

        {doencasItems.length > 0 && (
          <FadeSection delay={0.1}>
            <section aria-label="Aulas sobre Doenças">
              <SectionHeader
                title="Doenças"
                variant="doencas"
                href="/aulas?categoria=doencas"
                subtitle="Diagnóstico, causas e tratamentos"
              />
              <ContentCarousel items={doencasItems} onPaywallTrigger={(title) => triggerPaywall(title)} />
            </section>
          </FadeSection>
        )}

        {transtornosItems.length > 0 && (
          <FadeSection delay={0.12}>
            <section aria-label="Aulas sobre Transtornos e Tratamentos">
              <SectionHeader
                title="Transtornos e Tratamentos"
                variant="transtornos"
                href="/aulas?categoria=transtornos"
                subtitle="Abordagens terapêuticas e farmacológicas"
              />
              <ContentCarousel items={transtornosItems} onPaywallTrigger={(title) => triggerPaywall(title)} />
            </section>
          </FadeSection>
        )}

        {curiosidadesItems.length > 0 && (
          <FadeSection delay={0.14}>
            <section aria-label="Curiosidades sobre Saúde Mental">
              <SectionHeader
                title="Curiosidades"
                variant="curiosidades"
                href="/aulas?categoria=curiosidades"
                subtitle="O lado fascinante da mente humana"
              />
              <ContentCarousel items={curiosidadesItems} onPaywallTrigger={(title) => triggerPaywall(title)} />
            </section>
          </FadeSection>
        )}

        {ebooks.length > 0 && (
          <FadeSection delay={0.16}>
            <section aria-label="E-books e materiais">
              <SectionHeader
                title="E-books e Materiais"
                variant="ebooks"
                href="/ebooks"
                subtitle="PDFs e guias para aprofundar seu conhecimento"
              />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {ebooks.slice(0, 4).map((item) => (
                  <EbookCard key={item.id} item={item} onPaywallTrigger={(title) => triggerPaywall(title)} />
                ))}
              </div>
            </section>
          </FadeSection>
        )}

        {quizzes.length > 0 && (
          <FadeSection delay={0.18}>
            <section aria-label="Quizzes disponíveis">
              <SectionHeader
                title="Quizzes Disponíveis"
                variant="quizzes"
                href="/quizzes"
                subtitle="Teste seus conhecimentos sobre saúde mental"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {quizzes.map((quiz) => (
                  <QuizPreviewCard key={quiz.id} item={quiz} />
                ))}
              </div>
            </section>
          </FadeSection>
        )}

        {recentItems.length > 0 && (
          <FadeSection delay={0.2}>
            <section aria-label="Novidades recentes">
              <SectionHeader
                title="Últimas Novidades"
                variant="novidades"
                href="/aulas"
                subtitle="Os conteúdos mais recentes da plataforma"
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {recentItems.map((item) => (
                  <ContentCard
                    key={item.id}
                    slug={item.slug}
                    title={item.title}
                    thumbnailUrl={item.thumbnailUrl}
                    category={item.category}
                    duration={item.duration}
                    views={item.views}
                    isFree={item.isFree}
                    isNew={item.isNew}
                    progress={item.progress}
                    contentType="Vídeo"
                    onPaywallTrigger={(title) => triggerPaywall(title)}
                  />
                ))}
              </div>
            </section>
          </FadeSection>
        )}

        {loading && (
          <div className="rounded-2xl border border-border-subtle bg-background-secondary px-4 py-10 text-center text-sm text-content-secondary">
            Carregando destaques da plataforma...
          </div>
        )}
      </div>

      <BackToTop />

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        contentTitle={paywallContent}
      />
    </>
  );
}

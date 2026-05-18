"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Sparkles, Star, ChevronRight } from "lucide-react";
import {
  badgesData,
  getUserLevel,
  getNextLevel,
  XP_ACTIONS,
} from "@/data/badges";
import { BadgeCard } from "@/components/gamification/BadgeCard";
import { ProgressStats } from "@/components/gamification/ProgressStats";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import { XPBar } from "@/components/gamification/XPBar";
import { AchievementToast } from "@/components/gamification/AchievementToast";
import type { BadgeDefinition } from "@/data/badges";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type ProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];
type QuizAttemptRow = Database["public"]["Tables"]["quiz_attempts"]["Row"];
type StoryViewRow = Database["public"]["Tables"]["story_views"]["Row"];
type EbookDownloadRow = Database["public"]["Tables"]["user_ebook_downloads"]["Row"];
type ContentRow = Database["public"]["Tables"]["content_items"]["Row"];
type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];

type BadgeTab = "todos" | "conquistados" | "em_progresso" | "bloqueados";

const badgeTabs: { key: BadgeTab; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "conquistados", label: "Conquistados" },
  { key: "em_progresso", label: "Em progresso" },
  { key: "bloqueados", label: "Bloqueados" },
];

const UNLOCKED_IDS: string[] = [];

const SYSTEM_LEVELS = [
  { name: "Iniciante", range: "0–100 XP", icon: "🌱", color: "#64748B", minXp: 0 },
  { name: "Aprendiz", range: "101–300 XP", icon: "📖", color: "#3B82F6", minXp: 101 },
  { name: "Estudante", range: "301–600 XP", icon: "🎓", color: "#7C3AED", minXp: 301 },
  { name: "Especialista", range: "601–1000 XP", icon: "⭐", color: "#F59E0B", minXp: 601 },
  { name: "Mestre", range: "1001+ XP", icon: "🏆", color: "#22C55E", minXp: 1001 },
];

type RecentXp = {
  id: string;
  icon: string;
  label: string;
  xp: number;
  time: string;
  date: string;
};

function formatRelative(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.round(hours / 24);
  return `${days}d atrás`;
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

export default function ConquistasPage() {
  const supabase = createSupabaseBrowserClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<BadgeTab>("todos");
  const [toastBadge, setToastBadge] = useState<BadgeDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    xp: 0,
    aulasConcluidas: 0,
    quizzesRespondidos: 0,
    storiesVistos: 0,
    streakDays: 0,
  });
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [badges, setBadges] = useState<BadgeDefinition[]>(badgesData);
  const [recentXp, setRecentXp] = useState<RecentXp[]>([]);

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const [progressResponse, attemptsResponse, viewsResponse, downloadsResponse, contentResponse, quizzesResponse] =
        await Promise.all([
          supabase
            .from("lesson_progress")
            .select("user_id,content_id,progress_seconds,completed_at,updated_at")
            .eq("user_id", user.id),
          supabase
            .from("quiz_attempts")
            .select("id,quiz_id,user_id,score,answers,elapsed_seconds,created_at")
            .eq("user_id", user.id),
          supabase
            .from("story_views")
            .select("story_id,user_id,seen_at")
            .eq("user_id", user.id),
          supabase
            .from("user_ebook_downloads")
            .select("user_id,content_id,downloaded_at")
            .eq("user_id", user.id),
          supabase
            .from("content_items")
            .select("id,slug,title,description,type,category,status,access,thumbnail_path,thumbnail_url,video_path,video_url,duration_seconds,published_at,created_by,created_at,updated_at,body"),
          supabase
            .from("quizzes")
            .select("id,content_id,slug,title,description,category,status,access,difficulty,estimated_minutes,thumbnail_path,created_by,published_at,created_at,updated_at"),
        ]);

      if (!active) return;
      if (
        progressResponse.error ||
        attemptsResponse.error ||
        viewsResponse.error ||
        downloadsResponse.error ||
        contentResponse.error ||
        quizzesResponse.error
      ) {
        setLoading(false);
        return;
      }

      const progressRows = (progressResponse.data ?? []) as ProgressRow[];
      const attempts = (attemptsResponse.data ?? []) as QuizAttemptRow[];
      const storyViews = (viewsResponse.data ?? []) as StoryViewRow[];
      const ebookDownloads = (downloadsResponse.data ?? []) as EbookDownloadRow[];
      const contents = (contentResponse.data ?? []) as ContentRow[];
      const quizzes = (quizzesResponse.data ?? []) as QuizRow[];
      const contentById = new Map(contents.map((content) => [content.id, content]));
      const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));

      const completedProgress = progressRows.filter((row) => Boolean(row.completed_at));
      const completedLessons = completedProgress.length;
      const completedToday = completedProgress.filter((row) => {
        if (!row.completed_at) return false;
        return new Date(row.completed_at).toDateString() === new Date().toDateString();
      }).length;
      const categoriesCompleted = new Set(
        completedProgress
          .map((row) => contentById.get(row.content_id)?.category)
          .filter(Boolean)
      );
      const perfectAttempts = attempts.filter((attempt) => attempt.score >= 100);
      const hasRetried = attempts.some((attempt) => attempt.score < 70) && attempts.length > 1;

      const nextUnlocked = badgesData
        .filter((badge) => {
          if (badge.id === "iniciante") return true;
          if (badge.id === "primeira_aula") return completedLessons >= 1;
          if (badge.id === "maratonista") return completedToday >= 5;
          if (badge.id === "quiz_master") return perfectAttempts.length >= 1;
          if (badge.id === "perfeito") return perfectAttempts.length >= 3;
          if (badge.id === "persistente") return hasRetried;
          if (badge.id === "curioso") return categoriesCompleted.size >= 3;
          return false;
        })
        .map((badge) => badge.id);

      const nextBadges = badgesData.map((badge) => {
        if (badge.id === "primeira_aula") return { ...badge, progress: Math.min(completedLessons, 1), total: 1 };
        if (badge.id === "maratonista") return { ...badge, progress: Math.min(completedToday, 5), total: 5 };
        if (badge.id === "quiz_master") return { ...badge, progress: Math.min(perfectAttempts.length, 1), total: 1 };
        if (badge.id === "perfeito") return { ...badge, progress: Math.min(perfectAttempts.length, 3), total: 3 };
        if (badge.id === "curioso") return { ...badge, progress: Math.min(categoriesCompleted.size, 3), total: 3 };
        return badge;
      });

      const xp =
        completedLessons * XP_ACTIONS.WATCH_LESSON +
        attempts.length * XP_ACTIONS.COMPLETE_QUIZ +
        perfectAttempts.length * XP_ACTIONS.PERFECT_QUIZ +
        storyViews.length * XP_ACTIONS.VIEW_STORY +
        ebookDownloads.length * XP_ACTIONS.DOWNLOAD_EBOOK;

      const lessonEntries: RecentXp[] = completedProgress
        .filter((row) => row.completed_at)
        .map((row) => ({
          id: `lesson-${row.content_id}-${row.completed_at}`,
          icon: "🎬",
          label: `Aula concluída: ${contentById.get(row.content_id)?.title ?? "Aula"}`,
          xp: XP_ACTIONS.WATCH_LESSON,
          time: formatRelative(row.completed_at!),
          date: row.completed_at!,
        }));

      const quizEntries: RecentXp[] = attempts.map((attempt) => ({
        id: `quiz-${attempt.id}`,
        icon: attempt.score >= 100 ? "🎯" : "🧠",
        label: `Quiz respondido: ${quizById.get(attempt.quiz_id)?.title ?? "Quiz"}`,
        xp: XP_ACTIONS.COMPLETE_QUIZ + (attempt.score >= 100 ? XP_ACTIONS.PERFECT_QUIZ : 0),
        time: formatRelative(attempt.created_at),
        date: attempt.created_at,
      }));

      const storyEntries: RecentXp[] = storyViews.map((view) => ({
        id: `story-${view.story_id}-${view.seen_at}`,
        icon: "🧠",
        label: "Story visualizado",
        xp: XP_ACTIONS.VIEW_STORY,
        time: formatRelative(view.seen_at),
        date: view.seen_at,
      }));

      const ebookEntries: RecentXp[] = ebookDownloads.map((download) => ({
        id: `ebook-${download.content_id}-${download.downloaded_at}`,
        icon: "📚",
        label: `E-book baixado: ${contentById.get(download.content_id)?.title ?? "E-book"}`,
        xp: XP_ACTIONS.DOWNLOAD_EBOOK,
        time: formatRelative(download.downloaded_at),
        date: download.downloaded_at,
      }));

      setStats({
        xp,
        aulasConcluidas: completedLessons,
        quizzesRespondidos: attempts.length,
        storiesVistos: storyViews.length,
        streakDays: 0,
      });
      setUnlockedIds(nextUnlocked);
      setBadges(nextBadges);
      setRecentXp([...lessonEntries, ...quizEntries, ...storyEntries, ...ebookEntries]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8));
      setLoading(false);
    };

    void loadStats();

    return () => {
      active = false;
    };
  }, [supabase, user]);

  const { xp, aulasConcluidas, quizzesRespondidos, storiesVistos, streakDays } = stats;
  const currentLevel = getUserLevel(xp);

  const unlockedBadges = badges.filter((b) => unlockedIds.includes(b.id));
  const inProgressBadges = badges.filter(
    (b) => !unlockedIds.includes(b.id) && b.progress !== undefined
  );
  const lockedBadges = badges.filter(
    (b) => !unlockedIds.includes(b.id) && b.progress === undefined
  );

  const filteredBadges = badges.filter((b) => {
    if (activeTab === "todos") return true;
    if (activeTab === "conquistados") return unlockedIds.includes(b.id);
    if (activeTab === "em_progresso")
      return !unlockedIds.includes(b.id) && b.progress !== undefined;
    if (activeTab === "bloqueados")
      return !unlockedIds.includes(b.id) && b.progress === undefined;
    return true;
  });

  const tabCount = (tab: BadgeTab) => {
    if (tab === "todos") return badges.length;
    if (tab === "conquistados") return unlockedBadges.length;
    if (tab === "em_progresso") return inProgressBadges.length;
    return lockedBadges.length;
  };

  const previewLockedBadge = () => {
    const locked = badges.find((b) => !unlockedIds.includes(b.id));
    if (locked) setToastBadge(locked);
  };

  const nextLevel = getNextLevel(xp);
  const xpToNext = nextLevel ? Math.max(0, nextLevel.minXp - xp) : 0;

  return (
    <>
      <div className="px-4 lg:px-6 py-6 max-w-[1400px] mx-auto space-y-10 pb-24 lg:pb-12">

        {/* ── Hero header ──────────────────────────────── */}
        <FadeIn>
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[rgba(124,58,237,0.15)] via-background-tertiary to-background-secondary border border-accent-primary/20 p-6 lg:p-8">
            <div className="absolute top-0 right-0 w-72 h-72 bg-accent-primary/10 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-500/8 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-6 justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-accent-primary/20 border border-accent-primary/40 flex items-center justify-center">
                    <Trophy size={18} className="text-accent-secondary" />
                  </div>
                  <h1 className="text-3xl font-bold text-content-primary">
                    Minhas Conquistas
                  </h1>
                </div>
                <p className="text-sm text-content-secondary max-w-md leading-relaxed">
                  Cada aula assistida, quiz respondido e acesso diário te aproxima do próximo nível. Continue sua jornada! 🧠
                </p>
              </div>
              <div className="shrink-0">
                <LevelBadge xp={xp} size="lg" showXp />
              </div>
            </div>

            {/* XP progress bar */}
            <div className="relative z-10 mt-6">
              <XPBar xp={xp} />
            </div>

            {/* XP actions reference */}
            <div className="relative z-10 mt-5 flex flex-wrap gap-2">
              {[
                { label: "Aula concluída", xp: XP_ACTIONS.WATCH_LESSON },
                { label: "Quiz completo", xp: XP_ACTIONS.COMPLETE_QUIZ },
                { label: "Quiz perfeito (+bônus)", xp: XP_ACTIONS.PERFECT_QUIZ },
                { label: "Story visto", xp: XP_ACTIONS.VIEW_STORY },
                { label: "Acesso diário", xp: XP_ACTIONS.DAILY_ACCESS },
                { label: "E-book baixado", xp: XP_ACTIONS.DOWNLOAD_EBOOK },
              ].map(({ label, xp: reward }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background-secondary/80 border border-border-subtle backdrop-blur-sm"
                >
                  <Sparkles size={10} className="text-accent-secondary" />
                  <span className="text-[10px] text-content-secondary">{label}</span>
                  <span className="text-[10px] font-bold text-accent-secondary">
                    +{reward} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* ── Estatísticas ─────────────────────────────── */}
        <FadeIn delay={0.1}>
          <section aria-label="Estatísticas">
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-accent-primary" />
              <h2 className="text-xl font-bold text-content-primary">
                Suas Estatísticas
              </h2>
            </div>
            <ProgressStats
              aulasConcluidas={aulasConcluidas}
              quizzesRespondidos={quizzesRespondidos}
              storiesVistos={storiesVistos}
              streakDays={streakDays}
            />
          </section>
        </FadeIn>

        {/* ── Badges ───────────────────────────────────── */}
        <FadeIn delay={0.15}>
          <section aria-label="Badges e conquistas">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-content-primary">Badges</h2>
                <p className="text-xs text-content-secondary mt-0.5">
                  {unlockedBadges.length} de {badges.length} desbloqueados
                </p>
              </div>
              <button
                onClick={previewLockedBadge}
                className="text-xs text-accent-secondary hover:text-accent-primary transition-colors border border-accent-primary/30 px-3 py-1.5 rounded-lg hover:border-accent-primary/60"
              >
                Ver próximo badge
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
              {badgeTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-all duration-200",
                    activeTab === tab.key
                      ? "bg-accent-primary text-white border-accent-primary shadow-glow"
                      : "bg-background-secondary border-border-subtle text-content-secondary hover:border-accent-primary/40"
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full font-bold",
                      activeTab === tab.key
                        ? "bg-white/20 text-white"
                        : "bg-background-tertiary text-content-disabled"
                    )}
                  >
                    {tabCount(tab.key)}
                  </span>
                </button>
              ))}
            </div>

            {/* Grid */}
            {filteredBadges.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              >
                {filteredBadges.map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    layout
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <BadgeCard
                      badge={badge}
                      unlocked={unlockedIds.includes(badge.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-16 text-center"
              >
                <span className="text-4xl mb-3">🔒</span>
                <p className="text-content-secondary text-sm">
                  Nenhum badge nesta categoria ainda.
                </p>
              </motion.div>
            )}
          </section>
        </FadeIn>

        {/* ── Sistema de níveis ────────────────────────── */}
        <FadeIn delay={0.2}>
          <section aria-label="Sistema de níveis">
            <h2 className="text-xl font-bold text-content-primary mb-4">
              Sistema de Níveis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {SYSTEM_LEVELS.map((lvl, i) => {
                const isCurrent = currentLevel.name === lvl.name;
                const isLocked = xp < lvl.minXp;

                return (
                  <motion.div
                    key={lvl.name}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={cn(
                      "relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-200",
                      isCurrent && "border-2 shadow-glow",
                      !isCurrent && "border-border-subtle",
                      isLocked && "opacity-50"
                    )}
                    style={
                      isCurrent
                        ? {
                            borderColor: lvl.color,
                            backgroundColor: `${lvl.color}12`,
                            boxShadow: `0 0 24px ${lvl.color}25`,
                          }
                        : { backgroundColor: "var(--bg-secondary)" }
                    }
                  >
                    {/* Current indicator */}
                    {isCurrent && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: lvl.color }}
                      >
                        Você está aqui
                      </div>
                    )}

                    {/* Icon */}
                    <span className="text-3xl mb-2">{lvl.icon}</span>

                    {/* Name */}
                    <p
                      className="text-sm font-bold leading-tight mb-1"
                      style={{ color: isCurrent ? lvl.color : "var(--text-primary)" }}
                    >
                      {lvl.name}
                    </p>

                    {/* XP range */}
                    <p className="text-xs text-content-disabled">{lvl.range}</p>

                    {/* Unlocked check */}
                    {!isLocked && (
                      <div
                        className="mt-2 text-[10px] font-semibold flex items-center gap-1"
                        style={{ color: lvl.color }}
                      >
                        <span>✓</span>
                        <span>{isCurrent ? "Nível atual" : "Desbloqueado"}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>
        </FadeIn>

        {/* ── Resumo de XP recente ───────────── */}
        <FadeIn delay={0.25}>
          <section aria-label="Histórico de XP">
            <h2 className="text-xl font-bold text-content-primary mb-4">
              XP Recente
            </h2>
            <div className="bg-background-secondary rounded-2xl border border-border-subtle overflow-hidden">
              {loading ? (
                <div className="px-5 py-8 text-center text-sm text-content-secondary">
                  Carregando XP real...
                </div>
              ) : recentXp.length > 0 ? recentXp.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-border-subtle last:border-0 hover:bg-background-tertiary transition-colors"
                >
                  <span className="text-xl shrink-0">{entry.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-content-primary font-medium truncate">
                      {entry.label}
                    </p>
                    <p className="text-xs text-content-disabled">{entry.time}</p>
                  </div>
                  <span className="text-sm font-bold text-status-success shrink-0">
                    +{entry.xp} XP
                  </span>
                </motion.div>
              )) : (
                <div className="px-5 py-8 text-center text-sm text-content-secondary">
                  Seu XP aparecerá aqui conforme você assistir aulas, responder quizzes e visualizar stories.
                </div>
              )}
            </div>
          </section>
        </FadeIn>

        {/* ── CTA de engajamento ───────────────────────── */}
        <FadeIn delay={0.3}>
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-accent-primary/20 via-background-tertiary to-blue-500/10 border border-accent-primary/25 p-6 lg:p-8 text-center">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent-primary/15 blur-3xl rounded-full" />
            </div>
            <div className="relative z-10">
              <p className="text-2xl mb-2">🎯</p>
              <h3 className="text-xl font-bold text-content-primary mb-2">
                Continue sua jornada!
              </h3>
              <p className="text-sm text-content-secondary mb-5 max-w-md mx-auto">
                Você está a{" "}
                <span className="text-accent-secondary font-semibold">
                  {xpToNext} XP
                </span>{" "}
                do próximo nível. Assista uma aula agora e acelere sua evolução.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/aulas"
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-accent-primary text-white font-semibold text-sm shadow-glow hover:bg-accent-primaryHover transition-all"
                >
                  Assistir uma aula
                  <ChevronRight size={15} />
                </Link>
                <Link
                  href="/quizzes"
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-background-secondary border border-border-subtle text-content-secondary hover:text-content-primary hover:border-accent-primary/40 font-medium text-sm transition-all"
                >
                  Fazer um quiz
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ── Achievement toast ────────────────────────── */}
      <AchievementToast
        badge={toastBadge}
        onClose={() => setToastBadge(null)}
      />
    </>
  );
}

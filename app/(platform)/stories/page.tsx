"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Sparkles, Filter } from "lucide-react";
import type { StoryItem } from "@/data/stories";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { StoryCard } from "@/components/stories/StoryCard";
import { StoryRingComponent } from "@/components/stories/StoryRing";
import { STORY_AUTHOR } from "@/data/stories";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { EMPTY_IMAGE, getSignedStorageUrl } from "@/lib/storage";
import type { Database } from "@/types/database";

type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
type StoryViewRow = Database["public"]["Tables"]["story_views"]["Row"];

type TimeFilter = "todos" | "hoje" | "semana";

const timeFilters: { key: TimeFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "hoje", label: "Hoje" },
  { key: "semana", label: "Esta semana" },
];

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

export default function StoriesPage() {
  const supabase = createSupabaseBrowserClient();
  const { user } = useAuth();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadStories = async () => {
      setLoading(true);
      const now = new Date().toISOString();
      const [storiesResponse, viewsResponse] = await Promise.all([
        supabase
          .from("stories")
          .select("id,title,theme,category,status,access,media_path,thumbnail_path,duration_seconds,reactions,published_at,expires_at,created_by,created_at,updated_at")
          .eq("status", "published")
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .order("published_at", { ascending: false }),
        user
          ? supabase.from("story_views").select("story_id,user_id,seen_at").eq("user_id", user.id)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (!active) return;
      if (storiesResponse.error || viewsResponse.error) {
        setStories([]);
        setSeenIds(new Set());
        setLoading(false);
        return;
      }

      const seen = new Set(((viewsResponse.data ?? []) as StoryViewRow[]).map((view) => view.story_id));
      const mapped = await Promise.all(
        ((storiesResponse.data ?? []) as StoryRow[]).map(async (story) => {
          const mediaUrl = await getSignedStorageUrl("story-media", story.media_path);
          const thumbUrl =
            (await getSignedStorageUrl("story-media", story.thumbnail_path)) ??
            mediaUrl ??
            EMPTY_IMAGE;

          return {
            id: story.id,
            title: story.title,
            theme: story.theme,
            thumbnailUrl: thumbUrl,
            thumbnailIsVideo: !story.thumbnail_path && Boolean(story.media_path),
            videoUrl: story.media_path && story.media_path !== story.thumbnail_path ? mediaUrl ?? undefined : undefined,
            duration: story.duration_seconds || 15,
            publishedAt: story.published_at ?? story.created_at,
            seen: seen.has(story.id),
            category: story.category,
            reactions: typeof story.reactions === "object" && story.reactions ? story.reactions as Record<string, number> : {},
          } satisfies StoryItem;
        })
      );

      if (!active) return;
      setStories(mapped);
      setSeenIds(seen);
      setLoading(false);
    };

    void loadStories();

    return () => {
      active = false;
    };
  }, [supabase, user]);

  const sortedStories = useMemo(
    () => [...stories].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    [stories]
  );

  const filteredStories = useMemo(() => {
    return sortedStories.filter((s) => {
      const matchTime =
        timeFilter === "todos" ||
        (timeFilter === "hoje" && isToday(s.publishedAt)) ||
        (timeFilter === "semana" && isThisWeek(s.publishedAt));
      const matchCat =
        categoryFilter === "todos" || s.category === categoryFilter;
      return matchTime && matchCat;
    });
  }, [timeFilter, categoryFilter, sortedStories]);

  const unseenCount = sortedStories.filter((s) => !seenIds.has(s.id)).length;

  const openStory = (index: number) => {
    if (filteredStories.length === 0) return;
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleSeen = async (id: string) => {
    setSeenIds((prev) => new Set([...prev, id]));
    setStories((current) =>
      current.map((story) => (story.id === id ? { ...story, seen: true } : story))
    );
    if (!user) return;
    await supabase
      .from("story_views")
      .upsert({ story_id: id, user_id: user.id, seen_at: new Date().toISOString() }, { onConflict: "story_id,user_id" });
  };

  return (
    <>
      <div className="px-4 lg:px-6 py-6 max-w-[1400px] mx-auto">

        {/* ── Header ───────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-content-primary">Stories</h1>
              {unseenCount > 0 && (
                <Badge variant="novo" size="md">
                  {unseenCount} novo{unseenCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <p className="text-sm text-content-secondary">
              Conteúdo rápido e diário do Dr. Marcelo sobre saúde mental
            </p>
          </div>
        </div>

        {/* ── Quick access rings bar ────────────────────── */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 mb-8">
          {/* "Ver tudo" ring */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <button
              onClick={() => {
                const firstUnseen = filteredStories.findIndex((s) => !seenIds.has(s.id));
                openStory(firstUnseen >= 0 ? firstUnseen : 0);
              }}
              disabled={filteredStories.length === 0}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-primary to-blue-500 flex items-center justify-center shadow-glow hover:shadow-glowStrong transition-shadow"
              aria-label="Assistir todos os stories"
            >
              <Sparkles size={22} className="text-white" />
            </button>
            <span className="text-[10px] text-content-secondary font-medium">
              Ver tudo
            </span>
          </div>

          {filteredStories.map((story, i) => (
            <div key={story.id} className="shrink-0">
              <StoryRingComponent
                src={STORY_AUTHOR.avatar}
                name="Dr. Marcelo"
                ringState={seenIds.has(story.id) ? "seen" : "new"}
                size="md"
                newCount={seenIds.has(story.id) ? undefined : 1}
                onClick={() => openStory(i)}
                showLabel={false}
              />
              <p className="text-[9px] text-content-disabled text-center mt-1 w-16 truncate">
                {story.title}
              </p>
            </div>
          ))}
        </div>

        {/* ── Filters ──────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Time filters */}
          <div className="flex gap-2">
            {timeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setTimeFilter(f.key)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200",
                  timeFilter === f.key
                    ? "bg-accent-primary text-white border-accent-primary shadow-glow"
                    : "bg-background-secondary border-border-subtle text-content-secondary hover:border-accent-primary/40"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Category filters */}
          <div className="flex gap-2">
            {[
              { key: "todos", label: "Todas" },
              { key: "doencas", label: "Doenças" },
              { key: "transtornos", label: "Transtornos" },
              { key: "curiosidades", label: "Curiosidades" },
            ].map((c) => (
              <button
                key={c.key}
                onClick={() => setCategoryFilter(c.key)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200",
                  categoryFilter === c.key
                    ? "bg-accent-primary/15 border-accent-primary/50 text-accent-secondary"
                    : "bg-background-secondary border-border-subtle text-content-secondary hover:border-accent-primary/30"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results count ─────────────────────────────── */}
        <p className="text-xs text-content-disabled mb-4">
          {filteredStories.length} storie{filteredStories.length !== 1 ? "s" : ""} encontrado{filteredStories.length !== 1 ? "s" : ""}
          {unseenCount > 0 && (
            <span className="ml-2 text-accent-secondary">· {unseenCount} não vistos</span>
          )}
        </p>

        {/* ── Grid of story cards ───────────────────────── */}
        {loading ? (
          <div className="py-24 text-center text-sm text-content-secondary">Carregando stories...</div>
        ) : filteredStories.length > 0 ? (
          <motion.div
            layout
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            }}
          >
            {filteredStories.map((story, i) => (
              <motion.div
                key={story.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              >
                <StoryCard
                  story={story}
                  onClick={() => openStory(i)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-background-tertiary border border-border-subtle flex items-center justify-center mb-4">
              <Eye size={24} className="text-content-disabled" />
            </div>
            <h3 className="text-lg font-semibold text-content-primary mb-2">
              Nenhum story encontrado
            </h3>
            <p className="text-sm text-content-secondary">
              Tente outros filtros ou volte mais tarde.
            </p>
          </motion.div>
        )}
      </div>

      {/* ── Story Viewer ─────────────────────────────────── */}
      <AnimatePresence>
        {viewerOpen && (
          <StoryViewer
            stories={filteredStories}
            initialIndex={viewerIndex}
            onClose={() => setViewerOpen(false)}
            onSeen={handleSeen}
          />
        )}
      </AnimatePresence>
    </>
  );
}

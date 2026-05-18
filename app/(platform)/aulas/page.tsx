"use client";

import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { ContentCard, Input } from "@/components/ui";
import { PaywallModal } from "@/components/home/PaywallModal";
import { formatLessonDuration, getLessonProgressPercent, resolveContentThumbnail } from "@/lib/content";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/types/database";

type CategoryFilter = "todos" | "doencas" | "transtornos" | "curiosidades";
type TypeFilter = "todos" | "gratuitos" | "exclusivos";
type LessonRow = Database["public"]["Tables"]["content_items"]["Row"];
type TagRow = Database["public"]["Tables"]["content_tags"]["Row"];
type ProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];

interface LessonCardItem {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string;
  category: "doencas" | "transtornos" | "curiosidades";
  duration: string;
  views: number;
  isFree: boolean;
  isNew: boolean;
  progress?: number;
  tags: string[];
}

const categoryTabs: { key: CategoryFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "doencas", label: "Doenças" },
  { key: "transtornos", label: "Transtornos" },
  { key: "curiosidades", label: "Curiosidades" },
];

function isNewContent(publishedAt: string | null) {
  if (!publishedAt) return false;
  return Date.now() - new Date(publishedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
}

export default function AulasPage() {
  const supabase = createSupabaseBrowserClient();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState<CategoryFilter>("todos");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todos");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallContent, setPaywallContent] = useState<string | undefined>();
  const [items, setItems] = useState<LessonCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const triggerPaywall = (title?: string) => {
    setPaywallContent(title);
    setPaywallOpen(true);
  };

  useEffect(() => {
    let active = true;

    const loadLessons = async () => {
      setLoading(true);

      const [contentResponse, tagsResponse, progressResponse] = await Promise.all([
        supabase
          .from("content_items")
          .select(
            "id,slug,title,description,type,category,status,access,thumbnail_path,thumbnail_url,video_path,video_url,duration_seconds,published_at,created_by,created_at,updated_at,body"
          )
          .eq("type", "lesson")
          .eq("status", "published")
          .order("published_at", { ascending: false }),
        supabase.from("content_tags").select("id,content_id,tag"),
        user
          ? supabase
              .from("lesson_progress")
              .select("user_id,content_id,progress_seconds,completed_at,updated_at")
              .eq("user_id", user.id)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (!active) return;
      if (contentResponse.error || tagsResponse.error || progressResponse.error) {
        setItems([]);
        setLoading(false);
        return;
      }

      const tagsByContent = new Map<string, string[]>();
      (tagsResponse.data as TagRow[]).forEach((tag) => {
        const current = tagsByContent.get(tag.content_id) ?? [];
        current.push(tag.tag);
        tagsByContent.set(tag.content_id, current);
      });

      const progressByContent = new Map<string, number>();
      (progressResponse.data as ProgressRow[]).forEach((progress) => {
        progressByContent.set(progress.content_id, progress.progress_seconds);
      });

      const mapped = await Promise.all(
        ((contentResponse.data ?? []) as LessonRow[]).map(async (item) => {
          const progressSeconds = progressByContent.get(item.id) ?? 0;

          return {
            id: item.id,
            slug: item.slug,
            title: item.title,
            thumbnailUrl: await resolveContentThumbnail(item),
            category: item.category,
            duration: formatLessonDuration(item.duration_seconds),
            views: 0,
            isFree: item.access === "free",
            isNew: isNewContent(item.published_at),
            progress: getLessonProgressPercent(progressSeconds, item.duration_seconds),
            progressText: progressSeconds > 0 ? "Retomar aula" : undefined,
            tags: tagsByContent.get(item.id) ?? [],
          };
        })
      );

      setItems(mapped);
      setLoading(false);
    };

    void loadLessons();

    return () => {
      active = false;
    };
  }, [supabase, user]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const normalizedSearch = deferredSearch.trim().toLowerCase();
      const matchSearch =
        !normalizedSearch ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));
      const matchCategory = category === "todos" || item.category === category;
      const matchType =
        typeFilter === "todos" ||
        (typeFilter === "gratuitos" && item.isFree) ||
        (typeFilter === "exclusivos" && !item.isFree);
      return matchSearch && matchCategory && matchType;
    });
  }, [items, deferredSearch, category, typeFilter]);

  const hasFilters = search || category !== "todos" || typeFilter !== "todos";

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-content-primary mb-1">Aulas</h1>
        <p className="text-sm text-content-secondary">
          {items.length} aulas disponíveis sobre psiquiatria e saúde mental
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar aulas, temas, tags…"
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

        <div className="flex gap-2">
          {(["todos", "gratuitos", "exclusivos"] as TypeFilter[]).map((item) => (
            <button
              key={item}
              onClick={() => setTypeFilter(item)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 capitalize",
                typeFilter === item
                  ? "bg-accent-primary/15 border-accent-primary/50 text-accent-secondary"
                  : "bg-background-secondary border-border-subtle text-content-secondary hover:border-accent-primary/30"
              )}
            >
              {item === "todos" ? "Todos" : item === "gratuitos" ? "Grátis" : "Exclusivos"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {categoryTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCategory(tab.key)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-all duration-200",
              category === tab.key
                ? "bg-accent-primary text-white border-accent-primary shadow-glow"
                : "bg-background-secondary border-border-subtle text-content-secondary hover:border-accent-primary/40"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {hasFilters && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-content-secondary">
            <span className="text-content-primary font-semibold">{filtered.length}</span> resultado
            {filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={() => {
              setSearch("");
              setCategory("todos");
              setTypeFilter("todos");
            }}
            className="text-xs text-accent-secondary hover:text-accent-primary transition-colors flex items-center gap-1"
          >
            <X size={12} /> Limpar filtros
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-sm text-content-secondary">Carregando aulas...</div>
      ) : filtered.length > 0 ? (
        <motion.div
          layout
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
        >
          {filtered.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
            >
              <ContentCard
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
                onPaywallTrigger={() => triggerPaywall(item.title)}
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
            <Search size={24} className="text-content-disabled" />
          </div>
          <h3 className="text-lg font-semibold text-content-primary mb-2">Nenhuma aula encontrada</h3>
          <p className="text-sm text-content-secondary max-w-xs">
            Tente buscar por outros termos ou remova os filtros aplicados.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setCategory("todos");
              setTypeFilter("todos");
            }}
            className="mt-4 text-sm text-accent-secondary hover:text-accent-primary transition-colors"
          >
            Limpar filtros
          </button>
        </motion.div>
      )}

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        contentTitle={paywallContent}
      />
    </div>
  );
}

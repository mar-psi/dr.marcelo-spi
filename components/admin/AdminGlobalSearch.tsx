"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, User, FileVideo, HelpCircle, Layers, ArrowRight, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ContentRow = Database["public"]["Tables"]["content_items"]["Row"];
type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type StoryRow = Database["public"]["Tables"]["stories"]["Row"];

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  kind: "usuario" | "conteudo" | "quiz" | "story";
}

const quickLinks = [
  { label: "Usuários", href: "/admin/usuarios" },
  { label: "Conteúdo", href: "/admin/conteudo" },
  { label: "Assinaturas", href: "/admin/assinaturas" },
  { label: "Quizzes", href: "/admin/quizzes" },
  { label: "Stories", href: "/admin/stories" },
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matches(query: string, ...fields: Array<string | null | undefined>) {
  const normalizedQuery = normalize(query);
  return fields.some((field) => field && normalize(field).includes(normalizedQuery));
}

function itemIcon(kind: SearchItem["kind"]) {
  switch (kind) {
    case "usuario":
      return User;
    case "quiz":
      return HelpCircle;
    case "story":
      return Layers;
    default:
      return FileVideo;
  }
}

export function AdminGlobalSearch({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    let active = true;

    setLoading(true);

    const timer = window.setTimeout(async () => {
      const [profilesResponse, contentResponse, quizzesResponse, storiesResponse] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id,full_name,email")
            .order("created_at", { ascending: false })
            .limit(100),
          supabase
            .from("content_items")
            .select(
              "id,slug,title,description,type,category,status,access,thumbnail_path,thumbnail_url,video_path,video_url,duration_seconds,published_at,created_by,created_at,updated_at,body"
            )
            .order("created_at", { ascending: false })
            .limit(100),
          supabase
            .from("quizzes")
            .select(
              "id,content_id,slug,title,description,category,status,access,difficulty,estimated_minutes,thumbnail_path,created_by,published_at,created_at,updated_at"
            )
            .order("created_at", { ascending: false })
            .limit(100),
          supabase
            .from("stories")
            .select(
              "id,title,theme,category,status,access,media_path,thumbnail_path,duration_seconds,reactions,published_at,expires_at,created_by,created_at,updated_at"
            )
            .order("created_at", { ascending: false })
            .limit(100),
        ]);

      if (!active) return;

      if (
        profilesResponse.error ||
        contentResponse.error ||
        quizzesResponse.error ||
        storiesResponse.error
      ) {
        setResults([]);
        setLoading(false);
        return;
      }

      const profileItems = (profilesResponse.data ?? [])
        .filter((profile: Pick<ProfileRow, "id" | "full_name" | "email">) =>
          matches(query, profile.full_name, profile.email)
        )
        .slice(0, 4)
        .map((profile) => ({
          id: `profile-${profile.id}`,
          title: profile.full_name ?? "Aluno sem nome",
          subtitle: profile.email ?? "Sem e-mail",
          href: "/admin/usuarios",
          kind: "usuario" as const,
        }));

      const contentItems = (contentResponse.data ?? [])
        .filter((item: ContentRow) =>
          matches(query, item.title, item.description, item.slug, item.type, item.category)
        )
        .slice(0, 4)
        .map((item) => ({
          id: `content-${item.id}`,
          title: item.title,
          subtitle: `${item.type} · ${item.status}`,
          href: "/admin/conteudo",
          kind: "conteudo" as const,
        }));

      const quizItems = (quizzesResponse.data ?? [])
        .filter((quiz: QuizRow) =>
          matches(query, quiz.title, quiz.description, quiz.slug, quiz.category, quiz.difficulty)
        )
        .slice(0, 4)
        .map((quiz) => ({
          id: `quiz-${quiz.id}`,
          title: quiz.title,
          subtitle: `${quiz.difficulty} · ${quiz.status}`,
          href: "/admin/quizzes",
          kind: "quiz" as const,
        }));

      const storyItems = (storiesResponse.data ?? [])
        .filter((story: StoryRow) =>
          matches(query, story.title, story.theme, story.category, story.status)
        )
        .slice(0, 4)
        .map((story) => ({
          id: `story-${story.id}`,
          title: story.title,
          subtitle: `${story.category} · ${story.status}`,
          href: "/admin/stories",
          kind: "story" as const,
        }));

      setResults([...profileItems, ...contentItems, ...quizItems, ...storyItems]);
      setLoading(false);
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isOpen, query]);

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-start justify-center pt-[10vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="relative w-full max-w-xl bg-background-secondary border border-border-subtle rounded-2xl shadow-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center px-4 py-3 bg-background-tertiary/50 border-b border-border-subtle">
              <Search className="text-content-disabled mr-3" size={20} />
              <input
                autoFocus
                placeholder="Busque por usuários, conteúdos, quizzes ou stories..."
                className="flex-1 bg-transparent border-none outline-none text-content-primary text-base placeholder:text-content-disabled"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="flex items-center gap-2">
                <span className="hidden sm:flex px-1.5 py-0.5 bg-background-primary border border-border-subtle rounded text-[10px] text-content-disabled font-bold">
                  ESC
                </span>
                <button onClick={onClose} className="text-content-disabled hover:text-content-primary">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
              {query.length <= 1 ? (
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="text-[10px] font-bold text-content-disabled uppercase tracking-wider mb-2 px-2">
                      Acessos rápidos
                    </h3>
                    <div className="space-y-1">
                      {quickLinks.map((item) => (
                        <button
                          key={item.href}
                          onClick={() => navigateTo(item.href)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-background-tertiary transition-colors group"
                        >
                          <History size={14} className="text-content-disabled group-hover:text-accent-secondary" />
                          <span className="text-sm text-content-secondary group-hover:text-content-primary">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : loading ? (
                <div className="py-12 text-center text-sm text-content-secondary">
                  Buscando...
                </div>
              ) : results.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-content-disabled">
                    Nenhum resultado encontrado para &quot;{query}&quot;
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {results.map((item) => {
                    const Icon = itemIcon(item.kind);
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigateTo(item.href)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-background-tertiary transition-colors group"
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                            item.kind === "usuario"
                              ? "bg-status-successBg text-status-success"
                              : item.kind === "quiz"
                              ? "bg-status-warningBg text-status-warning"
                              : item.kind === "story"
                              ? "bg-accent-primary/10 text-accent-secondary"
                              : "bg-background-tertiary text-content-secondary"
                          )}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm text-content-primary truncate font-medium">{item.title}</p>
                          <p className="text-[10px] text-content-disabled truncate">{item.subtitle}</p>
                        </div>
                        <ArrowRight
                          size={14}
                          className="text-content-disabled opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-border-subtle bg-background-tertiary/20 flex items-center justify-between">
              <p className="text-[10px] text-content-disabled">
                Dica: digite parte do nome do aluno, título da aula ou tema do story
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-content-disabled">Fechar</span>
                <span className="px-1.5 py-0.5 bg-background-primary border border-border-subtle rounded text-[10px] text-content-disabled font-bold">
                  ESC
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

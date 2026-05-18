import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveContentThumbnail } from "@/lib/content";
import type { Database } from "@/types/database";

export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  type: "aula" | "ebook" | "quiz";
  category: string;
  url: string;
  meta: string;
}

const EMPTY_THUMBNAIL =
  "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=";

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matches(query: string, ...fields: (string | string[] | undefined | null)[]): boolean {
  const normalizedQuery = normalize(query);
  return fields.some((field) => {
    if (!field) return false;
    if (Array.isArray(field)) {
      return field.some((item) => normalize(item).includes(normalizedQuery));
    }
    return normalize(field).includes(normalizedQuery);
  });
}

type ContentRow = Database["public"]["Tables"]["content_items"]["Row"];
type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];

async function mapContentItem(item: ContentRow): Promise<SearchResult | null> {
  if (item.type !== "lesson" && item.type !== "ebook") return null;

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.description,
    thumbnailUrl: await resolveContentThumbnail(item),
    type: item.type === "lesson" ? "aula" : "ebook",
    category: item.category,
    url: item.type === "lesson" ? `/aulas/${item.slug}` : "/ebooks",
    meta:
      item.type === "lesson"
        ? item.duration_seconds > 0
          ? `${Math.max(1, Math.round(item.duration_seconds / 60))} min`
          : "Live"
        : "E-book publicado",
  };
}

function mapQuizItem(quiz: QuizRow): SearchResult {
  return {
    id: quiz.id,
    slug: quiz.slug,
    title: quiz.title,
    description: quiz.description,
    thumbnailUrl: EMPTY_THUMBNAIL,
    type: "quiz",
    category: quiz.category,
    url: `/quizzes/${quiz.slug}`,
    meta: `${quiz.estimated_minutes} min · ${quiz.difficulty}`,
  };
}

export async function searchAll(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const supabase = createSupabaseBrowserClient();

  const [contentResponse, quizResponse] = await Promise.all([
    supabase
      .from("content_items")
      .select(
        "id,slug,title,description,type,category,status,access,thumbnail_url,thumbnail_path,duration_seconds,published_at,created_at,updated_at,body,video_path,video_url,created_by"
      )
      .eq("status", "published")
      .in("type", ["lesson", "ebook"])
      .order("published_at", { ascending: false })
      .limit(100),
    supabase
      .from("quizzes")
      .select(
        "id,content_id,slug,title,description,category,status,access,difficulty,estimated_minutes,thumbnail_path,created_by,published_at,created_at,updated_at"
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(100),
  ]);

  if (contentResponse.error) {
    throw new Error(contentResponse.error.message);
  }

  if (quizResponse.error) {
    throw new Error(quizResponse.error.message);
  }

  const contentResults = (
    await Promise.all(
      (contentResponse.data ?? [])
        .filter((item) => matches(query, item.title, item.description, item.body))
        .map(mapContentItem)
    )
  ).filter((item): item is SearchResult => Boolean(item));

  const quizResults = (quizResponse.data ?? [])
    .filter((quiz) => matches(query, quiz.title, quiz.description, quiz.category))
    .map(mapQuizItem);

  return [...contentResults, ...quizResults].slice(0, 24);
}

export type Category = "doencas" | "transtornos" | "curiosidades";
export type ContentType = "video" | "ebook" | "quiz" | "audio" | "infografico";

export interface ContentItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  category: Category;
  contentType: ContentType;
  duration: string;
  views: number;
  isFree: boolean;
  isNew: boolean;
  progress?: number;
  progressText?: string;
  publishedAt: string;
  resumeUpdatedAt?: string;
  tags: string[];
}

export interface EbookItem {
  id: string;
  slug: string;
  title: string;
  coverUrl: string;
  category: Category;
  pages: number;
  isFree: boolean;
  isNew: boolean;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string;
  readTime: string;
  publishedAt: string;
  category: Category;
  excerpt: string;
}

export interface HeroItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  category: Category;
  isFree: boolean;
  duration: string;
}

export const heroItems: HeroItem[] = [];
export const continueWatchingItems: ContentItem[] = [];
export const doencasItems: ContentItem[] = [];
export const transtornosItems: ContentItem[] = [];
export const curiosidadesItems: ContentItem[] = [];
export const ebookItems: EbookItem[] = [];
export const ebooksItems: EbookItem[] = [];
export const quizzesPreview: Array<{
  id: string;
  slug: string;
  title: string;
  category: Category;
  questions: number;
  difficulty: "Fácil" | "Médio" | "Difícil";
  thumbnailUrl: string;
  completed: boolean;
  score: number | null;
}> = [];
export const blogPosts: BlogPost[] = [];
export const recentItems: ContentItem[] = [];

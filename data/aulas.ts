export interface AulaRelacionada {
  id: string;
  slug: string;
  title: string;
  duration: string;
  thumbnailUrl: string;
  status: "assistido" | "em_progresso" | "nao_iniciado";
  progress?: number;
  isCurrent?: boolean;
}

export interface Material {
  id: string;
  title: string;
  type: "pdf" | "ebook";
  pages: number;
  fileUrl: string;
  coverUrl: string;
}

export interface QuizAula {
  id: string;
  slug: string;
  title: string;
  questions: number;
  completed: boolean;
  score?: number;
}

export interface AulaData {
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
  views: number;
  publishedAt: string;
  isFree: boolean;
  tags: string[];
  progress: number;
  serieSlug: string;
  serieTitle: string;
  materials: Material[];
  quiz: QuizAula | null;
  serieAulas: AulaRelacionada[];
}

export const aulasData: Record<string, AulaData> = {};

export function getAulaData(slug: string): AulaData | null {
  return aulasData[slug] ?? null;
}

export type Difficulty = "Fácil" | "Médio" | "Difícil";
export type QuizCategory = "doencas" | "transtornos" | "curiosidades";
export type QuizStatus = "nao_iniciado" | "em_progresso" | "concluido";

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctId: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  category: QuizCategory;
  difficulty: Difficulty;
  questions: QuizQuestion[];
  estimatedMinutes: number;
  status: QuizStatus;
  score?: number;
  completedAt?: string;
  attempts?: number;
}

export const quizzesData: Quiz[] = [];

export function getQuizBySlug(slug: string): Quiz | null {
  return quizzesData.find((q) => q.slug === slug) ?? null;
}

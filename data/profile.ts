import { badgesData } from "@/data/badges";

export interface ProfileStats {
  aulasConcluidas: number;
  quizzesRespondidos: number;
  storiesVistos: number;
  ebooksBaixados: number;
  streakDays: number;
  xp: number;
  memberSince: string;
}

export interface SavedContent {
  id: string;
  title: string;
  thumbnailUrl: string;
  type: "aula" | "ebook" | "quiz";
  category: "doencas" | "transtornos" | "curiosidades";
  slug: string;
  savedAt: string;
  progress?: number;
}

export interface WatchHistory {
  id: string;
  title: string;
  thumbnailUrl: string;
  slug: string;
  category: "doencas" | "transtornos" | "curiosidades";
  watchedAt: string;
  progress: number;
  duration: number;
}

export const PROFILE_STATS: ProfileStats = {
  aulasConcluidas: 0,
  quizzesRespondidos: 0,
  storiesVistos: 0,
  ebooksBaixados: 0,
  streakDays: 0,
  xp: 0,
  memberSince: new Date().toISOString(),
};

export const SAVED_CONTENT: SavedContent[] = [];
export const WATCH_HISTORY: WatchHistory[] = [];
export const UNLOCKED_BADGES = badgesData.filter(() => false);

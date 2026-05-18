export interface StoryItem {
  id: string;
  title: string;
  theme: string;
  thumbnailUrl: string;
  videoUrl?: string;
  duration: number;
  publishedAt: string;
  seen: boolean;
  category: "doencas" | "transtornos" | "curiosidades";
  reactions?: Record<string, number>;
}

export interface StoryGroup {
  id: string;
  authorName: string;
  authorAvatar: string;
  stories: StoryItem[];
}

export const storiesData: StoryItem[] = [];

export const STORY_AUTHOR = {
  name: "Dr. Marcelo",
  avatar: "",
};

export function getStoriesSorted(): StoryItem[] {
  return [...storiesData].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getUnseenCount(): number {
  return storiesData.filter((s) => !s.seen).length;
}

export function formatStoryTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Agora";
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

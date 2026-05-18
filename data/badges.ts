export type BadgeRarity = "comum" | "raro" | "epico" | "lendario";

export interface BadgeDefinition {
  id: string;
  label: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  xpReward: number;
  requirement: string;
  hint: string;
  category: "engajamento" | "aprendizado" | "consistencia" | "quiz" | "social";
  progress?: number;
  total?: number;
  unlockedAt?: string;
}

export interface UserLevel {
  name: string;
  minXp: number;
  maxXp: number;
  color: string;
  icon: string;
}

export const USER_LEVELS: UserLevel[] = [
  { name: "Iniciante", minXp: 0, maxXp: 100, color: "#64748B", icon: "🌱" },
  { name: "Aprendiz", minXp: 101, maxXp: 300, color: "#3B82F6", icon: "📖" },
  { name: "Estudante", minXp: 301, maxXp: 600, color: "#7C3AED", icon: "🎓" },
  { name: "Especialista", minXp: 601, maxXp: 1000, color: "#F59E0B", icon: "⭐" },
  { name: "Mestre", minXp: 1001, maxXp: Infinity, color: "#22C55E", icon: "🏆" },
];

export function getUserLevel(xp: number): UserLevel {
  return (
    USER_LEVELS.slice()
      .reverse()
      .find((l) => xp >= l.minXp) ?? USER_LEVELS[0]
  );
}

export function getNextLevel(xp: number): UserLevel | null {
  const idx = USER_LEVELS.findIndex((l) => xp >= l.minXp && xp <= l.maxXp);
  return USER_LEVELS[idx + 1] ?? null;
}

export function getXpToNextLevel(xp: number): number {
  const next = getNextLevel(xp);
  if (!next) return 0;
  return next.minXp - xp;
}

export function getLevelProgress(xp: number): number {
  const current = getUserLevel(xp);
  if (current.maxXp === Infinity) return 100;
  const range = current.maxXp - current.minXp;
  const earned = xp - current.minXp;
  return Math.min(Math.round((earned / range) * 100), 100);
}

export const XP_ACTIONS = {
  WATCH_LESSON: 20,
  COMPLETE_QUIZ: 15,
  PERFECT_QUIZ: 10,
  VIEW_STORY: 2,
  DAILY_ACCESS: 5,
  DOWNLOAD_EBOOK: 5,
};

export const badgesData: BadgeDefinition[] = [
  {
    id: "iniciante",
    label: "Iniciante",
    description: "Completou o cadastro na plataforma e começou sua jornada.",
    icon: "🌱",
    rarity: "comum",
    xpReward: 10,
    requirement: "Criar sua conta na plataforma",
    hint: "Finalize seu cadastro para desbloquear.",
    category: "engajamento",
  },
  {
    id: "primeira_aula",
    label: "Primeira Aula",
    description: "Assistiu à primeira aula completa na plataforma.",
    icon: "🎬",
    rarity: "comum",
    xpReward: 20,
    requirement: "Assistir 1 aula completa (90% ou mais)",
    hint: "Escolha qualquer aula gratuita e assista até o final.",
    category: "aprendizado",
  },
  {
    id: "maratonista",
    label: "Maratonista",
    description: "Assistiu a 5 aulas completas em um único dia. Dedicação total!",
    icon: "🏃",
    rarity: "raro",
    xpReward: 50,
    requirement: "Assistir 5 aulas completas em um único dia",
    hint: "Você já assistiu {progress} aulas hoje. Faltam {remaining}!",
    category: "aprendizado",
  },
  {
    id: "quiz_master",
    label: "Quiz Master",
    description: "Acertou 100% das respostas em qualquer quiz da plataforma.",
    icon: "🎯",
    rarity: "raro",
    xpReward: 35,
    requirement: "Obter 100% de acerto em qualquer quiz",
    hint: "Estude bem o conteúdo antes de tentar o quiz.",
    category: "quiz",
  },
  {
    id: "perfeito",
    label: "Perfeito",
    description: "Acertou 100% em 3 quizzes consecutivos. Extraordinário!",
    icon: "💎",
    rarity: "epico",
    xpReward: 75,
    requirement: "100% de acerto em 3 quizzes seguidos",
    hint: "Mantenha a sequência perfeita sem errar.",
    category: "quiz",
  },
  {
    id: "persistente",
    label: "Persistente",
    description: "Refez um quiz após errar e não desistiu. Isso é crescimento!",
    icon: "💪",
    rarity: "comum",
    xpReward: 15,
    requirement: "Refazer um quiz após não atingir 70%",
    hint: "Tente um quiz, erre e tente novamente.",
    category: "quiz",
  },
  {
    id: "leitor",
    label: "Leitor",
    description: "Baixou seu primeiro e-book da plataforma.",
    icon: "📚",
    rarity: "comum",
    xpReward: 10,
    requirement: "Baixar o primeiro e-book disponível",
    hint: "Acesse a seção de E-books e faça seu primeiro download.",
    category: "aprendizado",
  },
  {
    id: "assiduo",
    label: "Assíduo",
    description: "Acessou a plataforma por 7 dias seguidos. Constância é tudo!",
    icon: "🔥",
    rarity: "raro",
    xpReward: 50,
    requirement: "Acessar a plataforma por 7 dias consecutivos",
    hint: "Você está na sequência de {progress} dias. Continue!",
    category: "consistencia",
  },
  {
    id: "curioso",
    label: "Curioso",
    description: "Assistiu aulas de todas as categorias da plataforma.",
    icon: "🔭",
    rarity: "raro",
    xpReward: 40,
    requirement: "Assistir ao menos 1 aula de cada categoria",
    hint: "Explore Doenças, Transtornos e Curiosidades.",
    category: "aprendizado",
  },
  {
    id: "completo",
    label: "Completo",
    description: "Concluiu um módulo/série inteiro de aulas. Impressionante!",
    icon: "🎓",
    rarity: "epico",
    xpReward: 100,
    requirement: "Concluir todas as aulas de uma série",
    hint: "Escolha uma série e assista todas as aulas até o final.",
    category: "aprendizado",
  },
];

export const DEFAULT_USER_STATS = {
  xp: 0,
  aulasConcluidas: 0,
  quizzesRespondidos: 0,
  storiesVistos: 0,
  streakDays: 0,
  maxStreak: 0,
};

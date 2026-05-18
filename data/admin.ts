export interface AdminMetric {
  id: string;
  label: string;
  value: number | string;
  previousValue: number;
  currentValue: number;
  prefix?: string;
  suffix?: string;
  change: number;
  changeType: "positive" | "negative" | "neutral";
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: "gratuito" | "assinante";
  joinedAt: string;
  lastAccess: string;
  status: "ativo" | "inativo";
}

export interface AdminContent {
  id: string;
  title: string;
  category: "doencas" | "transtornos" | "curiosidades";
  type: "video" | "ebook" | "blog";
  status: "publicado" | "rascunho";
  publishedAt: string;
  views: number;
  thumbnailUrl: string;
}

export interface AdminSubscription {
  id: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  startDate: string;
  nextBilling: string;
  amount: number;
  status: "ativo" | "cancelado" | "suspenso" | "falhou";
}

export interface AdminQuiz {
  id: string;
  title: string;
  category: "doencas" | "transtornos" | "curiosidades";
  difficulty: "Fácil" | "Médio" | "Difícil";
  questions: number;
  attempts: number;
  avgScore: number;
  status: "publicado" | "rascunho";
}

export interface AdminStory {
  id: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  views: number;
  category: "doencas" | "transtornos" | "curiosidades";
  status: "publicado" | "arquivado";
  duration: number;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  target: "todos" | "assinantes" | "gratuitos";
  sentAt: string;
  sentTo: number;
  openRate: number;
}

export interface WeeklySubscriberData {
  week: string;
  novos: number;
  cancelamentos: number;
}

export interface TopContent {
  title: string;
  views: number;
  category: string;
}

export interface RecentActivity {
  id: string;
  type: "cadastro" | "assinatura" | "conteudo" | "cancelamento";
  description: string;
  time: string;
  icon: string;
}

// ── Supabase-ready empty state data ─────────────────────────

export const ADMIN_METRICS: AdminMetric[] = [
  {
    id: "total_users",
    label: "Total de Usuários",
    value: 0,
    previousValue: 0,
    currentValue: 0,
    change: 0,
    changeType: "neutral",
  },
  {
    id: "active_subscribers",
    label: "Assinantes Ativos",
    value: 0,
    previousValue: 0,
    currentValue: 0,
    change: 0,
    changeType: "neutral",
  },
  {
    id: "mrr",
    label: "Receita do Mês",
    value: "R$0",
    previousValue: 0,
    currentValue: 0,
    prefix: "R$",
    change: 0,
    changeType: "neutral",
  },
  {
    id: "lessons",
    label: "Aulas Publicadas",
    value: 0,
    previousValue: 0,
    currentValue: 0,
    change: 0,
    changeType: "neutral",
  },
  {
    id: "stories",
    label: "Stories Publicados",
    value: 0,
    previousValue: 0,
    currentValue: 0,
    change: 0,
    changeType: "neutral",
  },
  {
    id: "quizzes",
    label: "Quizzes Criados",
    value: 0,
    previousValue: 0,
    currentValue: 0,
    change: 0,
    changeType: "neutral",
  },
];

export const WEEKLY_SUBSCRIBERS: WeeklySubscriberData[] = [];
export const TOP_CONTENTS: TopContent[] = [];
export const RECENT_ACTIVITIES: RecentActivity[] = [];
export const ADMIN_USERS: AdminUser[] = [];
export const ADMIN_CONTENTS: AdminContent[] = [];
export const ADMIN_SUBSCRIPTIONS: AdminSubscription[] = [];
export const ADMIN_QUIZZES: AdminQuiz[] = [];
export const ADMIN_STORIES: AdminStory[] = [];
export const ADMIN_NOTIFICATIONS: AdminNotification[] = [];

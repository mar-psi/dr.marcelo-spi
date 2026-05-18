"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CreditCard,
  DollarSign,
  HelpCircle,
  Layers,
  PlayCircle,
  Users,
} from "lucide-react";
import { MetricCard } from "@/components/admin/MetricCard";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AdminMetric, RecentActivity, TopContent } from "@/data/admin";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type ContentRow = Database["public"]["Tables"]["content_items"]["Row"];
type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payment_transactions"]["Row"];
type ProgressRow = Database["public"]["Tables"]["lesson_progress"]["Row"];
type StoryViewRow = Database["public"]["Tables"]["story_views"]["Row"];

const metricIcons = [Users, CreditCard, DollarSign, PlayCircle, Layers, HelpCircle];
const metricColors = ["#7C3AED", "#3B82F6", "#22C55E", "#F59E0B", "#EC4899", "#06B6D4"];

const activityTypeColor: Record<string, string> = {
  cadastro: "bg-blue-500/20 text-blue-400",
  assinatura: "bg-status-successBg text-status-success",
  conteudo: "bg-accent-primary/20 text-accent-secondary",
  cancelamento: "bg-status-errorBg text-status-error",
};

function formatCurrencyFromCents(value: number) {
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatRelative(dateString: string | null) {
  if (!dateString) return "Agora";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.round(hours / 24);
  return `${days}d atrás`;
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

export default function AdminDashboard() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminMetric[]>([]);
  const [topContents, setTopContents] = useState<TopContent[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);

      const [
        profilesResponse,
        subscriptionsResponse,
        contentsResponse,
        storiesResponse,
        quizzesResponse,
        paymentsResponse,
        progressResponse,
        storyViewsResponse,
      ] = await Promise.all([
        supabase.from("profiles").select("id,email,full_name,avatar_url,role,created_at,updated_at"),
        supabase
          .from("subscriptions")
          .select(
            "id,user_id,plan_id,status,current_period_start,current_period_end,cancel_at_period_end,provider,provider_customer_id,provider_subscription_id,external_reference,provider_plan_id,provider_status,provider_payment_method,provider_payer_email,provider_checkout_url,last_payment_id,last_payment_status,last_event_at,cancelled_at,paused_at,cancellation_reason,metadata,created_at,updated_at"
          ),
        supabase
          .from("content_items")
          .select(
            "id,slug,title,description,type,category,status,access,thumbnail_path,thumbnail_url,video_path,video_url,duration_seconds,published_at,created_by,created_at,updated_at,body"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("stories")
          .select(
            "id,title,theme,category,status,access,media_path,thumbnail_path,duration_seconds,reactions,published_at,expires_at,created_by,created_at,updated_at"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("quizzes")
          .select(
            "id,content_id,slug,title,description,category,status,access,difficulty,estimated_minutes,thumbnail_path,created_by,published_at,created_at,updated_at"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("payment_transactions")
          .select(
            "id,subscription_id,user_id,provider,provider_payment_id,provider_authorized_payment_id,external_reference,description,amount_cents,currency_id,status,payment_method,installments,due_date,paid_at,invoice_url,receipt_url,metadata,created_at,updated_at"
          )
          .order("created_at", { ascending: false }),
        supabase.from("lesson_progress").select("user_id,content_id,progress_seconds,completed_at,updated_at"),
        supabase.from("story_views").select("story_id,user_id,seen_at"),
      ]);

      if (!active) return;
      if (
        profilesResponse.error ||
        subscriptionsResponse.error ||
        contentsResponse.error ||
        storiesResponse.error ||
        quizzesResponse.error ||
        paymentsResponse.error ||
        progressResponse.error ||
        storyViewsResponse.error
      ) {
        setMetrics([]);
        setTopContents([]);
        setRecentActivities([]);
        setLoading(false);
        return;
      }

      const profiles = (profilesResponse.data ?? []) as ProfileRow[];
      const subscriptions = (subscriptionsResponse.data ?? []) as SubscriptionRow[];
      const contents = (contentsResponse.data ?? []) as ContentRow[];
      const stories = (storiesResponse.data ?? []) as StoryRow[];
      const quizzes = (quizzesResponse.data ?? []) as QuizRow[];
      const payments = (paymentsResponse.data ?? []) as PaymentRow[];
      const progressRows = (progressResponse.data ?? []) as ProgressRow[];
      const storyViews = (storyViewsResponse.data ?? []) as StoryViewRow[];
      const viewsByContent = new Map<string, number>();
      progressRows.forEach((progress) => {
        viewsByContent.set(progress.content_id, (viewsByContent.get(progress.content_id) ?? 0) + 1);
      });

      const activeSubscribers = subscriptions.filter(
        (subscription) =>
          subscription.status === "active" ||
          subscription.status === "trialing" ||
          (subscription.status === "cancelled" &&
            subscription.current_period_end &&
            new Date(subscription.current_period_end).getTime() > Date.now())
      ).length;

      const currentMonthKey = new Date().toISOString().slice(0, 7);
      const monthRevenueCents = payments
        .filter((payment) => payment.status === "approved" && payment.paid_at?.slice(0, 7) === currentMonthKey)
        .reduce((sum, payment) => sum + payment.amount_cents, 0);

      const publishedLessons = contents.filter(
        (content) => content.type === "lesson" && content.status === "published"
      ).length;
      const publishedStories = stories.filter((story) => story.status === "published").length;
      const totalStoryViews = storyViews.length;
      const publishedQuizzes = quizzes.filter((quiz) => quiz.status === "published").length;

      setMetrics([
        {
          id: "total_users",
          label: "Total de Usuários",
          value: profiles.length,
          previousValue: profiles.length,
          currentValue: profiles.length,
          change: 0,
          changeType: "neutral",
        },
        {
          id: "active_subscribers",
          label: "Assinantes Ativos",
          value: activeSubscribers,
          previousValue: activeSubscribers,
          currentValue: activeSubscribers,
          change: 0,
          changeType: "neutral",
        },
        {
          id: "mrr",
          label: "Receita do Mês",
          value: formatCurrencyFromCents(monthRevenueCents),
          previousValue: monthRevenueCents,
          currentValue: monthRevenueCents,
          prefix: "R$",
          change: 0,
          changeType: "neutral",
        },
        {
          id: "lessons",
          label: "Aulas Publicadas",
          value: publishedLessons,
          previousValue: publishedLessons,
          currentValue: publishedLessons,
          change: 0,
          changeType: "neutral",
        },
        {
          id: "stories",
          label: "Stories / Views",
          value: `${publishedStories} / ${totalStoryViews}`,
          previousValue: publishedStories,
          currentValue: publishedStories,
          change: 0,
          changeType: "neutral",
        },
        {
          id: "quizzes",
          label: "Quizzes Criados",
          value: publishedQuizzes,
          previousValue: publishedQuizzes,
          currentValue: publishedQuizzes,
          change: 0,
          changeType: "neutral",
        },
      ]);

      setTopContents(
        contents
          .filter((content) => content.type === "lesson" && content.status === "published")
          .slice(0, 5)
          .map((content) => ({
            title: content.title,
            views: viewsByContent.get(content.id) ?? 0,
            category: content.category,
          }))
      );

      const profileActivities: RecentActivity[] = profiles
        .slice()
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
        .slice(0, 2)
        .map((profile) => ({
          id: `profile-${profile.id}`,
          type: "cadastro",
          description: `${profile.full_name ?? profile.email ?? "Usuário"} entrou na plataforma`,
          time: formatRelative(profile.created_at),
          icon: "👤",
        }));

      const subscriptionActivities: RecentActivity[] = subscriptions
        .slice()
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
        .slice(0, 2)
        .map((subscription) => ({
          id: `subscription-${subscription.id}`,
          type: subscription.status === "cancelled" ? "cancelamento" : "assinatura",
          description:
            subscription.status === "cancelled"
              ? "Uma assinatura foi cancelada"
              : "Nova assinatura registrada",
          time: formatRelative(subscription.created_at),
          icon: subscription.status === "cancelled" ? "❌" : "💳",
        }));

      const contentActivities: RecentActivity[] = contents
        .slice(0, 3)
        .map((content) => ({
          id: `content-${content.id}`,
          type: "conteudo",
          description: `${content.title} foi ${content.status === "published" ? "publicado" : "atualizado"}`,
          time: formatRelative(content.updated_at),
          icon: content.type === "ebook" ? "📘" : "🎬",
        }));

      setRecentActivities(
        [...profileActivities, ...subscriptionActivities, ...contentActivities]
          .slice(0, 7)
      );
      setLoading(false);
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [supabase]);

  const topContentSummary = useMemo(
    () => (topContents.length > 0 ? topContents : []),
    [topContents]
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-5 py-6 lg:px-8">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Dashboard</h1>
          <p className="text-sm text-content-secondary">
            Visão geral da plataforma baseada no Supabase.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {metrics.map((metric, index) => (
            <MetricCard
              key={metric.id}
              metric={metric}
              index={index}
              icon={metricIcons[index]}
              iconColor={metricColors[index]}
            />
          ))}
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <FadeIn delay={0.1}>
          <div className="rounded-2xl border border-border-subtle bg-background-secondary p-6">
            <h2 className="text-base font-bold text-content-primary">Aulas em destaque</h2>
            <p className="mt-1 text-xs text-content-secondary">Conteúdo publicado mais recente</p>
            <div className="mt-6 space-y-3">
              {topContentSummary.length > 0 ? (
                topContentSummary.map((content, index) => (
                  <div
                    key={`${content.title}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-border-subtle bg-background-tertiary/40 px-4 py-3"
                  >
                    <span className="w-5 shrink-0 text-center text-xs font-bold text-content-disabled">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-content-primary">{content.title}</p>
                      <p className="text-xs text-content-secondary">{content.category}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border-subtle px-4 py-6 text-sm text-content-secondary">
                  Nenhuma aula publicada ainda.
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.12}>
          <div className="rounded-2xl border border-border-subtle bg-background-secondary p-5">
            <div className="mb-5 flex items-center gap-2">
              <Activity size={16} className="text-accent-primary" />
              <h2 className="text-base font-bold text-content-primary">Atividades Recentes</h2>
            </div>
            <div className="space-y-1">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + index * 0.05 }}
                    className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-background-tertiary"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${activityTypeColor[activity.type] ?? "bg-background-tertiary"}`}
                    >
                      {activity.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-content-primary">
                        {activity.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-content-disabled">{activity.time}</span>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border-subtle px-4 py-6 text-sm text-content-secondary">
                  Nenhuma atividade recente encontrada.
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </div>

      {loading && (
        <div className="rounded-2xl border border-border-subtle bg-background-secondary px-4 py-10 text-center text-sm text-content-secondary">
          Carregando métricas do painel...
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Shield,
  Mail,
  Sparkles,
  HelpCircle,
  MessageSquare,
  Star,
} from "lucide-react";
import { PLAN } from "@/data/subscription";
import { PlanCard } from "@/components/subscription/PlanCard";
import { SubscriptionManager } from "@/components/subscription/SubscriptionManager";
import { TestimonialsSection } from "@/components/subscription/TestimonialsSection";
import { FAQSection } from "@/components/subscription/FAQSection";
import { useSubscription } from "@/hooks/useSubscription";
import { createCheckoutSession } from "@/lib/subscription-helpers";

function FadeIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.45 }}
    >
      {children}
    </motion.div>
  );
}

/* ── Non-subscriber view ────────────────────────────────── */
function NonSubscriberView() {
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setCheckoutError(null);

    try {
      const { url } = await createCheckoutSession(
        PLAN.id,
        "",
        `${window.location.origin}/assinatura?checkout=success`,
        `${window.location.origin}/assinatura?checkout=cancelled`
      );
      window.location.assign(url);
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Checkout ainda nao configurado. Conecte o gateway de pagamento antes de vender assinaturas."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-20 pb-24 lg:pb-12">

      {/* ── Hero ─────────────────────────────────────── */}
      <FadeIn>
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E0A4A] via-[#13132A] to-background-primary border border-accent-primary/20 px-6 py-14 lg:py-20 text-center">
          {/* Blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-accent-primary/20 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-72 h-48 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-primary/20 border border-accent-primary/40 text-xs font-semibold text-accent-secondary mb-5"
            >
              <Sparkles size={12} />
              Acesso completo por apenas R$15/mês
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl lg:text-5xl font-bold text-content-primary leading-tight mb-4"
            >
              Domine a{" "}
              <span className="text-gradient-purple">Saúde Mental</span>{" "}
              com o Dr. Marcelo
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-base lg:text-lg text-content-secondary leading-relaxed mb-8 max-w-xl mx-auto"
            >
              Conteúdo científico, educativo e acessível sobre psiquiatria.
              Aulas, e-books, quizzes e stories — tudo em um único lugar.
            </motion.p>

            {/* Social proof numbers */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 mb-10"
            >
              {[
                { value: "2.400+", label: "Assinantes" },
                { value: "50+", label: "Aulas" },
                { value: "4.9★", label: "Avaliação" },
                { value: "R$15", label: "por mês" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-bold text-content-primary">{value}</p>
                  <p className="text-xs text-content-secondary">{label}</p>
                </div>
              ))}
            </motion.div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-accent-primary text-white font-bold text-base shadow-glow hover:bg-accent-primaryHover hover:shadow-glowStrong transition-all duration-200 disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Assinar agora — R$15/mês
                  </>
                )}
              </button>
              <Link
                href="/aulas"
                className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-background-secondary border border-border-subtle text-content-secondary hover:text-content-primary hover:border-accent-primary/40 font-medium text-base transition-all"
              >
                Ver conteúdo grátis
              </Link>
            </div>
            {checkoutError && (
              <p className="mt-4 text-sm text-status-warning">{checkoutError}</p>
            )}

            {/* Trust */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="flex items-center gap-1.5 text-xs text-content-disabled">
                <Shield size={12} />
                <span>Pagamento seguro</span>
              </div>
              <span className="text-content-disabled">·</span>
              <p className="text-xs text-content-disabled">
                Cancele quando quiser
              </p>
              <span className="text-content-disabled">·</span>
              <p className="text-xs text-content-disabled">Sem fidelidade</p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── Plan card ─────────────────────────────── */}
      <FadeIn delay={0.05}>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-content-primary mb-2">
              Escolha seu plano
            </h2>
            <p className="text-sm text-content-secondary">
              Um único plano, sem letras miúdas, sem pegadinhas.
            </p>
          </div>
          <PlanCard
            plan={PLAN}
            isSubscriber={false}
            onSubscribe={handleSubscribe}
          />
        </div>
      </FadeIn>

      {/* ── What's included detailed ─────────────── */}
      <FadeIn delay={0.05}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-content-primary mb-2">
              O que está incluído
            </h2>
            <p className="text-sm text-content-secondary">
              Tudo que você precisa para entender saúde mental de verdade
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: "🎬",
                title: "Aulas em vídeo",
                desc: "Aulas completas sobre doenças, transtornos e tratamentos com linguagem científica e acessível.",
              },
              {
                icon: "📚",
                title: "E-books e PDFs",
                desc: "Materiais de apoio para aprofundar o estudo, baixe e leve para qualquer lugar.",
              },
              {
                icon: "🎯",
                title: "Quizzes interativos",
                desc: "Teste seus conhecimentos, receba feedback detalhado e acompanhe sua evolução.",
              },
              {
                icon: "📱",
                title: "Stories diários",
                desc: "Conteúdo curto e direto todo dia com curiosidades e dicas do Dr. Marcelo.",
              },
              {
                icon: "🏆",
                title: "Gamificação",
                desc: "Ganhe XP, suba de nível e desbloqueie badges por cada conquista na plataforma.",
              },
              {
                icon: "📰",
                title: "Blog e artigos",
                desc: "Artigos aprofundados sobre os temas mais relevantes da psiquiatria moderna.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-background-secondary border border-border-subtle hover:border-accent-primary/30 transition-colors"
              >
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-bold text-content-primary mb-1">
                    {item.title}
                  </p>
                  <p className="text-xs text-content-secondary leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ── Testimonials ─────────────────────────── */}
      <FadeIn>
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-content-primary mb-2">
              O que dizem os assinantes
            </h2>
            <div className="flex items-center justify-center gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
              ))}
              <span className="text-sm text-content-secondary ml-2">
                4.9 de 5 — 2.400+ avaliações
              </span>
            </div>
          </div>
          <TestimonialsSection />
        </div>
      </FadeIn>

      {/* ── FAQ ──────────────────────────────────── */}
      <FadeIn>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <HelpCircle size={20} className="text-accent-primary" />
              <h2 className="text-2xl font-bold text-content-primary">
                Perguntas frequentes
              </h2>
            </div>
            <p className="text-sm text-content-secondary">
              Ainda tem dúvidas? Confira as perguntas mais comuns.
            </p>
          </div>
          <FAQSection />
        </div>
      </FadeIn>

      {/* ── Bottom CTA ───────────────────────────── */}
      <FadeIn>
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-accent-primary/20 via-background-tertiary to-background-secondary border border-accent-primary/25 p-8 lg:p-12 text-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-accent-primary/15 blur-3xl rounded-full" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-content-primary mb-3">
              Comece agora por R$15/mês
            </h2>
            <p className="text-sm text-content-secondary mb-6 max-w-md mx-auto">
              Junte-se a mais de 2.400 pessoas que já transformaram seu
              conhecimento sobre saúde mental.
            </p>
            <button
              onClick={handleSubscribe}
              className="inline-flex items-center gap-2 h-14 px-10 rounded-2xl bg-accent-primary text-white font-bold text-base shadow-glow hover:bg-accent-primaryHover hover:shadow-glowStrong transition-all"
            >
              <Sparkles size={18} />
              Assinar agora
            </button>
            <p className="text-xs text-content-disabled mt-3">
              Cancele quando quiser · Sem taxa de cancelamento
            </p>
          </div>
        </div>
      </FadeIn>

      {/* ── Support ──────────────────────────────── */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
          <div className="flex items-center gap-2 text-sm text-content-secondary">
            <MessageSquare size={16} className="text-accent-secondary" />
            <span>Alguma dúvida?</span>
          </div>
          <a
            href="mailto:psiquefotmiga@hotmail.com"
            className="flex items-center gap-2 text-sm text-accent-secondary hover:text-accent-primary transition-colors font-medium"
          >
            <Mail size={16} />
            psiquefotmiga@hotmail.com
          </a>
        </div>
      </FadeIn>
    </div>
  );
}

/* ── Subscriber view ────────────────────────────────────── */
function SubscriberView() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-24 lg:pb-12">
      {/* Header */}
      <FadeIn>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-content-primary mb-1">
              Minha Assinatura
            </h1>
            <p className="text-sm text-content-secondary">
              Gerencie seu plano, cobranças e preferências.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-successBg border border-[rgba(34,197,94,0.3)]">
            <CheckCircle2 size={13} className="text-status-success" />
            <span className="text-xs font-semibold text-status-success">
              Assinante ativo
            </span>
          </div>
        </div>
      </FadeIn>

      {/* Subscription manager */}
      <FadeIn delay={0.1}>
        <SubscriptionManager />
      </FadeIn>

      {/* Plan card compact */}
      <FadeIn delay={0.15}>
        <div>
          <h2 className="text-base font-bold text-content-primary mb-3">
            Seu plano atual
          </h2>
          <PlanCard plan={PLAN} isSubscriber compact />
        </div>
      </FadeIn>

      {/* Support */}
      <FadeIn delay={0.2}>
        <div className="flex items-center gap-2 text-sm text-content-secondary">
          <Mail size={15} className="text-accent-secondary" />
          <span>Precisa de ajuda?</span>
          <a
            href="mailto:psiquefotmiga@hotmail.com"
            className="text-accent-secondary hover:text-accent-primary transition-colors font-medium"
          >
            psiquefotmiga@hotmail.com
          </a>
        </div>
      </FadeIn>
    </div>
  );
}

/* ── Main export ────────────────────────────────────────── */
export default function AssinaturaPage() {
  const { isSubscriber, loading } = useSubscription();

  if (loading) {
    return (
      <div className="px-4 lg:px-6 py-6 max-w-[1400px] mx-auto">
        <div className="h-40 rounded-2xl bg-background-secondary border border-border-subtle animate-pulse" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1400px] mx-auto">
      {isSubscriber ? <SubscriberView /> : <NonSubscriberView />}
    </div>
  );
}

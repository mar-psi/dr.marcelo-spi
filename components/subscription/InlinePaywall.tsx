"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Lock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
} from "lucide-react";
import Link from "next/link";

interface InlinePaywallProps {
  title?: string;
  description?: string;
  type?: string;
  compact?: boolean;
}

const MINI_FEATURES = [
  "Acesso a todas as aulas",
  "E-books e PDFs",
  "Quizzes interativos",
  "Stories diários",
];

export function InlinePaywall({
  title = "Conteúdo exclusivo para assinantes",
  description = "Assine por R$15/mês e tenha acesso completo.",
  type = "aula",
  compact = false,
}: InlinePaywallProps) {
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[rgba(124,58,237,0.08)] border border-accent-primary/25"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center shrink-0">
            <Lock size={14} className="text-accent-secondary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-content-primary truncate">
              {title}
            </p>
            <p className="text-xs text-content-secondary">{description}</p>
          </div>
        </div>
        <Link href="/assinatura">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-primary text-white text-xs font-bold shadow-glow hover:bg-accent-primaryHover transition-colors shrink-0"
          >
            Assinar
            <ArrowRight size={12} />
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl border border-accent-primary/30 bg-gradient-to-br from-[rgba(124,58,237,0.12)] to-background-secondary overflow-hidden p-6 lg:p-8 text-center"
    >
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-accent-primary/15 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="w-14 h-14 rounded-2xl bg-accent-primary/20 border border-accent-primary/40 flex items-center justify-center mx-auto mb-4"
        >
          <Lock size={22} className="text-accent-secondary" />
        </motion.div>

        {/* Text */}
        <h3 className="text-xl font-bold text-content-primary mb-2">{title}</h3>
        <p className="text-sm text-content-secondary mb-6 max-w-md mx-auto">
          {description}
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto mb-6 text-left">
          {MINI_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-status-success shrink-0" />
              <span className="text-xs text-content-secondary">{f}</span>
            </div>
          ))}
        </div>

        {/* Price + CTA */}
        <div className="mb-4">
          <div className="flex items-end justify-center gap-1 mb-1">
            <span className="text-sm text-content-secondary">R$</span>
            <span className="text-4xl font-bold text-gradient-purple leading-none">15</span>
            <span className="text-sm text-content-secondary mb-1">/mês</span>
          </div>
        </div>

        <Link href="/assinatura">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-accent-primary text-white font-bold text-sm shadow-glow hover:bg-accent-primaryHover transition-all"
          >
            <Sparkles size={15} />
            Assinar agora
            <ArrowRight size={15} />
          </motion.div>
        </Link>

        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-content-disabled">
          <Shield size={11} />
          <span>Pagamento seguro · Cancele quando quiser</span>
        </div>
      </div>
    </motion.div>
  );
}

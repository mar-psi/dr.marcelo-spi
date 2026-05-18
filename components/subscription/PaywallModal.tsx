"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lock,
  CheckCircle2,
  ArrowRight,
  Shield,
  Star,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { PLAN } from "@/data/subscription";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentTitle?: string;
  contentType?: "aula" | "ebook" | "quiz" | "story";
}

const contentMessages: Record<string, string> = {
  aula: "Esta aula é exclusiva para assinantes.",
  ebook: "Este e-book é exclusivo para assinantes.",
  quiz: "Este quiz é exclusivo para assinantes.",
  story: "Este story é exclusivo para assinantes.",
};

const MINI_BENEFITS = [
  "Todas as aulas sem limite",
  "E-books e PDFs para download",
  "Quizzes com feedback detalhado",
  "Stories diários do Dr. Marcelo",
  "Novos conteúdos toda semana",
  "Gamificação e badges exclusivos",
];

export function PaywallModal({
  isOpen,
  onClose,
  contentTitle,
  contentType = "aula",
}: PaywallModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-md bg-background-secondary border border-border-subtle rounded-2xl shadow-card overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Gradient header */}
            <div className="relative h-32 bg-gradient-to-br from-[#4C1D95] via-accent-primary to-[#1E1B4B] overflow-hidden">
              {/* Blobs */}
              <div className="absolute -top-8 -left-8 w-40 h-40 bg-accent-secondary/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl" />

              {/* Lock icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                  className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm"
                >
                  <Lock size={24} className="text-white" />
                </motion.div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-colors"
                aria-label="Fechar"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pt-6 pb-6">
              {/* Title */}
              <div className="text-center mb-5">
                <h2 className="text-xl font-bold text-content-primary mb-2">
                  {contentMessages[contentType]}
                </h2>
                {contentTitle && (
                  <p className="text-sm text-content-secondary">
                    <span className="text-accent-secondary font-semibold">
                      &quot;{contentTitle}&quot;
                    </span>{" "}
                    e muito mais com o plano mensal.
                  </p>
                )}
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {MINI_BENEFITS.map((b, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2
                      size={13}
                      className="text-status-success shrink-0 mt-0.5"
                    />
                    <span className="text-xs text-content-secondary leading-snug">
                      {b}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price card */}
              <div className="relative rounded-xl border border-accent-primary/30 bg-[rgba(124,58,237,0.08)] p-4 mb-5 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/5 to-transparent pointer-events-none" />
                <p className="text-xs text-content-secondary mb-1 relative z-10">
                  Plano Mensal · Acesso completo
                </p>
                <div className="flex items-end justify-center gap-1 relative z-10">
                  <span className="text-sm text-content-secondary font-medium">R$</span>
                  <span className="text-5xl font-bold text-gradient-purple leading-none">
                    15
                  </span>
                  <span className="text-sm text-content-secondary mb-1">/mês</span>
                </div>
                <p className="text-xs text-content-disabled mt-1 relative z-10">
                  Cancele quando quiser · Sem fidelidade
                </p>
              </div>

              {/* CTA */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                rightIcon={<ArrowRight size={16} />}
                asChild
              >
                <Link href="/assinatura">Assinar agora — R$15/mês</Link>
              </Button>

              {/* Secondary actions */}
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={onClose}
                  className="text-xs text-content-disabled hover:text-content-secondary transition-colors"
                >
                  Talvez mais tarde
                </button>
                <div className="flex items-center gap-1 text-xs text-content-disabled">
                  <Shield size={11} />
                  <span>Pagamento seguro</span>
                </div>
              </div>

              {/* Social proof */}
              <div className="mt-4 flex items-center justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className="text-yellow-400 fill-yellow-400"
                  />
                ))}
                <span className="text-xs text-content-secondary ml-1">
                  +2.400 assinantes satisfeitos
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

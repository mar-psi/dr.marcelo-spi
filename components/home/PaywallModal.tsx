"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentTitle?: string;
}

const benefits = [
  "Acesso ilimitado a todas as aulas",
  "E-books e materiais de apoio",
  "Quizzes interativos com feedback",
  "Stories diários do Dr. Marcelo",
  "Novos conteúdos toda semana",
  "Gamificação e badges exclusivos",
];

export function PaywallModal({ isOpen, onClose, contentTitle }: PaywallModalProps) {
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
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Gradient header */}
            <div className="relative h-28 bg-gradient-to-br from-accent-primary via-[#5B21B6] to-[#1E1B4B] flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <Lock size={24} className="text-white" />
              </div>
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
              {/* Glow blobs */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-16 bg-accent-primary/30 blur-2xl rounded-full" />
            </div>

            {/* Body */}
            <div className="px-6 pt-8 pb-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-content-primary mb-2">
                  Conteúdo exclusivo para assinantes
                </h2>
                {contentTitle && (
                  <p className="text-sm text-content-secondary">
                    <span className="text-accent-secondary font-medium">&quot;{contentTitle}&quot;</span> e muito mais
                    estão disponíveis no plano mensal.
                  </p>
                )}
                {!contentTitle && (
                  <p className="text-sm text-content-secondary">
                    Acesse todo o conteúdo da plataforma por apenas R$15/mês.
                  </p>
                )}
              </div>

              {/* Benefits */}
              <ul className="space-y-2 mb-6">
                {benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-sm text-content-secondary">
                    <CheckCircle2 size={15} className="text-status-success shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>

              {/* Price highlight */}
              <div className="bg-background-tertiary rounded-xl p-4 mb-5 text-center border border-accent-primary/20">
                <p className="text-xs text-content-secondary mb-1">Plano Mensal</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xs text-content-secondary">R$</span>
                  <span className="text-4xl font-bold text-gradient-purple">15</span>
                  <span className="text-sm text-content-secondary">/mês</span>
                </div>
                <p className="text-xs text-content-disabled mt-1">Cancele quando quiser</p>
              </div>

              {/* CTA */}
              <Button variant="primary" size="lg" fullWidth asChild>
                <Link href="/assinatura">Assinar agora — R$15/mês</Link>
              </Button>

              <button
                onClick={onClose}
                className="w-full text-center mt-3 text-xs text-content-disabled hover:text-content-secondary transition-colors"
              >
                Talvez mais tarde
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

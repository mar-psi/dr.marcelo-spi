"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const FLOATING_WORDS = [
  "Depressão", "Ansiedade", "TDAH", "Bipolar",
  "TCC", "DSM-5", "Esquizofrenia", "TOC",
  "Psicoterapia", "Neurociência", "Mindfulness",
  "Pânico", "Burnout", "Lítio", "Serotonina",
];

function FloatingWord({
  word,
  style,
}: {
  word: string;
  style: React.CSSProperties;
}) {
  return (
    <motion.span
      className="absolute text-xs font-medium text-accent-primary/20 select-none pointer-events-none whitespace-nowrap"
      style={style}
      animate={{
        y: [0, -18, 0],
        opacity: [0.15, 0.35, 0.15],
      }}
      transition={{
        duration: Math.random() * 4 + 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: Math.random() * 3,
      }}
    >
      {word}
    </motion.span>
  );
}

const wordPositions: React.CSSProperties[] = [
  { top: "8%", left: "5%" },
  { top: "15%", left: "82%" },
  { top: "28%", left: "12%" },
  { top: "22%", left: "70%" },
  { top: "45%", left: "3%" },
  { top: "50%", left: "88%" },
  { top: "62%", left: "15%" },
  { top: "68%", left: "75%" },
  { top: "78%", left: "7%" },
  { top: "82%", left: "85%" },
  { top: "90%", left: "20%" },
  { top: "92%", left: "65%" },
  { top: "35%", left: "88%" },
  { top: "55%", left: "60%" },
  { top: "73%", left: "45%" },
];

export function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background-primary flex">

      {/* ── Left panel — decorative ─────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-gradient-to-br from-[#0D0A1A] via-background-primary to-[#0A0F1A]">

        {/* Animated words */}
        {FLOATING_WORDS.map((word, i) => (
          <FloatingWord
            key={word}
            word={word}
            style={wordPositions[i % wordPositions.length]}
          />
        ))}

        {/* Blobs */}
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-accent-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(124,58,237,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-12 text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-glow">
                <Brain size={28} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-content-primary leading-tight mb-3">
              Dr. Marcelo
              <span className="text-gradient-purple">Psiquiatra</span>
            </h1>
            <p className="text-base text-content-secondary max-w-xs leading-relaxed">
              Psiquiatria científica e acessível para quem quer entender a saúde mental de verdade.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-3 w-full max-w-xs"
          >
            {[
              { icon: "🎬", label: "50+ aulas em vídeo" },
              { icon: "🎯", label: "18 quizzes interativos" },
              { icon: "📚", label: "E-books e PDFs exclusivos" },
              { icon: "🏆", label: "2.400+ assinantes ativos" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background-secondary/60 border border-border-subtle backdrop-blur-sm"
              >
                <span className="text-xl shrink-0">{item.icon}</span>
                <span className="text-sm text-content-secondary">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 px-12 pb-6 text-center">
          <p className="text-xs text-content-disabled">
            © 2026 Dr. Marcelo Psiquiatra · Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────── */}
      <div className="flex flex-col flex-1 lg:max-w-[480px] lg:min-w-[480px] relative bg-background-primary lg:bg-background-secondary lg:border-l lg:border-border-subtle">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-center pt-8 pb-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
              <Brain size={18} className="text-white" />
            </div>
            <span className="text-base font-bold text-content-primary">
              Dr. Marcelo <span className="text-accent-secondary">Psiquiatra</span>
            </span>
          </Link>
        </div>

        {/* Form area */}
        <div className="flex flex-col flex-1 items-center justify-center px-6 py-8">
          <motion.div
            className="w-full max-w-[360px]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-content-primary mb-2">{title}</h2>
              <p className="text-sm text-content-secondary">{subtitle}</p>
            </div>

            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}


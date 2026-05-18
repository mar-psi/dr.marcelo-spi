"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { heroItems } from "@/data/content";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const categoryVariant: Record<string, "doencas" | "transtornos" | "curiosidades"> = {
  doencas: "doencas",
  transtornos: "transtornos",
  curiosidades: "curiosidades",
};

const categoryLabel: Record<string, string> = {
  doencas: "Doenças",
  transtornos: "Transtornos",
  curiosidades: "Curiosidades",
};

export function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const hasItems = heroItems.length > 0;

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const goNext = useCallback(() => {
    if (!hasItems) return;
    setCurrent((prev) => (prev + 1) % heroItems.length);
  }, [hasItems]);

  const goPrev = useCallback(() => {
    if (!hasItems) return;
    setCurrent((prev) => (prev - 1 + heroItems.length) % heroItems.length);
  }, [hasItems]);

  // Auto rotate
  useEffect(() => {
    if (paused || !hasItems) return;
    const interval = setInterval(goNext, 6000);
    return () => clearInterval(interval);
  }, [paused, goNext, hasItems]);

  const item = heroItems[current];

  if (!item) {
    return (
      <div className="relative w-full overflow-hidden bg-background-secondary border-b border-border-subtle">
        <div className="px-6 lg:px-12 py-16 lg:py-24 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-secondary mb-3">
            Plataforma pronta
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold text-content-primary leading-tight mb-3">
            Cadastre o primeiro conteúdo no painel admin
          </h1>
          <p className="text-sm lg:text-base text-content-secondary max-w-xl">
            As aulas, quizzes, e-books e stories agora devem vir do Supabase. Nenhum conteúdo demonstrativo está sendo exibido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: "21/9", minHeight: 320, maxHeight: 600 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background images */}
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(10,10,15,0.95)] via-[rgba(10,10,15,0.6)] to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,15,0.9)] via-transparent to-[rgba(10,10,15,0.2)]" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`content-${current}`}
          className="absolute inset-0 flex items-end lg:items-center"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="px-6 lg:px-12 pb-16 lg:pb-0 max-w-xl">
            {/* Badge */}
            <div className="mb-3">
              <Badge variant={categoryVariant[item.category]} overImage>
                {categoryLabel[item.category]}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold text-content-primary leading-tight mb-3 drop-shadow-lg">
              {item.title}
            </h1>

            {/* Description */}
            <p className="text-sm lg:text-base text-content-secondary line-clamp-2 mb-6 max-w-md">
              {item.description}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-3 mb-6 text-xs text-content-secondary">
              {item.isFree ? (
                <Badge variant="free" overImage>Grátis</Badge>
              ) : (
                <Badge variant="doencas" overImage>Exclusivo</Badge>
              )}
              <span>·</span>
              <span>{item.duration}</span>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Play size={18} fill="white" />}
                asChild
              >
                <Link href={`/aulas/${item.slug}`}>Assistir agora</Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                leftIcon={<Info size={18} />}
              >
                Mais informações
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Nav arrows */}
      <button
        onClick={goPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 items-center justify-center text-white transition-colors duration-200 hidden lg:flex"
        aria-label="Banner anterior"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={goNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 items-center justify-center text-white transition-colors duration-200 hidden lg:flex"
        aria-label="Próximo banner"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {heroItems.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Ir para banner ${i + 1}`}
            className={cn(
              "rounded-full transition-all duration-300",
              i === current
                ? "w-6 h-1.5 bg-white"
                : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
            )}
          />
        ))}
      </div>
    </div>
  );
}

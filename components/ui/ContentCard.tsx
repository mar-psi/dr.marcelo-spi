"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Lock, Clock, Eye, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";

type CategoryType = "doencas" | "transtornos" | "curiosidades";

interface ContentCardProps {
  slug: string;
  title: string;
  thumbnailUrl: string;
  category: CategoryType;
  duration?: string;
  views?: number;
  isFree?: boolean;
  isNew?: boolean;
  progress?: number;
  progressText?: string;
  contentType?: string;
  className?: string;
  onPaywallTrigger?: (title?: string) => void;
}

const categoryLabels: Record<CategoryType, string> = {
  doencas: "Doenças",
  transtornos: "Transtornos",
  curiosidades: "Curiosidades",
};

export function ContentCard({
  slug,
  title,
  thumbnailUrl,
  category,
  duration,
  views,
  isFree = false,
  isNew = false,
  progress,
  progressText,
  contentType,
  className,
  onPaywallTrigger,
}: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isLocked = !isFree;

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked && onPaywallTrigger) {
      e.preventDefault();
      onPaywallTrigger(title);
    }
  };

  return (
    <motion.div
      className={cn("group relative h-full min-h-[25rem] cursor-pointer", className)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Link href={`/aulas/${slug}`} onClick={handleClick} aria-label={`${title} — ${categoryLabels[category]}`}>
        <motion.div
          className={cn(
            "absolute inset-x-0 top-0 overflow-hidden rounded-[22px] border border-white/[0.07] bg-background-secondary/96 shadow-[0_14px_48px_rgba(0,0,0,0.32)] backdrop-blur-sm",
            isHovered && "z-20 border-white/[0.16] shadow-[0_22px_60px_rgba(0,0,0,0.52)]"
          )}
          animate={{
            scale: isHovered ? 1.025 : 1,
          }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <div className="relative aspect-[2/3] bg-background-tertiary">
            <img
              src={thumbnailUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,8,12,0.96)] via-[rgba(7,8,12,0.2)] to-[rgba(7,8,12,0.02)]" />

            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(7,8,12,0.42)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/45">
                  <Lock size={18} className="text-white" />
                </div>
              </div>
            )}

            {!isLocked && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-2xl">
                  <Play size={22} className="ml-0.5" fill="currentColor" />
                </div>
              </motion.div>
            )}

            <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <Badge variant={category} overImage>
                  {categoryLabels[category]}
                </Badge>
                {isNew ? (
                  <Badge variant="novo" overImage>
                    Novo
                  </Badge>
                ) : null}
              </div>
              {isFree ? (
                <Badge variant="free" overImage>
                  Grátis
                </Badge>
              ) : null}
            </div>

            {(duration || contentType) && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[11px] text-white/90">
                {contentType ? (
                  <span className="rounded-full border border-white/12 bg-black/55 px-2 py-1">
                    {contentType}
                  </span>
                ) : null}
                {duration ? (
                  <span className="flex items-center gap-1 rounded-full border border-white/12 bg-black/55 px-2 py-1">
                    <Clock size={10} />
                    {duration}
                  </span>
                ) : null}
              </div>
            )}

            {progress !== undefined && progress > 0 ? (
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/15">
                <div
                  className="h-full bg-[#ff315c] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
          </div>

          <motion.div
            className="bg-[rgba(12,13,19,0.98)] px-4 pb-4 pt-3"
            animate={{ height: isHovered ? "10rem" : "6.25rem" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-content-primary transition-colors duration-200 group-hover:text-white">
              {title}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-content-secondary">
              {views !== undefined ? (
                <span className="flex items-center gap-1">
                  <Eye size={11} />
                  {views.toLocaleString("pt-BR")} visualizações
                </span>
              ) : null}
              {progress !== undefined ? <span>{progress}% concluído</span> : null}
              {progressText && progress === undefined ? <span>{progressText}</span> : null}
            </div>

            <motion.div
              initial={false}
              animate={{
                opacity: isHovered ? 1 : 0,
                y: isHovered ? 0 : 6,
              }}
              transition={{ duration: 0.18 }}
              className={cn("pointer-events-none mt-3", isHovered && "pointer-events-auto")}
            >
              <div className="rounded-2xl border border-white/12 bg-white/[0.04] px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="line-clamp-1 text-xs font-medium text-content-primary">
                    {progressText ?? (isLocked ? "Conteúdo exclusivo para assinantes" : "Pronto para assistir")}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-white">
                    Abrir <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </Link>

      {/* Locked CTA */}
      {isLocked && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-4">
          <button
            onClick={() => onPaywallTrigger?.(title)}
            className="pointer-events-auto w-full rounded-xl border border-white/10 bg-white/8 py-2 text-xs text-center text-white transition-colors duration-200 hover:bg-white/12"
          >
            Assinar por R$15/mês
          </button>
        </div>
      )}
    </motion.div>
  );
}

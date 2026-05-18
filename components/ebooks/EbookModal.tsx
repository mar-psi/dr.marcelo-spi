"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  Lock,
  FileText,
  Calendar,
  Tag,
  PlayCircle,
  Loader2,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Ebook } from "@/data/ebooks";

interface EbookModalProps {
  ebook: Ebook | null;
  isOpen: boolean;
  onClose: () => void;
  onPaywall: () => void;
  onDownload: () => void;
}

const categoryLabels: Record<string, string> = {
  doencas: "Doenças",
  transtornos: "Transtornos",
  curiosidades: "Curiosidades",
};

export function EbookModal({ ebook, isOpen, onClose, onPaywall, onDownload }: EbookModalProps) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  if (!ebook) return null;

  const handleDownload = () => {
    if (!ebook.isFree) {
      onPaywall();
      onClose();
      return;
    }
    setDownloading(true);
    onDownload();
    setTimeout(() => {
      setDownloading(false);
      toast({
        variant: "achievement",
        title: "Download concluído!",
        message: "+5 XP ganhos por baixar um e-book.",
      });
    }, 1200);
  };

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
            className="relative z-10 w-full max-w-2xl bg-background-secondary border border-border-subtle rounded-2xl shadow-card overflow-hidden"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-background-tertiary/80 border border-border-subtle flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-background-tertiary transition-colors"
              aria-label="Fechar"
            >
              <X size={15} />
            </button>

            <div className="flex flex-col sm:flex-row">
              {/* Cover — left side */}
              <div className="relative w-full sm:w-48 md:w-56 shrink-0 aspect-[2/3] sm:aspect-auto sm:min-h-[320px] bg-background-tertiary">
                <img
                  src={ebook.coverUrl}
                  alt={ebook.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background-secondary/20 sm:to-transparent" />
              </div>

              {/* Content — right side */}
              <div className="flex-1 p-5 sm:p-6">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant={ebook.category} size="sm">
                    {categoryLabels[ebook.category]}
                  </Badge>
                  {ebook.isFree ? (
                    <Badge variant="free" size="sm">Grátis</Badge>
                  ) : (
                    <Badge variant="novo" size="sm">Exclusivo</Badge>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-lg font-bold text-content-primary mb-2 leading-snug">
                  {ebook.title}
                </h2>

                {/* Description */}
                <p className="text-sm text-content-secondary leading-relaxed mb-4">
                  {ebook.description}
                </p>

                {/* Meta info */}
                <div className="flex flex-wrap gap-3 mb-4 text-xs text-content-disabled">
                  <span className="flex items-center gap-1">
                    <FileText size={12} />
                    {ebook.pages} páginas
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(ebook.publishedAt).toLocaleDateString("pt-BR", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download size={12} />
                    {ebook.downloads.toLocaleString("pt-BR")} downloads
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {ebook.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-background-tertiary border border-border-subtle text-content-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className={cn(
                    "w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200",
                    ebook.isFree
                      ? "bg-accent-primary text-white hover:bg-accent-primaryHover shadow-glow hover:shadow-glowStrong disabled:opacity-70"
                      : "bg-background-tertiary border border-border-subtle text-content-secondary hover:border-accent-primary/40 hover:text-accent-secondary disabled:opacity-70"
                  )}
                >
                  {downloading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : ebook.isFree ? (
                    <Download size={16} />
                  ) : (
                    <Lock size={16} />
                  )}
                  {downloading
                    ? "Baixando..."
                    : ebook.isFree
                    ? "Baixar e-book grátis"
                    : "Assine para baixar"}
                </button>

                {/* Related aula */}
                {ebook.relatedAulaSlug && (
                  <Link
                    href={`/aulas/${ebook.relatedAulaSlug}`}
                    className="flex items-center gap-2 mt-3 text-xs text-accent-secondary hover:text-accent-primary transition-colors"
                    onClick={onClose}
                  >
                    <PlayCircle size={13} />
                    Ver aula relacionada
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

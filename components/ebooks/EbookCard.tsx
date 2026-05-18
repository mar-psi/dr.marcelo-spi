"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, Lock, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Ebook } from "@/data/ebooks";

interface EbookCardProps {
  ebook: Ebook;
  onOpen: () => void;
  onPaywall: () => void;
  onDownload: () => void;
  index?: number;
}

const categoryLabels: Record<string, string> = {
  doencas: "Doenças",
  transtornos: "Transtornos",
  curiosidades: "Curiosidades",
};

export function EbookCard({ ebook, onOpen, onPaywall, onDownload, index = 0 }: EbookCardProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ebook.isFree) {
      onPaywall();
      return;
    }
    setDownloading(true);
    onDownload();
    setTimeout(() => setDownloading(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group cursor-pointer"
      onClick={onOpen}
    >
      {/* Cover — proporção 2:3 de livro */}
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-background-tertiary shadow-card hover:shadow-cardHover transition-all duration-300">
        <img
          src={ebook.coverUrl}
          alt={ebook.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,15,0.9)] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Badges top */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <Badge variant={ebook.category} size="sm" overImage>
            {categoryLabels[ebook.category]}
          </Badge>
          {ebook.isFree ? (
            <Badge variant="free" size="sm" overImage>Grátis</Badge>
          ) : (
            <Badge variant="novo" size="sm" overImage>Exclusivo</Badge>
          )}
        </div>

        {/* Lock overlay for exclusive */}
        {!ebook.isFree && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={(e) => {
              e.stopPropagation();
              onPaywall();
            }}
          >
            <div className="w-12 h-12 rounded-full bg-background-secondary/90 border border-border-subtle flex items-center justify-center backdrop-blur-sm">
              <Lock size={20} className="text-accent-secondary" />
            </div>
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-xs font-semibold text-white line-clamp-2 leading-snug drop-shadow-md">
            {ebook.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-white/70 flex items-center gap-1">
              <FileText size={10} />
              {ebook.pages} pgs
            </span>
            <span className="text-[10px] text-white/70">
              {ebook.downloads.toLocaleString("pt-BR")} downloads
            </span>
          </div>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className={cn(
          "w-full mt-2.5 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200",
          ebook.isFree
            ? "bg-accent-primary text-white hover:bg-accent-primaryHover shadow-glow hover:shadow-glowStrong"
            : "bg-background-tertiary border border-border-subtle text-content-secondary hover:border-accent-primary/40 hover:text-accent-secondary"
        )}
      >
        {downloading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : ebook.isFree ? (
          <Download size={14} />
        ) : (
          <Lock size={14} />
        )}
        {downloading ? "Baixando..." : ebook.isFree ? "Download grátis" : "Assine para baixar"}
      </button>
    </motion.div>
  );
}

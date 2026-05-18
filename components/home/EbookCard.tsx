"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Download, Lock, BookOpen } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type { EbookItem } from "@/data/content";
import { cn } from "@/lib/utils";

interface EbookCardProps {
  item: EbookItem;
  onPaywallTrigger?: (title?: string) => void;
}

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

export function EbookCard({ item, onPaywallTrigger }: EbookCardProps) {
  const handleAction = (e: React.MouseEvent) => {
    if (!item.isFree && onPaywallTrigger) {
      e.preventDefault();
      onPaywallTrigger(item.title);
    }
  };

  return (
    <motion.div
      className="group relative rounded-xl overflow-hidden bg-background-secondary border border-border-subtle shadow-card"
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href="/ebooks" onClick={handleAction}>
        {/* Cover */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={item.coverUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,15,0.8)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Locked overlay */}
          {!item.isFree && (
            <div className="absolute top-2 right-2">
              <div className="w-7 h-7 rounded-full bg-[rgba(10,10,15,0.8)] flex items-center justify-center">
                <Lock size={12} className="text-accent-secondary" />
              </div>
            </div>
          )}

          {/* New badge */}
          {item.isNew && (
            <div className="absolute top-2 left-2">
              <Badge variant="novo">Novo</Badge>
            </div>
          )}

          {/* Hover CTA */}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold",
                item.isFree
                  ? "bg-accent-primary text-white shadow-glow"
                  : "bg-background-tertiary text-accent-secondary border border-accent-primary/40"
              )}
            >
              {item.isFree ? (
                <>
                  <Download size={12} />
                  Baixar grátis
                </>
              ) : (
                <>
                  <Lock size={12} />
                  Disponível na assinatura
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <Badge variant={categoryVariant[item.category]} size="sm" className="mb-2">
            {categoryLabel[item.category]}
          </Badge>
          <h3 className="text-sm font-semibold text-content-primary line-clamp-2 leading-snug mb-2 group-hover:text-accent-secondary transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-content-secondary">
            <BookOpen size={11} />
            <span>{item.pages} páginas</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

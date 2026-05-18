"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, PlayCircle, Clock, Radio } from "lucide-react";
import { ProgressBar } from "@/components/ui";
import type { AulaRelacionada } from "@/data/aulas";
import { cn } from "@/lib/utils";

interface AulaSerieProps {
  serieTitle: string;
  aulas: AulaRelacionada[];
  currentSlug: string;
}

const statusIcon = {
  assistido: CheckCircle2,
  em_progresso: Radio,
  nao_iniciado: PlayCircle,
};

const statusColor = {
  assistido: "text-status-success",
  em_progresso: "text-accent-secondary",
  nao_iniciado: "text-content-disabled",
};

const statusLabel = {
  assistido: "Concluído",
  em_progresso: "Em progresso",
  nao_iniciado: "Não iniciado",
};

export function AulaSerie({ serieTitle, aulas, currentSlug }: AulaSerieProps) {
  return (
    <div className="rounded-xl bg-background-secondary border border-border-subtle overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-subtle bg-background-tertiary">
        <p className="text-xs text-content-secondary uppercase tracking-wider font-semibold mb-0.5">
          Série
        </p>
        <h3 className="text-sm font-bold text-content-primary leading-snug">
          {serieTitle}
        </h3>
      </div>

      {/* List */}
      <div className="divide-y divide-border-subtle">
        {aulas.map((aula, i) => {
          const isCurrent = aula.slug === currentSlug || aula.isCurrent;
          const Icon = statusIcon[aula.status];

          return (
            <Link key={aula.id} href={`/aulas/${aula.slug}`}>
              <motion.div
                whileHover={{ backgroundColor: "rgba(30,30,46,0.8)" }}
                className={cn(
                  "flex items-start gap-3 p-3 transition-colors duration-150",
                  isCurrent && "bg-[rgba(124,58,237,0.08)] border-l-2 border-accent-primary"
                )}
              >
                {/* Number */}
                <span className="text-xs text-content-disabled font-mono w-5 shrink-0 mt-1 text-center">
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Thumbnail */}
                <div className="relative w-20 aspect-video rounded-lg overflow-hidden shrink-0">
                  <img
                    src={aula.thumbnailUrl}
                    alt={aula.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Current indicator */}
                  {isCurrent && (
                    <div className="absolute inset-0 bg-accent-primary/20 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center">
                        <Radio size={10} className="text-white" />
                      </div>
                    </div>
                  )}
                  {/* Progress bar on thumb */}
                  {aula.progress && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
                      <div
                        className="h-full bg-accent-primary"
                        style={{ width: `${aula.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {isCurrent && (
                    <span className="text-[10px] text-accent-secondary font-semibold uppercase tracking-wide mb-0.5 block">
                      Assistindo agora
                    </span>
                  )}
                  <p className={cn(
                    "text-xs font-medium leading-snug line-clamp-2",
                    isCurrent ? "text-content-primary" : "text-content-secondary"
                  )}>
                    {aula.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Icon
                      size={11}
                      className={cn("shrink-0", statusColor[aula.status])}
                    />
                    <span className={cn("text-[10px] font-medium", statusColor[aula.status])}>
                      {statusLabel[aula.status]}
                    </span>
                    <span className="text-[10px] text-content-disabled flex items-center gap-0.5">
                      <Clock size={9} />
                      {aula.duration}
                    </span>
                  </div>
                  {aula.progress && aula.status === "em_progresso" && (
                    <div className="mt-1.5">
                      <ProgressBar value={aula.progress} size="sm" color="primary" />
                    </div>
                  )}
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

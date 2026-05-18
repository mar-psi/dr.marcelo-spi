import React from "react";
import Link from "next/link";
import { ChevronRight, Play, BookOpen, HelpCircle, Newspaper, Zap } from "lucide-react";
import { Badge } from "@/components/ui";

type SectionVariant = "doencas" | "transtornos" | "curiosidades" | "ebooks" | "quizzes" | "blog" | "novidades" | "continuar" | "default";

interface SectionHeaderProps {
  title: string;
  variant?: SectionVariant;
  href?: string;
  subtitle?: string;
}

const variantIcon: Record<SectionVariant, React.ElementType> = {
  doencas: Play,
  transtornos: Play,
  curiosidades: Play,
  ebooks: BookOpen,
  quizzes: HelpCircle,
  blog: Newspaper,
  novidades: Zap,
  continuar: Play,
  default: Play,
};

const variantBadge: Record<SectionVariant, "doencas" | "transtornos" | "curiosidades" | "default" | "novo"> = {
  doencas: "doencas",
  transtornos: "transtornos",
  curiosidades: "curiosidades",
  ebooks: "default",
  quizzes: "default",
  blog: "default",
  novidades: "novo",
  continuar: "default",
  default: "default",
};

export function SectionHeader({ title, variant = "default", href, subtitle }: SectionHeaderProps) {
  const Icon = variantIcon[variant];

  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Icon size={18} className="text-accent-primary shrink-0" />
          <h2 className="text-lg lg:text-xl font-bold text-content-primary">{title}</h2>
          {variant !== "default" && variant !== "continuar" && (
            <Badge variant={variantBadge[variant]} size="sm">
              {variant === "doencas"
                ? "Doenças"
                : variant === "transtornos"
                ? "Transtornos"
                : variant === "curiosidades"
                ? "Curiosidades"
                : variant === "novidades"
                ? "Novo"
                : ""}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-content-secondary ml-[26px]">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs text-accent-secondary hover:text-accent-primary transition-colors duration-200 shrink-0 mt-0.5"
        >
          Ver tudo
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { Lock, Play, Calendar } from "lucide-react";
import { Badge } from "@/components/ui";
import { recentItems } from "@/data/content";
import { formatDate } from "@/lib/utils";
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

export function RecentList() {
  return (
    <div className="space-y-2">
      {recentItems.slice(0, 8).map((item, i) => (
        <Link
          key={item.id}
          href={`/aulas/${item.slug}`}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl",
            "bg-background-secondary border border-border-subtle",
            "hover:bg-background-tertiary hover:border-accent-primary/30",
            "transition-all duration-200 group"
          )}
        >
          {/* Número */}
          <span className="text-xs font-bold text-content-disabled w-5 text-center shrink-0">
            {String(i + 1).padStart(2, "0")}
          </span>

          {/* Thumbnail */}
          <div className="relative w-16 aspect-video rounded-lg overflow-hidden shrink-0">
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {!item.isFree && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Lock size={10} className="text-accent-secondary" />
              </div>
            )}
            {item.isFree && (
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                <Play size={12} className="text-white" fill="white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-content-primary line-clamp-1 group-hover:text-accent-secondary transition-colors duration-200">
              {item.title}
            </h4>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={categoryVariant[item.category]} size="sm">
                {categoryLabel[item.category]}
              </Badge>
              {item.isFree && (
                <Badge variant="free" size="sm">Grátis</Badge>
              )}
              {item.isNew && (
                <Badge variant="novo" size="sm">Novo</Badge>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="shrink-0 text-right hidden sm:block">
            <p className="text-xs text-content-disabled flex items-center gap-1 justify-end">
              <Calendar size={10} />
              {formatDate(item.publishedAt)}
            </p>
            <p className="text-xs text-content-disabled mt-0.5">{item.duration}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui";
import { blogPosts } from "@/data/content";
import { formatDate } from "@/lib/utils";

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

export function BlogSection() {
  return (
    <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-content-primary">Do Blog</h2>
          <p className="text-xs text-content-secondary mt-0.5">
            Artigos aprofundados sobre saúde mental
          </p>
        </div>
        <Link
          href="/blog"
          className="flex items-center gap-1 text-xs text-accent-secondary hover:text-accent-primary transition-colors"
        >
          Ver todos
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {blogPosts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group flex flex-col rounded-xl overflow-hidden bg-background-tertiary border border-border-subtle hover:border-accent-primary/40 transition-all duration-200 hover:shadow-glow"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden">
              <img
                src={post.thumbnailUrl}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,15,0.7)] to-transparent" />
              <div className="absolute top-2 left-2">
                <Badge variant={categoryVariant[post.category]} size="sm">
                  {categoryLabel[post.category]}
                </Badge>
              </div>
            </div>

            {/* Text */}
            <div className="p-3 flex flex-col gap-2 flex-1">
              <h3 className="text-sm font-semibold text-content-primary line-clamp-2 leading-snug group-hover:text-accent-secondary transition-colors">
                {post.title}
              </h3>
              <p className="text-xs text-content-secondary line-clamp-2 flex-1">
                {post.excerpt}
              </p>
              <div className="flex items-center gap-3 text-xs text-content-disabled mt-auto">
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  {formatDate(post.publishedAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {post.readTime}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

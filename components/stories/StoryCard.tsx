"use client";

import React from "react";
import { motion } from "framer-motion";
import { Eye, Clock } from "lucide-react";
import type { StoryItem } from "@/data/stories";
import { STORY_AUTHOR, formatStoryTime } from "@/data/stories";
import { cn } from "@/lib/utils";

interface StoryCardProps {
  story: StoryItem;
  onClick: () => void;
}

const categoryColor: Record<string, string> = {
  doencas:
    "bg-[rgba(124,58,237,0.3)] border-[rgba(124,58,237,0.5)] text-accent-secondary",
  transtornos:
    "bg-[rgba(59,130,246,0.3)] border-[rgba(59,130,246,0.5)] text-blue-300",
  curiosidades:
    "bg-[rgba(34,197,94,0.3)] border-[rgba(34,197,94,0.5)] text-green-300",
};

const categoryLabel: Record<string, string> = {
  doencas: "Doenças",
  transtornos: "Transtornos",
  curiosidades: "Curiosidades",
};

export function StoryCard({ story, onClick }: StoryCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="group relative cursor-pointer rounded-xl overflow-hidden bg-background-secondary border border-border-subtle shadow-card flex-shrink-0"
      style={{ width: 180 }}
    >
      {/* Thumbnail 9:16 */}
      <div className="aspect-story relative overflow-hidden">
        {story.thumbnailIsVideo ? (
          <video
            src={story.thumbnailUrl}
            aria-label={story.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            muted
            playsInline
            preload="auto"
          />
        ) : (
          <img
            src={story.thumbnailUrl}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

        {/* Seen overlay */}
        {story.seen && (
          <div className="absolute inset-0 bg-black/40" />
        )}

        {/* New ring border glow */}
        {!story.seen && (
          <div className="absolute inset-0 rounded-xl ring-2 ring-accent-primary/60 animate-[glowPulse_2s_ease-in-out_infinite] pointer-events-none" />
        )}

        {/* Seen badge */}
        {story.seen && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 border border-white/20">
              <Eye size={10} className="text-white/60" />
              <span className="text-[10px] text-white/60 font-medium">Visto</span>
            </div>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span className={cn(
            "text-[9px] font-semibold px-1.5 py-0.5 rounded-full border",
            categoryColor[story.category]
          )}>
            {categoryLabel[story.category]}
          </span>
        </div>

        {/* Author avatar */}
        <div className="absolute bottom-2 left-2">
          <div className={cn(
            "w-8 h-8 rounded-full overflow-hidden border-2",
            story.seen ? "border-white/30" : "border-accent-primary"
          )}>
            <img
              src={STORY_AUTHOR.avatar}
              alt={STORY_AUTHOR.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60">
            <Clock size={9} className="text-white/60" />
            <span className="text-[9px] text-white/70">{story.duration}s</span>
          </div>
        </div>
      </div>

      {/* Info below */}
      <div className="p-2.5">
        <p className="text-xs font-semibold text-content-primary leading-snug line-clamp-1 group-hover:text-accent-secondary transition-colors">
          {story.title}
        </p>
        <p className="text-[10px] text-content-disabled mt-0.5 line-clamp-1">
          {story.theme}
        </p>
        <p className="text-[10px] text-content-disabled mt-1">
          {formatStoryTime(story.publishedAt)}
        </p>
      </div>
    </motion.div>
  );
}

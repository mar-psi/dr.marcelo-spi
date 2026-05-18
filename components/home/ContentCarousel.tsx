"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContentCard } from "@/components/ui";
import type { ContentItem } from "@/data/content";
import { cn } from "@/lib/utils";

interface ContentCarouselProps {
  items: ContentItem[];
  onPaywallTrigger?: (title?: string) => void;
}

export function ContentCarousel({ items, onPaywallTrigger }: ContentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 20);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 20);
  };

  return (
    <div className="relative group/carousel -mx-4 px-4 sm:-mx-6 sm:px-6">
      {/* Left arrow */}
      {showLeft && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => scroll("left")}
          className={cn(
            "absolute left-1 top-1/2 -translate-y-1/2 z-30",
            "w-10 h-10 rounded-full bg-background-secondary border border-border-subtle shadow-card",
            "flex items-center justify-center text-content-primary",
            "hover:bg-background-tertiary hover:border-accent-primary transition-all duration-200",
            "opacity-0 group-hover/carousel:opacity-100"
          )}
          aria-label="Rolar para esquerda"
        >
          <ChevronLeft size={18} />
        </motion.button>
      )}

      {/* Cards */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-5 pb-20 pt-8 sm:px-6"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="shrink-0 w-[160px] sm:w-[176px] lg:w-[188px] xl:w-[196px]"
            style={{ scrollSnapAlign: "start" }}
          >
            <ContentCard
              slug={item.slug}
              title={item.title}
              thumbnailUrl={item.thumbnailUrl}
              category={item.category}
              duration={item.duration}
              views={item.views}
              isFree={item.isFree}
              isNew={item.isNew}
              progress={item.progress}
              progressText={item.progressText}
              contentType="Vídeo"
              onPaywallTrigger={onPaywallTrigger}
            />
          </div>
        ))}
      </div>

      {/* Right arrow */}
      {showRight && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => scroll("right")}
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2 z-30",
            "w-10 h-10 rounded-full bg-background-secondary border border-border-subtle shadow-card",
            "flex items-center justify-center text-content-primary",
            "hover:bg-background-tertiary hover:border-accent-primary transition-all duration-200",
            "opacity-0 group-hover/carousel:opacity-100"
          )}
          aria-label="Rolar para direita"
        >
          <ChevronRight size={18} />
        </motion.button>
      )}

      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-16 w-16 bg-gradient-to-l from-background-primary to-transparent pointer-events-none" />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { storiesData, getUnseenCount } from "@/data/stories";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { StoryRingComponent } from "@/components/stories/StoryRing";
import { STORY_AUTHOR } from "@/data/stories";

export function StoriesBar() {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [seenIds, setSeenIds] = useState<Set<string>>(
    new Set(storiesData.filter((s) => s.seen).map((s) => s.id))
  );

  const sorted = [...storiesData].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const openStory = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleSeen = (id: string) => {
    setSeenIds((prev) => new Set([...prev, id]));
  };

  return (
    <>
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 lg:px-6 pt-4 pb-2">
          {sorted.map((story, i) => (
            <div key={story.id} className="shrink-0 flex flex-col items-center gap-1">
              <StoryRingComponent
                src={STORY_AUTHOR.avatar}
                name="Dr. Marcelo"
                ringState={seenIds.has(story.id) ? "seen" : "new"}
                size="md"
                newCount={seenIds.has(story.id) ? undefined : 1}
                onClick={() => openStory(i)}
                showLabel={false}
              />
              <p className="text-[10px] text-content-disabled max-w-[56px] truncate text-center leading-tight">
                {story.title}
              </p>
            </div>
          ))}
        </div>
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background-primary to-transparent pointer-events-none" />
      </div>

      <AnimatePresence>
        {viewerOpen && (
          <StoryViewer
            stories={sorted}
            initialIndex={viewerIndex}
            onClose={() => setViewerOpen(false)}
            onSeen={handleSeen}
          />
        )}
      </AnimatePresence>
    </>
  );
}

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

function SkeletonBase({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md skeleton-shimmer",
        className
      )}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ className }: SkeletonProps) {
  return <SkeletonBase className={cn("h-4 w-full", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg overflow-hidden bg-background-secondary">
      {/* Thumbnail */}
      <SkeletonBase className="w-full aspect-video rounded-none" />
      {/* Content */}
      <div className="p-3 space-y-2">
        <SkeletonBase className="h-4 w-3/4" />
        <SkeletonBase className="h-4 w-1/2" />
        <SkeletonBase className="h-3 w-1/4" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-14 h-14" };
  return <SkeletonBase className={cn("rounded-full", sizeMap[size])} />;
}

export function SkeletonHero() {
  return (
    <div className="w-full aspect-[21/9] rounded-xl overflow-hidden">
      <SkeletonBase className="w-full h-full rounded-none" />
    </div>
  );
}

export function SkeletonRow({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <SkeletonBase className="h-6 w-48" />
      <div className={`grid gap-4 grid-cols-2 md:grid-cols-${count}`}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

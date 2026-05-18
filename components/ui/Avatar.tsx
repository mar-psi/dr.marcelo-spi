import React from "react";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";
type RingStatus = "new" | "seen" | "expired" | "none";

interface AvatarProps {
  src?: string;
  name?: string;
  size?: AvatarSize;
  ring?: RingStatus;
  online?: boolean;
  className?: string;
}

const sizeMap: Record<AvatarSize, { wrapper: string; img: string; text: string; status: string }> = {
  sm: {
    wrapper: "w-8 h-8",
    img: "w-8 h-8 text-xs",
    text: "text-xs",
    status: "w-2 h-2 -bottom-0.5 -right-0.5",
  },
  md: {
    wrapper: "w-10 h-10",
    img: "w-10 h-10 text-sm",
    text: "text-sm",
    status: "w-2.5 h-2.5 -bottom-0.5 -right-0.5",
  },
  lg: {
    wrapper: "w-14 h-14",
    img: "w-14 h-14 text-base",
    text: "text-base",
    status: "w-3 h-3 bottom-0 right-0",
  },
};

const ringStyles: Record<RingStatus, string> = {
  new: "p-[2px] bg-gradient-to-br from-accent-primary to-blue-500 rounded-full animate-[storyRingPulse_2s_ease-in-out_infinite]",
  seen: "p-[2px] bg-accent-primary rounded-full opacity-60",
  expired: "p-[2px] bg-content-disabled rounded-full",
  none: "",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function Avatar({
  src,
  name = "User",
  size = "md",
  ring = "none",
  online = false,
  className,
}: AvatarProps) {
  const sizes = sizeMap[size];
  const initials = getInitials(name);

  const innerContent = (
    <div className={cn("relative shrink-0", sizes.wrapper, className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn("rounded-full object-cover", sizes.img)}
        />
      ) : (
        <div
          className={cn(
            "rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary",
            "flex items-center justify-center font-semibold text-white",
            sizes.img
          )}
          aria-label={name}
        >
          <span className={sizes.text}>{initials}</span>
        </div>
      )}
      {online && (
        <span
          className={cn(
            "absolute rounded-full bg-status-success border-2 border-background-primary",
            sizes.status
          )}
          aria-label="Online"
        />
      )}
    </div>
  );

  if (ring !== "none") {
    return (
      <div className={cn("shrink-0", ringStyles[ring], className)}>
        <div className="rounded-full bg-background-primary p-[2px]">
          {innerContent}
        </div>
      </div>
    );
  }

  return innerContent;
}

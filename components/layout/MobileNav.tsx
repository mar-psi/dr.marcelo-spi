"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, PlayCircle, Layers, HelpCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadStoriesCount } from "@/hooks/useUnreadStoriesCount";

interface MobileNavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  hasStoryRing?: boolean;
}

const mobileItems: MobileNavItem[] = [
  { icon: Home, label: "Home", href: "/" },
  { icon: PlayCircle, label: "Aulas", href: "/aulas" },
  { icon: Layers, label: "Stories", href: "/stories", hasStoryRing: true },
  { icon: HelpCircle, label: "Quizzes", href: "/quizzes" },
  { icon: User, label: "Perfil", href: "/perfil" },
];

export function MobileNav() {
  const pathname = usePathname();
  const unreadStories = useUnreadStoriesCount();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-background-secondary/95 backdrop-blur-md border-t border-border-subtle"
      aria-label="Navegação mobile"
    >
      <ul className="flex items-center justify-around h-full px-2">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 py-1 group"
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                <div className="relative">
                  {/* Story ring glow para Stories */}
                  {item.hasStoryRing && unreadStories > 0 && !isActive && (
                    <span
                      className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-accent-primary to-blue-500 opacity-70 animate-[storyRingPulse_2s_ease-in-out_infinite]"
                      aria-hidden="true"
                    />
                  )}
                  {item.hasStoryRing && unreadStories > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-primary px-1 text-[9px] font-bold text-white">
                      {unreadStories}
                    </span>
                  )}
                  <Icon
                    size={22}
                    className={cn(
                      "relative transition-colors duration-200",
                      isActive
                        ? "text-accent-primary"
                        : "text-content-secondary group-hover:text-content-primary"
                    )}
                  />
                  {/* Active dot */}
                  {isActive && (
                    <motion.span
                      layoutId="mobile-nav-dot"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-primary"
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none transition-colors duration-200",
                    isActive
                      ? "text-accent-primary"
                      : "text-content-disabled group-hover:text-content-secondary"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

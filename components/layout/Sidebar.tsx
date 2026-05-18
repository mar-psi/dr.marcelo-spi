"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Home,
  PlayCircle,
  Layers,
  BookOpen,
  HelpCircle,
  FileText,
  Trophy,
  CreditCard,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadStoriesCount } from "@/hooks/useUnreadStoriesCount";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  external?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", href: "/" },
  { icon: PlayCircle, label: "Aulas", href: "/aulas" },
  { icon: Layers, label: "Stories", href: "/stories" },
  { icon: BookOpen, label: "E-books", href: "/ebooks" },
  { icon: HelpCircle, label: "Quizzes", href: "/quizzes" },
  { icon: FileText, label: "Blog", href: "https://blogmarcelopsiquiatra.com.br/", external: true },
  { icon: Trophy, label: "Minhas Conquistas", href: "/conquistas" },
  { icon: CreditCard, label: "Minha Assinatura", href: "/assinatura" },
];

interface SidebarItemProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}

function SidebarItem({ item, isActive, collapsed }: SidebarItemProps) {
  const Icon = item.icon;

  const content = (
    <>
      <Icon
        size={18}
        className={cn(
          "shrink-0 transition-colors duration-200",
          isActive ? "text-accent-primary" : "group-hover:text-content-primary"
        )}
      />

      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-medium whitespace-nowrap overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Badge */}
      {item.badge && !collapsed && (
        <span className="ml-auto shrink-0 w-5 h-5 rounded-full bg-accent-primary text-white text-[10px] font-bold flex items-center justify-center">
          {item.badge}
        </span>
      )}
      {item.badge && collapsed && (
        <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-accent-primary text-white text-[8px] font-bold flex items-center justify-center">
          {item.badge}
        </span>
      )}

      {/* Tooltip when collapsed */}
      {collapsed && (
        <div
          className={cn(
            "absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium",
            "bg-background-tertiary border border-border-subtle text-content-primary",
            "whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100",
            "transition-opacity duration-150 shadow-card z-50"
          )}
          role="tooltip"
        >
          {item.label}
        </div>
      )}
    </>
  );

  const className = cn(
    "relative flex items-center gap-3 px-3 py-2.5 rounded-lg",
    "transition-all duration-200 group",
    isActive
      ? "bg-[rgba(124,58,237,0.15)] text-accent-secondary border-l-2 border-accent-primary pl-[10px]"
      : "text-content-secondary hover:text-content-primary hover:bg-background-tertiary border-l-2 border-transparent pl-[10px]"
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={collapsed ? item.label : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      aria-current={isActive ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
    >
      {content}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const unreadStories = useUnreadStoriesCount();
  const items = navItems.map((item) =>
    item.href === "/stories" && unreadStories > 0
      ? { ...item, badge: String(unreadStories) }
      : item
  );

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col fixed top-0 left-0 h-full z-50",
        "bg-background-secondary border-r border-border-subtle",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
      aria-label="Menu lateral"
    >
      {/* Logo */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-border-subtle shrink-0",
          collapsed ? "justify-center px-3" : "px-4 gap-3"
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shrink-0 shadow-glow">
          <Brain size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-bold text-content-primary leading-tight whitespace-nowrap">
                Dr. Marcelo
              </p>
              <p className="text-xs text-accent-secondary font-semibold leading-tight whitespace-nowrap">
                Psiquiatra
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5">
        {items.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            isActive={
              item.external
                ? false
                : item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            }
            collapsed={collapsed}
          />
        ))}

        {/* Separator */}
        <div className="my-3 mx-2 border-t border-border-subtle" />

        {/* Support */}
        <a
          href="mailto:psiquefotmiga@hotmail.com"
          className={cn(
            "relative flex items-center gap-3 px-3 py-2.5 rounded-lg",
            "text-content-secondary hover:text-content-primary hover:bg-background-tertiary",
            "transition-all duration-200 group border-l-2 border-transparent pl-[10px]"
          )}
          aria-label={collapsed ? "Suporte por email" : undefined}
        >
          <Mail size={18} className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Suporte
              </motion.span>
            )}
          </AnimatePresence>
          {collapsed && (
            <div
              className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-background-tertiary border border-border-subtle text-content-primary whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-card z-50"
              role="tooltip"
            >
              Suporte
            </div>
          )}
        </a>
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 p-2 border-t border-border-subtle">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center rounded-lg px-3 py-2.5 text-content-secondary",
            "hover:text-content-primary hover:bg-background-tertiary transition-colors duration-200",
            collapsed ? "justify-center" : "gap-3"
          )}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span className="text-sm font-medium">Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

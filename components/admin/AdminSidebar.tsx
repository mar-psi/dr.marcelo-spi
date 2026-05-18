"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileVideo,
  Users,
  CreditCard,
  HelpCircle,
  Layers,
  Bell,
  ArrowLeft,
  Shield,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminNavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

const adminNavItems: AdminNavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: FileVideo, label: "Conteúdo", href: "/admin/conteudo" },
  { icon: Users, label: "Usuários", href: "/admin/usuarios" },
  { icon: CreditCard, label: "Assinaturas", href: "/admin/assinaturas" },
  { icon: HelpCircle, label: "Quizzes", href: "/admin/quizzes" },
  { icon: Layers, label: "Stories", href: "/admin/stories" },
  { icon: Bell, label: "Notificações", href: "/admin/notificacoes" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 fixed left-0 top-0 bottom-0 bg-background-secondary border-r border-border-subtle z-40">

      {/* Logo + role badge */}
      <div className="px-5 py-5 border-b border-border-subtle">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
            <Brain size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-content-primary leading-tight truncate">
              Dr. Marcelo <span className="text-accent-secondary">Psiquiatra</span>
            </p>
          </div>
        </div>

        {/* Admin badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-primary/15 border border-accent-primary/30">
          <Shield size={13} className="text-accent-secondary shrink-0" />
          <span className="text-xs font-bold text-accent-secondary">
            Painel Administrativo
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Menu admin">
        <ul className="space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer",
                      isActive
                        ? "bg-accent-primary/15 text-accent-secondary border-l-2 border-accent-primary pl-[10px]"
                        : "text-content-secondary hover:text-content-primary hover:bg-background-tertiary"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon size={17} className="shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="w-5 h-5 rounded-full bg-accent-primary text-white text-[10px] font-bold flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </motion.div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border-subtle">
        <Link
          href="/"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-content-secondary hover:text-content-primary hover:bg-background-tertiary transition-all cursor-pointer"
        >
          <ArrowLeft size={16} className="shrink-0" />
          <span>Voltar à plataforma</span>
        </Link>
      </div>
    </aside>
  );
}

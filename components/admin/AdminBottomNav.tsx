"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileVideo,
  Layers,
  HelpCircle,
  Menu,
  Users,
  CreditCard,
  Bell,
  ArrowLeft,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Painel", href: "/admin" },
  { icon: FileVideo, label: "Conteúdo", href: "/admin/conteudo" },
  { icon: Layers, label: "Stories", href: "/admin/stories" },
  { icon: HelpCircle, label: "Quizzes", href: "/admin/quizzes" },
];

export function AdminBottomNav() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Click outside drawer to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (drawerOpen && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [drawerOpen]);

  // Prevent scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-background-secondary/95 backdrop-blur-md border-t border-border-subtle"
        aria-label="Navegação admin mobile"
      >
        <ul className="flex items-center justify-around h-full px-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-1 py-1 group"
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="relative">
                    <Icon
                      size={20}
                      className={cn(
                        "transition-colors duration-200",
                        isActive
                          ? "text-accent-primary"
                          : "text-content-secondary group-hover:text-content-primary"
                      )}
                    />
                    {isActive && (
                      <motion.span
                        layoutId="admin-mobile-nav-dot"
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

          {/* Toggle "Mais" Drawer */}
          <li className="flex-1">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-full flex flex-col items-center justify-center gap-1 py-1 group"
              aria-label="Ver mais opções"
              aria-expanded={drawerOpen}
            >
              <Menu
                size={20}
                className="text-content-secondary group-hover:text-content-primary transition-colors duration-200"
              />
              <span className="text-[10px] font-medium leading-none text-content-disabled group-hover:text-content-secondary transition-colors duration-200">
                Mais
              </span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Slide-up Bottom Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-background-primary/80 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Bottom Sheet */}
            <motion.div
              ref={drawerRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background-secondary border-t border-border-subtle rounded-t-2xl p-5 pb-8 flex flex-col max-h-[85vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
                <span className="text-sm font-bold text-content-primary">
                  Outras Ferramentas Admin
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-lg bg-background-tertiary flex items-center justify-center text-content-secondary hover:text-content-primary transition-colors"
                  aria-label="Fechar menu"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Content */}
              <ul className="flex flex-col gap-2">
                {[
                  { icon: Users, label: "Usuários", href: "/admin/usuarios" },
                  { icon: CreditCard, label: "Assinaturas", href: "/admin/assinaturas" },
                  { icon: Bell, label: "Notificações", href: "/admin/notificacoes" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <div
                          className={cn(
                            "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer",
                            isActive
                              ? "bg-accent-primary/15 text-accent-secondary border-l-2 border-accent-primary pl-[14px]"
                              : "text-content-secondary hover:text-content-primary hover:bg-background-tertiary"
                          )}
                        >
                          <Icon size={18} className="shrink-0" />
                          <span className="flex-1">{item.label}</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}

                <div className="my-2 border-t border-border-subtle" />

                <li>
                  <Link href="/">
                    <div className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-content-secondary hover:text-content-primary hover:bg-background-tertiary transition-all cursor-pointer">
                      <ArrowLeft size={18} className="shrink-0" />
                      <span>Voltar à plataforma</span>
                    </div>
                  </Link>
                </li>

                <li>
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      void logout();
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-status-error hover:bg-status-errorBg transition-all text-left"
                  >
                    <LogOut size={18} className="shrink-0" />
                    <span>Sair</span>
                  </button>
                </li>
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

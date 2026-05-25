"use client";

import React, { useEffect, useState, useRef } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { Search, Shield, ChevronDown, User, LogOut, ArrowLeft, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui";
import { AdminNotificationDropdown } from "@/components/admin/NotificationDropdown";
import { AdminGlobalSearch } from "@/components/admin/AdminGlobalSearch";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }

      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle click outside for profile dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="min-h-screen bg-background-primary flex">
      {/* Sidebar space placeholder */}
      <div className="hidden lg:block w-[240px] shrink-0" aria-hidden="true" />

      {/* Fixed sidebar */}
      <AdminSidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin topbar */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-5 bg-background-secondary/90 backdrop-blur-md border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-accent-secondary" />
            <span className="text-sm font-semibold text-content-primary">
              Painel Admin
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-background-tertiary transition-colors"
              title="Pesquisar (Ctrl+K)"
            >
              <Search size={18} />
            </button>
            
            <AdminNotificationDropdown />

            <div className="relative pl-2 border-l border-border-subtle ml-1" ref={profileRef}>
              <button
                className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-background-tertiary transition-colors duration-150"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="Menu do perfil admin"
                aria-expanded={profileOpen}
              >
                <Avatar
                  src={user?.avatar}
                  name={user?.name || "Dr Marcelo"}
                  size="sm"
                  className="w-7 h-7"
                />
                <span className="text-xs font-medium text-content-primary hidden sm:block">
                  {user?.name || "Dr. Marcelo"}
                </span>
                <ChevronDown
                  size={14}
                  className={cn(
                    "text-content-secondary transition-transform duration-200 hidden sm:block",
                    profileOpen && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-52 bg-background-secondary border border-border-subtle rounded-2xl shadow-2xl overflow-hidden z-50"
                    role="menu"
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-border-subtle bg-background-tertiary/20">
                      <p className="text-xs font-semibold text-content-primary truncate">{user?.name || "Dr. Marcelo"}</p>
                      <p className="text-[10px] text-content-secondary truncate mt-0.5">{user?.email || "marcelo@email.com"}</p>
                    </div>

                    {/* Menu items */}
                    {[
                      { icon: User, label: "Meu perfil", href: "/perfil" },
                      { icon: Bell, label: "Notificações", href: "/admin/notificacoes" },
                      { icon: ArrowLeft, label: "Voltar à plataforma", href: "/" },
                    ].map(({ icon: Icon, label, href }) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs text-content-secondary hover:text-content-primary hover:bg-background-tertiary transition-colors"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Icon size={14} className="text-content-secondary shrink-0" />
                        <span>{label}</span>
                      </Link>
                    ))}

                    <div className="border-t border-border-subtle">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          void logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-status-error hover:bg-status-errorBg transition-colors text-left font-medium"
                        role="menuitem"
                      >
                        <LogOut size={14} className="shrink-0" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <AdminBottomNav />

      <AdminGlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}


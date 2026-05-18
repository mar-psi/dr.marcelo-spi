"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Search,
  Bell,
  User,
  Trophy,
  CreditCard,
  LogOut,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Badge } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchNotificationsForUser,
  markNotificationsRead,
  type NotificationItem,
} from "@/lib/notifications";

function formatRelative(dateString: string) {
  const diffMs = new Date(dateString).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (60 * 1000));
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}

export function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuth();
  const unreadCount = notifications.filter((n) => n.unread).length;

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      if (!user?.id) {
        setNotifications([]);
        return;
      }

      try {
        const items = await fetchNotificationsForUser(user.id, 12);
        if (!active) return;
        setNotifications(items);
      } catch {
        if (!active) return;
        setNotifications([]);
      }
    };

    void loadNotifications();

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (notifOpen && user?.id) {
      void fetchNotificationsForUser(user.id, 12)
        .then((items) => setNotifications(items))
        .catch(() => setNotifications([]));
    }
  }, [notifOpen, user?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user?.id) return;
    const unreadIds = notifications.filter((notification) => notification.unread).map((notification) => notification.id);
    if (unreadIds.length === 0) return;

    await markNotificationsRead(user.id, unreadIds);
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
        readAt: notification.readAt ?? new Date().toISOString(),
      }))
    );
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-40 h-16 flex items-center px-4 lg:px-6",
        "transition-all duration-300",
        // On mobile: full width. On desktop: offset by sidebar width
        "left-0 lg:left-[240px]",
        scrolled
          ? "bg-[rgba(10,10,15,0.85)] backdrop-blur-md border-b border-border-subtle shadow-card"
          : "bg-transparent"
      )}
      role="banner"
    >
      {/* ── Logo (mobile only) ─────────────────────────── */}
      <Link
        href="/"
        className="flex lg:hidden items-center gap-2 mr-auto"
        aria-label="Dr. Marcelo Psiquiatra"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
          <Brain size={16} className="text-white" />
        </div>
        <span className="text-sm font-bold text-content-primary hidden sm:block">
          Dr. Marcelo <span className="text-accent-secondary">Psiquiatra</span>
        </span>
      </Link>

      {/* ── Search — desktop ───────────────────────────── */}
      <div className="hidden lg:flex flex-1 max-w-md mx-auto">
        <form onSubmit={handleSearch} className="w-full relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-content-disabled pointer-events-none"
          />
          <input
            type="search"
            placeholder="Buscar aulas, temas, conteúdos…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full h-9 bg-background-tertiary border border-border-subtle",
              "rounded-full pl-9 pr-4 text-sm text-content-primary",
              "placeholder:text-content-disabled outline-none",
              "focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]",
              "transition-all duration-200"
            )}
          />
        </form>
      </div>

      {/* ── Right actions ──────────────────────────────── */}
      <div className="flex items-center gap-1 ml-auto lg:ml-4">
        {/* Search icon — mobile */}
        <button
          className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-background-tertiary transition-colors"
          onClick={() => setSearchOpen(true)}
          aria-label="Abrir busca"
        >
          <Search size={18} />
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-background-tertiary transition-colors"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label={`Notificações${unreadCount > 0 ? ` — ${unreadCount} não lidas` : ""}`}
            aria-expanded={notifOpen}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-accent-primary text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-80 bg-background-secondary border border-border-subtle rounded-xl shadow-card overflow-hidden"
                role="menu"
                aria-label="Notificações"
              >
                <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-content-primary">Notificações</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => void markAllNotificationsRead()}
                      className="text-[10px] font-bold text-accent-secondary hover:text-accent-primary transition-colors"
                    >
                      {unreadCount} novas
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "px-4 py-3 flex items-start gap-3 border-b border-border-subtle last:border-0 cursor-pointer",
                        "hover:bg-background-tertiary transition-colors duration-150",
                        n.unread && "bg-[rgba(124,58,237,0.04)]"
                      )}
                      role="menuitem"
                      onClick={() => {
                        if (user?.id && n.unread) {
                          void markNotificationsRead(user.id, [n.id]).then(() => {
                            setNotifications((current) =>
                              current.map((notification) =>
                                notification.id === n.id
                                  ? {
                                      ...notification,
                                      unread: false,
                                      readAt: new Date().toISOString(),
                                    }
                                  : notification
                              )
                            );
                          });
                        }

                        if (n.ctaUrl) {
                          setNotifOpen(false);
                          router.push(n.ctaUrl);
                        }
                      }}
                    >
                      {n.unread && (
                        <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-primary" />
                      )}
                      <div className={cn("flex-1 min-w-0", !n.unread && "ml-[18px]")}>
                        <p className="text-xs text-content-primary leading-relaxed font-medium">{n.title}</p>
                        <p className="text-xs text-content-secondary mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-xs text-content-disabled mt-0.5">{formatRelative(n.sentAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 text-center">
                  {notifications.length === 0 ? (
                    <span className="text-xs text-content-disabled">Sem novas notificações</span>
                  ) : (
                    <button
                      onClick={() => void markAllNotificationsRead()}
                      className="text-xs text-accent-secondary hover:text-accent-primary transition-colors"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar + dropdown */}
        <div ref={profileRef} className="relative ml-1">
          <button
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-background-tertiary transition-colors"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="Menu do perfil"
            aria-expanded={profileOpen}
          >
            <Avatar
              src={user?.avatar}
              name={user?.name || "Dr Marcelo"}
              size="sm"
            />
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
                className="absolute right-0 top-11 w-52 bg-background-secondary border border-border-subtle rounded-xl shadow-card overflow-hidden"
                role="menu"
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-border-subtle">
                  <p className="text-sm font-semibold text-content-primary truncate">{user?.name || "Dr. Marcelo"}</p>
                  <p className="text-xs text-content-secondary truncate">{user?.email || "marcelo@email.com"}</p>
                  <Badge variant={user?.plan === "assinante" ? "success" : "free"} size="sm" className="mt-1.5">
                    {user?.plan === "assinante" ? "Assinante" : "Gratuito"}
                  </Badge>
                </div>

                {/* Admin Panel link */}
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-accent-secondary font-bold hover:bg-background-tertiary transition-colors border-b border-border-subtle"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Trophy size={15} />
                    Painel Admin
                  </Link>
                )}

                {/* Menu items */}
                {[
                  { icon: User, label: "Meu perfil", href: "/perfil" },
                  { icon: Trophy, label: "Minhas conquistas", href: "/conquistas" },
                  { icon: CreditCard, label: "Gerenciar assinatura", href: "/assinatura" },
                ].map(({ icon: Icon, label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-content-secondary hover:text-content-primary hover:bg-background-tertiary transition-colors"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                ))}

                <div className="border-t border-border-subtle">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-status-error hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                    role="menuitem"
                  >
                    <LogOut size={15} />
                    Sair
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Search fullscreen overlay (mobile) ─────────── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background-primary/95 backdrop-blur-sm flex flex-col px-4 pt-4"
          >
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-content-disabled"
                />
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Buscar aulas, temas, conteúdos…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 bg-background-tertiary border border-border-DEFAULT rounded-xl pl-9 pr-4 text-sm text-content-primary placeholder:text-content-disabled outline-none focus:border-accent-primary"
                />
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="w-11 h-11 rounded-xl bg-background-tertiary flex items-center justify-center text-content-secondary hover:text-content-primary transition-colors"
                aria-label="Fechar busca"
              >
                <X size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

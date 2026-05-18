"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
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

export function AdminNotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    try {
      const items = await fetchNotificationsForUser(user.id, 8);
      setNotifications(items);
    } catch {
      setNotifications([]);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (isOpen) {
      void loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.unread).length,
    [notifications]
  );

  const markAllRead = async () => {
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          "relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
          isOpen
            ? "bg-accent-primary text-white shadow-glow"
            : "text-content-secondary hover:text-content-primary hover:bg-background-tertiary"
        )}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-status-error border-2 border-background-secondary" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-background-secondary border border-border-subtle rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between bg-background-tertiary/30">
              <h3 className="text-sm font-bold text-content-primary">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => void markAllRead()}
                  className="text-[10px] font-bold text-accent-secondary hover:text-accent-primary transition-colors flex items-center gap-1"
                >
                  <Check size={10} />
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-hide py-1">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="w-full text-left px-4 py-3 hover:bg-background-tertiary transition-colors border-b border-border-subtle/50 last:border-0 group"
                  >
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background-tertiary flex items-center justify-center text-sm shrink-0 group-hover:bg-background-secondary transition-colors">
                        <Bell size={14} className="text-accent-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-content-primary font-medium leading-relaxed">
                          {notification.title}
                        </p>
                        <p className="text-[11px] text-content-secondary mt-0.5 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-content-disabled font-medium">
                            {formatRelative(notification.sentAt)}
                          </span>
                          <span className="text-[10px] text-accent-secondary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            Histórico <ExternalLink size={8} />
                          </span>
                        </div>
                      </div>
                      {notification.unread && (
                        <span className="shrink-0 mt-2 w-2 h-2 rounded-full bg-accent-primary" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-content-disabled italic">Nenhuma notificação</p>
                </div>
              )}
            </div>

            <div className="p-2 border-t border-border-subtle bg-background-tertiary/20">
              <Link
                href="/admin/notificacoes"
                className="block w-full py-2 rounded-lg text-[11px] font-bold text-center text-content-secondary hover:text-content-primary hover:bg-background-tertiary transition-all"
                onClick={() => setIsOpen(false)}
              >
                Ver todo o histórico
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

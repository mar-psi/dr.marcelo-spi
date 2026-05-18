"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "warning" | "info" | "achievement";

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  achievement: Trophy,
};

const colorMap = {
  success: "border-status-success/40 bg-status-successBg",
  error: "border-status-error/40 bg-status-errorBg",
  warning: "border-status-warning/40 bg-status-warningBg",
  info: "border-accent-primary/40 bg-[rgba(124,58,237,0.1)]",
  achievement: "border-[rgba(250,204,21,0.4)] bg-[rgba(250,204,21,0.08)]",
};

const iconColorMap = {
  success: "text-status-success",
  error: "text-status-error",
  warning: "text-status-warning",
  info: "text-accent-secondary",
  achievement: "text-yellow-400",
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
}) {
  const Icon = iconMap[toast.variant];
  const isAchievement = toast.variant === "achievement";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl border shadow-card backdrop-blur-sm",
        "bg-background-secondary min-w-[280px] max-w-[360px]",
        colorMap[toast.variant],
        isAchievement && "shadow-[0_0_20px_rgba(250,204,21,0.2)]"
      )}
    >
      {isAchievement ? (
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Icon size={22} className={iconColorMap[toast.variant]} />
        </motion.div>
      ) : (
        <Icon size={18} className={cn("shrink-0 mt-0.5", iconColorMap[toast.variant])} />
      )}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold text-content-primary", isAchievement && "text-yellow-400")}>
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs text-content-secondary mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-content-disabled hover:text-content-secondary transition-colors"
        aria-label="Fechar notificação"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ variant, title, message, duration = 4000 }: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const achievementDuration = variant === "achievement" ? 5000 : duration;
    setToasts((prev) => [...prev, { id, variant, title, message, duration: achievementDuration }]);
    setTimeout(() => removeToast(id), achievementDuration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2"
        aria-live="polite"
        aria-label="Notificações"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

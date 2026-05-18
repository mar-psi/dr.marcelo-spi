"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Plus,
  Send,
  Users,
  Crown,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button, Input, Select, useToast } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  fetchNotificationAudienceCounts,
  fetchNotificationHistory,
} from "@/lib/notifications";
import { useAuth } from "@/hooks/useAuth";
import type { NotificationTarget } from "@/types/database";

type HistoryItem = Awaited<ReturnType<typeof fetchNotificationHistory>>[number];

const targetLabel: Record<NotificationTarget, string> = {
  all: "Todos os usuários",
  subscribers: "Assinantes",
  free: "Usuários gratuitos",
};

const targetIcon: Record<NotificationTarget, React.ElementType> = {
  all: Users,
  subscribers: Crown,
  free: Users,
};

function SendNotificationModal({
  isOpen,
  onClose,
  onSent,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSent: () => Promise<void>;
}) {
  const supabase = createSupabaseBrowserClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [target, setTarget] = useState<NotificationTarget>("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [counts, setCounts] = useState({ all: 0, subscribers: 0, free: 0 });

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const loadCounts = async () => {
      try {
        const nextCounts = await fetchNotificationAudienceCounts();
        if (!active) return;
        setCounts(nextCounts);
      } catch {
        if (!active) return;
        setCounts({ all: 0, subscribers: 0, free: 0 });
      }
    };

    void loadCounts();
    return () => {
      active = false;
    };
  }, [isOpen]);

  const reset = () => {
    setSent(false);
    setTarget("all");
    setTitle("");
    setMessage("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !message.trim() || !user?.id) return;

    setLoading(true);
    const targetCount = counts[target];

    const { error } = await supabase.from("notifications").insert({
      title: title.trim(),
      message: message.trim(),
      target,
      sent_to_count: targetCount,
      sent_at: new Date().toISOString(),
      created_by: user.id,
    });

    setLoading(false);

    if (error) {
      toast({
        variant: "error",
        title: "Não foi possível enviar a notificação",
        message: error.message,
      });
      return;
    }

    setSent(true);
    await onSent();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            className="relative z-10 w-full max-w-md bg-background-secondary rounded-2xl border border-border-subtle shadow-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <h2 className="text-base font-bold text-content-primary">Enviar Notificação</h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-content-secondary hover:bg-background-tertiary transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {!sent ? (
              <form onSubmit={handleSend} className="p-6 space-y-4">
                <Select
                  label="Destinatários"
                  value={target}
                  onChange={(event) => setTarget(event.target.value as NotificationTarget)}
                  options={[
                    { value: "all", label: `Todos os usuários (${counts.all.toLocaleString("pt-BR")})` },
                    {
                      value: "subscribers",
                      label: `Assinantes (${counts.subscribers.toLocaleString("pt-BR")})`,
                    },
                    { value: "free", label: `Usuários gratuitos (${counts.free.toLocaleString("pt-BR")})` },
                  ]}
                />

                <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-primary/8 border border-accent-primary/20">
                  <Bell size={13} className="text-accent-secondary" />
                  <p className="text-xs text-content-secondary">
                    Esta notificação será enviada para{" "}
                    <span className="font-bold text-accent-secondary">
                      {counts[target].toLocaleString("pt-BR")} pessoas
                    </span>
                  </p>
                </div>

                <Input
                  label="Título"
                  placeholder="Ex: Nova aula disponível!"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />

                <div>
                  <label className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-2 block">
                    Mensagem
                  </label>
                  <textarea
                    placeholder="Escreva a mensagem da notificação..."
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={3}
                    className={cn(
                      "w-full bg-background-tertiary border border-border-DEFAULT rounded-xl px-4 py-3",
                      "text-sm text-content-primary placeholder:text-content-disabled",
                      "outline-none focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]",
                      "transition-all duration-200 resize-none"
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" size="sm" type="button" fullWidth onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    type="submit"
                    loading={loading}
                    disabled={!title.trim() || !message.trim()}
                    leftIcon={<Send size={14} />}
                  >
                    Enviar agora
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-14 h-14 rounded-full bg-status-successBg border border-[rgba(34,197,94,0.3)] flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 size={24} className="text-status-success" />
                </motion.div>
                <h3 className="text-lg font-bold text-content-primary mb-2">Notificação enviada!</h3>
                <p className="text-sm text-content-secondary mb-5">
                  &quot;{title}&quot; foi enviada para{" "}
                  <span className="font-semibold text-content-primary">
                    {counts[target].toLocaleString("pt-BR")} usuários
                  </span>
                </p>
                <Button variant="primary" size="sm" fullWidth onClick={handleClose}>
                  Fechar
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function AdminNotificacoesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchNotificationHistory();
      setHistory(items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return (
    <div className="px-5 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-content-primary mb-1">Notificações</h1>
          <p className="text-sm text-content-secondary">Envie comunicados para os usuários da plataforma</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => setModalOpen(true)}
        >
          Nova notificação
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-sm text-content-secondary">Carregando notificações...</div>
        ) : history.length > 0 ? (
          history.map((notification, index) => {
            const Icon = targetIcon[notification.target] ?? Users;
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="bg-background-secondary rounded-2xl border border-border-subtle p-5 hover:border-accent-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-primary/15 border border-accent-primary/30 flex items-center justify-center shrink-0">
                    <Bell size={16} className="text-accent-secondary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="text-sm font-bold text-content-primary">{notification.title}</h3>
                      <span className="text-xs text-content-disabled shrink-0">
                        {formatDate(notification.sentAt.split("T")[0])}
                      </span>
                    </div>
                    <p className="text-sm text-content-secondary mb-3 leading-relaxed">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-content-secondary">
                        <Icon size={12} className="text-content-disabled" />
                        <span>{targetLabel[notification.target]}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium text-content-primary">
                        <Send size={10} className="text-content-disabled" />
                        <span>{notification.sentTo.toLocaleString("pt-BR")} enviados</span>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs font-bold",
                          notification.openRate >= 60 ? "text-status-success" : "text-status-warning"
                        )}
                      >
                        <CheckCircle2 size={10} />
                        <span>{notification.openRate}% abertura</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="py-12 text-center text-sm text-content-secondary">
            Nenhuma notificação enviada ainda.
          </div>
        )}
      </div>

      <SendNotificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSent={loadHistory}
      />
    </div>
  );
}

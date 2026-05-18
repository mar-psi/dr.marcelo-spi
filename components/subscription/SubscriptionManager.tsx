"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  CreditCard,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Download,
  X,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button, Badge, ProgressBar } from "@/components/ui";
import { useSubscription } from "@/hooks/useSubscription";
import { formatDate, cn } from "@/lib/utils";

type ManagerTab = "overview" | "billing" | "settings";

const statusConfig = {
  ativo: {
    label: "Ativo",
    color: "text-status-success",
    bg: "bg-status-successBg border-[rgba(34,197,94,0.3)]",
    icon: CheckCircle2,
    badgeVariant: "success" as const,
  },
  cancelado: {
    label: "Cancelado",
    color: "text-status-error",
    bg: "bg-status-errorBg border-[rgba(239,68,68,0.3)]",
    icon: XCircle,
    badgeVariant: "error" as const,
  },
  suspenso: {
    label: "Suspenso",
    color: "text-status-warning",
    bg: "bg-status-warningBg border-[rgba(245,158,11,0.3)]",
    icon: AlertTriangle,
    badgeVariant: "warning" as const,
  },
  falhou: {
    label: "Falhou",
    color: "text-status-error",
    bg: "bg-status-errorBg border-[rgba(239,68,68,0.3)]",
    icon: AlertTriangle,
    badgeVariant: "error" as const,
  },
};

const billingStatusConfig = {
  pago: { label: "Pago", color: "text-status-success", bg: "bg-status-successBg" },
  pendente: { label: "Pendente", color: "text-status-warning", bg: "bg-status-warningBg" },
  falhou: { label: "Falhou", color: "text-status-error", bg: "bg-status-errorBg" },
};

function CancelModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [step, setStep] = useState<"confirm" | "reason" | "done">("confirm");
  const [reason, setReason] = useState("");

  const reasons = [
    "Conteúdo não atendeu minhas expectativas",
    "Preço alto para meu orçamento",
    "Não tenho tempo para usar a plataforma",
    "Encontrei outra plataforma",
    "É temporário, pretendo voltar",
    "Outro motivo",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            className="relative z-10 w-full max-w-md bg-background-secondary rounded-2xl border border-border-subtle p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-content-secondary hover:bg-background-tertiary transition-colors"
            >
              <X size={15} />
            </button>

            {step === "confirm" && (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-status-errorBg border border-[rgba(239,68,68,0.3)] flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle size={22} className="text-status-error" />
                  </div>
                  <h3 className="text-lg font-bold text-content-primary mb-2">
                    Cancelar assinatura?
                  </h3>
                  <p className="text-sm text-content-secondary leading-relaxed">
                    Você perderá acesso a todo o conteúdo exclusivo ao fim do
                    período atual. Tem certeza?
                  </p>
                </div>
                <div className="space-y-2 mb-6">
                  {[
                    "Acesso a todas as aulas",
                    "E-books e materiais",
                    "Quizzes interativos",
                    "Stories diários",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-content-secondary">
                      <XCircle size={14} className="text-status-error shrink-0" />
                      <span>Perda de acesso: {item}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" size="md" fullWidth onClick={onClose}>
                    Manter assinatura
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    fullWidth
                    onClick={() => setStep("reason")}
                  >
                    Continuar
                  </Button>
                </div>
              </>
            )}

            {step === "reason" && (
              <>
                <h3 className="text-lg font-bold text-content-primary mb-2">
                  Por que está cancelando?
                </h3>
                <p className="text-sm text-content-secondary mb-4">
                  Seu feedback nos ajuda a melhorar a plataforma.
                </p>
                <div className="space-y-2 mb-6">
                  {reasons.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl text-sm border transition-all duration-200",
                        reason === r
                          ? "border-status-error bg-status-errorBg text-status-error"
                          : "border-border-subtle bg-background-tertiary text-content-secondary hover:border-status-error/40"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" size="md" fullWidth onClick={() => setStep("confirm")}>
                    Voltar
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    fullWidth
                    disabled={!reason}
                    onClick={() => { onConfirm(); setStep("done"); }}
                  >
                    Confirmar cancelamento
                  </Button>
                </div>
              </>
            )}

            {step === "done" && (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">😢</div>
                <h3 className="text-lg font-bold text-content-primary mb-2">
                  Assinatura cancelada
                </h3>
                <p className="text-sm text-content-secondary mb-6 leading-relaxed">
                  Seu acesso continua até o fim do período atual. Sentiremos
                  sua falta!
                </p>
                <Button variant="primary" size="md" fullWidth onClick={onClose}>
                  Entendido
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function SubscriptionManager() {
  const { subscription, billingRecords, loading, refresh } = useSubscription();
  const [tab, setTab] = useState<ManagerTab>("overview");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<null | "cancel" | "pause" | "resume" | "sync">(null);

  const runAction = async (action: "cancel" | "pause" | "resume" | "sync") => {
    setActionLoading(action);
    try {
      const response = await fetch("/api/subscription/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel atualizar sua assinatura.");
      }

      await refresh();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-background-secondary p-5 animate-pulse h-40" />
    );
  }

  if (!subscription) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-background-secondary p-5">
        <p className="text-sm font-semibold text-content-primary mb-1">
          Nenhuma assinatura ativa
        </p>
        <p className="text-xs text-content-secondary">
          Quando o pagamento estiver conectado, os dados do plano aparecerão aqui.
        </p>
      </div>
    );
  }

  const sub = subscription;
  const billing = billingRecords;
  const displayStatus = sub.status;
  const cfg = statusConfig[displayStatus];
  const StatusIcon = cfg.icon;

  const tabs: { key: ManagerTab; label: string }[] = [
    { key: "overview", label: "Visão geral" },
    { key: "billing", label: "Cobranças" },
    { key: "settings", label: "Configurações" },
  ];

  return (
    <>
      {/* Status card */}
      <div
        className={cn(
          "rounded-2xl border p-5 mb-5 flex items-start gap-4",
          cfg.bg
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-background-secondary flex items-center justify-center shrink-0">
          <StatusIcon size={18} className={cfg.color} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-content-primary">{sub.planName}</p>
            <Badge variant={sub.cancelAtPeriodEnd ? "warning" : cfg.badgeVariant}>
              {sub.cancelAtPeriodEnd ? "Cancelamento agendado" : cfg.label}
            </Badge>
          </div>
          {!sub.cancelAtPeriodEnd ? (
            <p className="text-xs text-content-secondary">
              Próxima cobrança:{" "}
              <span className="font-semibold text-content-primary">
                {formatDate(sub.nextBillingDate)}
              </span>{" "}
              · R$15,00
            </p>
          ) : (
            <p className="text-xs text-status-warning">
              Sua renovação foi cancelada. O acesso segue liberado até o fim do período atual.
            </p>
          )}
        </div>
        {!sub.cancelAtPeriodEnd && (
          <div className="shrink-0">
            <span className="text-2xl font-bold text-content-primary">R$15</span>
            <span className="text-xs text-content-secondary">/mês</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-background-tertiary rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              tab === t.key
                ? "bg-background-secondary text-content-primary shadow-card"
                : "text-content-secondary hover:text-content-primary"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Overview ───────────────────────────── */}
        {tab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Details */}
            <div className="rounded-xl border border-border-subtle bg-background-secondary divide-y divide-border-subtle overflow-hidden">
                {[
                  { label: "Início da assinatura", value: formatDate(sub.startDate) },
                  { label: "Próxima cobrança", value: formatDate(sub.nextBillingDate) },
                  { label: "Valor mensal", value: "R$15,00" },
                  {
                    label: "Status",
                    value: sub.cancelAtPeriodEnd
                      ? "Cancelamento agendado"
                      : cfg.label,
                  },
                ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5">
                  <p className="text-sm text-content-secondary">{label}</p>
                  <p className="text-sm font-semibold text-content-primary">{value}</p>
                </div>
              ))}
            </div>

            {/* Days in cycle progress */}
            <div className="rounded-xl border border-border-subtle bg-background-secondary p-4">
              <p className="text-xs text-content-secondary mb-2 font-medium">
                Período atual
              </p>
              <ProgressBar value={60} color="primary" size="md" showPercentage label="Ciclo atual da assinatura" />
            </div>
          </motion.div>
        )}

        {/* ── Billing ────────────────────────────── */}
        {tab === "billing" && (
          <motion.div
            key="billing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="rounded-xl border border-border-subtle bg-background-secondary overflow-hidden">
              <div className="px-5 py-3 border-b border-border-subtle flex items-center justify-between">
                <p className="text-sm font-semibold text-content-primary">
                  Histórico de cobranças
                </p>
                <CreditCard size={14} className="text-content-disabled" />
              </div>
              {billing.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm font-medium text-content-primary">
                    Nenhuma cobrança sincronizada
                  </p>
                  <p className="text-xs text-content-secondary mt-1">
                    O historico sera preenchido pelo gateway de pagamento.
                  </p>
                </div>
              )}
              {billing.map((record) => {
                const st = billingStatusConfig[record.status];
                return (
                  <div
                    key={record.id}
                    className="flex items-center gap-4 px-5 py-4 border-b border-border-subtle last:border-0 hover:bg-background-tertiary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-background-tertiary flex items-center justify-center shrink-0">
                      <Calendar size={14} className="text-content-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-content-primary truncate">
                        {record.description}
                      </p>
                      <p className="text-xs text-content-disabled">
                        {formatDate(record.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-content-primary">
                        R${record.amount},00
                      </span>
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          st.bg,
                          st.color
                        )}
                      >
                        {st.label}
                      </span>
                      {record.invoiceUrl && (
                        <a
                          href={record.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-content-disabled hover:text-accent-secondary transition-colors"
                          aria-label="Baixar recibo"
                        >
                          <Download size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Settings ───────────────────────────── */}
        {tab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <a
              href={sub.canUpdatePaymentMethod ? "#" : "mailto:psiquefotmiga@hotmail.com"}
              className="flex items-center justify-between px-5 py-4 rounded-xl border border-border-subtle bg-background-secondary hover:border-accent-primary/40 hover:bg-background-tertiary transition-all group"
            >
              <div className="flex items-center gap-3">
                <CreditCard size={16} className="text-content-secondary group-hover:text-accent-secondary transition-colors" />
                <div>
                  <p className="text-sm font-medium text-content-primary">
                    Atualizar dados de pagamento
                  </p>
                  <p className="text-xs text-content-disabled">
                    {sub.canUpdatePaymentMethod
                      ? "Altere o cartao cadastrado"
                      : "Fluxo guiado sera liberado quando a tokenizacao do cartao estiver ativa"}
                  </p>
                </div>
              </div>
              <ExternalLink size={14} className="text-content-disabled group-hover:text-accent-secondary transition-colors" />
            </a>

            <button
              type="button"
              onClick={() => void runAction("sync")}
              disabled={actionLoading !== null}
              className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-border-subtle bg-background-secondary hover:border-accent-primary/40 hover:bg-background-tertiary transition-all group disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <RefreshCw size={16} className="text-content-secondary group-hover:text-accent-secondary transition-colors" />
                <div className="text-left">
                  <p className="text-sm font-medium text-content-primary">
                    Sincronizar assinatura
                  </p>
                  <p className="text-xs text-content-disabled">
                    Atualize o status com a informacao mais recente do Mercado Pago
                  </p>
                </div>
              </div>
              <ExternalLink size={14} className="text-content-disabled group-hover:text-accent-secondary transition-colors" />
            </button>

            {sub.canResume && (
              <button
                type="button"
                onClick={() => void runAction("resume")}
                disabled={actionLoading !== null}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-border-subtle bg-background-secondary hover:border-accent-primary/40 hover:bg-background-tertiary transition-all group disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <RefreshCw size={16} className="text-content-secondary group-hover:text-accent-secondary transition-colors" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-content-primary">
                      Reativar assinatura
                    </p>
                    <p className="text-xs text-content-disabled">
                      Tente retomar a cobranca recorrente no cartao atual
                    </p>
                  </div>
                </div>
                <ExternalLink size={14} className="text-content-disabled group-hover:text-accent-secondary transition-colors" />
              </button>
            )}

            {/* Danger zone */}
            <div className="rounded-xl border border-[rgba(239,68,68,0.2)] bg-status-errorBg/30 p-4">
              <p className="text-xs font-semibold text-status-error uppercase tracking-wider mb-3">
                Zona de perigo
              </p>
              {sub.canCancel && !sub.cancelAtPeriodEnd ? (
                <button
                  onClick={() => setCancelOpen(true)}
                  className="flex items-center gap-2 text-sm text-status-error hover:text-red-400 transition-colors font-medium"
                  disabled={actionLoading !== null}
                >
                  <XCircle size={15} />
                  Cancelar assinatura
                </button>
              ) : (
                <p className="text-xs text-content-disabled">
                  {sub.cancelAtPeriodEnd
                    ? "Sua renovacao ja foi cancelada. O acesso segue ate o fim do periodo."
                    : "Nenhuma acao destrutiva disponivel no momento."}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel modal */}
      <CancelModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          void runAction("cancel").finally(() => {
            setCancelOpen(false);
          });
        }}
      />
    </>
  );
}

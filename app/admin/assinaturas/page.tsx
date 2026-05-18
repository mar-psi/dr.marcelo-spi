"use client";

import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  X,
  RefreshCw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { Input, Avatar } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PLAN } from "@/data/subscription";
import type { Database } from "@/types/database";

type StatusFilter = "todos" | "ativo" | "cancelado" | "falhou";
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type PaymentTransactionRow = Database["public"]["Tables"]["payment_transactions"]["Row"];

interface AdminSubscriptionRow {
  id: string;
  userName: string;
  userEmail: string;
  startDate: string;
  nextBilling: string;
  amount: number;
  status: "ativo" | "cancelado" | "suspenso" | "falhou";
  provider: string | null;
  providerSubscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
  lastPaymentStatus: string | null;
}

const statusConfig = {
  ativo: { label: "Ativo", icon: CheckCircle2, color: "text-status-success", bg: "bg-status-successBg" },
  cancelado: { label: "Cancelado", icon: XCircle, color: "text-content-disabled", bg: "bg-background-tertiary" },
  suspenso: { label: "Suspenso", icon: AlertTriangle, color: "text-status-warning", bg: "bg-status-warningBg" },
  falhou: { label: "Falhou", icon: AlertTriangle, color: "text-status-error", bg: "bg-status-errorBg" },
};

function mapSubscriptionStatus(status: SubscriptionRow["status"]): AdminSubscriptionRow["status"] {
  if (status === "active" || status === "trialing") return "ativo";
  if (status === "cancelled") return "cancelado";
  if (status === "past_due") return "falhou";
  return "suspenso";
}

export default function AdminAssinaturasPage() {
  const supabase = createSupabaseBrowserClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    const [profilesResponse, subscriptionsResponse, transactionsResponse] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name,avatar_url,role,created_at,updated_at"),
      supabase
        .from("subscriptions")
        .select(
          "id,user_id,plan_id,status,current_period_start,current_period_end,cancel_at_period_end,provider,provider_customer_id,provider_subscription_id,last_payment_status,created_at,updated_at"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("payment_transactions")
        .select(
          "id,subscription_id,user_id,provider,provider_payment_id,provider_authorized_payment_id,amount_cents,status,created_at,updated_at"
        )
        .order("created_at", { ascending: false }),
    ]);

    if (profilesResponse.error || subscriptionsResponse.error || transactionsResponse.error) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    const profilesById = new Map<string, ProfileRow>();
    ((profilesResponse.data ?? []) as ProfileRow[]).forEach((profile) => {
      profilesById.set(profile.id, profile);
    });

    const latestTransactionBySubscription = new Map<string, PaymentTransactionRow>();
    ((transactionsResponse.data ?? []) as PaymentTransactionRow[]).forEach((transaction) => {
      if (!latestTransactionBySubscription.has(transaction.subscription_id)) {
        latestTransactionBySubscription.set(transaction.subscription_id, transaction);
      }
    });

    const mapped = ((subscriptionsResponse.data ?? []) as SubscriptionRow[]).map((subscription) => {
      const profile = profilesById.get(subscription.user_id);
      const transaction = latestTransactionBySubscription.get(subscription.id);
      return {
        id: subscription.id,
        userName: profile?.full_name || profile?.email?.split("@")[0] || "Aluno",
        userEmail: profile?.email || "Sem e-mail",
        startDate: subscription.current_period_start || subscription.created_at || new Date().toISOString(),
        nextBilling: subscription.current_period_end || "-",
        amount:
          transaction?.amount_cents && transaction.amount_cents > 0
            ? Math.round(transaction.amount_cents / 100)
            : PLAN.price,
        status: mapSubscriptionStatus(subscription.status),
        provider: subscription.provider,
        providerSubscriptionId: subscription.provider_subscription_id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        lastPaymentStatus: subscription.last_payment_status,
      } satisfies AdminSubscriptionRow;
    });

    setSubscriptions(mapped);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  const handleAction = useCallback(
    async (subscriptionId: string, action: "sync" | "pause" | "resume" | "cancel") => {
      setActionLoading(`${subscriptionId}:${action}`);
      try {
        const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });

        if (!response.ok) {
          throw new Error("Falha ao atualizar assinatura.");
        }

        await loadSubscriptions();
      } finally {
        setActionLoading(null);
      }
    },
    [loadSubscriptions]
  );

  const totalAtivos = subscriptions.filter((subscription) => subscription.status === "ativo").length;
  const mrrTotal = subscriptions
    .filter((subscription) => subscription.status === "ativo")
    .reduce((sum, subscription) => sum + subscription.amount, 0);
  const totalFalhou = subscriptions.filter((subscription) => subscription.status === "falhou").length;

  const filtered = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    return subscriptions.filter((subscription) => {
      const matchSearch =
        !normalizedSearch ||
        subscription.userName.toLowerCase().includes(normalizedSearch) ||
        subscription.userEmail.toLowerCase().includes(normalizedSearch);
      const matchStatus = statusFilter === "todos" || subscription.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [subscriptions, deferredSearch, statusFilter]);

  return (
    <div className="px-5 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-content-primary mb-1">Assinaturas</h1>
        <p className="text-sm text-content-secondary">Gerencie as assinaturas ativas e histórico de cobranças</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Assinantes ativos", value: totalAtivos, icon: CheckCircle2, color: "#22C55E" },
          { label: "MRR do mês", value: `R$${mrrTotal.toLocaleString("pt-BR")}`, icon: DollarSign, color: "#7C3AED" },
          { label: "Pagamentos falhos", value: totalFalhou, icon: AlertTriangle, color: "#EF4444" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-4 p-4 rounded-xl bg-background-secondary border border-border-subtle"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}18` }}
            >
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-content-primary">{value}</p>
              <p className="text-xs text-content-secondary">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leftIcon={<Search size={15} />}
            rightIcon={search ? <button onClick={() => setSearch("")}><X size={14} /></button> : null}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["todos", "ativo", "cancelado", "falhou"] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 capitalize",
                statusFilter === status
                  ? "bg-accent-primary/15 border-accent-primary/50 text-accent-secondary"
                  : "bg-background-secondary border-border-subtle text-content-secondary hover:border-accent-primary/30"
              )}
            >
              {status === "todos"
                ? "Todos"
                : status === "ativo"
                ? "Ativos"
                : status === "cancelado"
                ? "Cancelados"
                : "Pagamento falho"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-background-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-background-tertiary">
                <th className="text-left px-5 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider">Assinante</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider hidden md:table-cell">Início</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider hidden lg:table-cell">Próx. cobrança</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-content-secondary">
                    Carregando assinaturas...
                  </td>
                </tr>
              ) : (
                filtered.map((subscription, index) => {
                  const config = statusConfig[subscription.status];
                  const StatusIcon = config.icon;

                  return (
                    <motion.tr
                      key={subscription.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.04 }}
                      className="hover:bg-background-tertiary transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={subscription.userName} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-content-primary">{subscription.userName}</p>
                            <p className="text-xs text-content-disabled">{subscription.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-content-secondary hidden md:table-cell">
                        {formatDate(subscription.startDate)}
                      </td>
                      <td className="px-4 py-4 text-xs text-content-secondary hidden lg:table-cell">
                        {subscription.nextBilling === "-" ? "—" : formatDate(subscription.nextBilling)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-content-primary">R${subscription.amount},00</span>
                      </td>
                      <td className="px-4 py-4">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                            config.bg,
                            config.color
                          )}
                        >
                          <StatusIcon size={11} />
                          {config.label}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {subscription.status === "falhou" && (
                            <button
                              onClick={() => void handleAction(subscription.id, "sync")}
                              disabled={actionLoading === `${subscription.id}:sync`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-status-warning bg-status-warningBg hover:opacity-80 transition-opacity disabled:opacity-60"
                              title="Sincronizar assinatura"
                            >
                              <RefreshCw size={11} />
                              Sincronizar
                            </button>
                          )}
                          {subscription.status === "ativo" && (
                            <>
                              <button
                                onClick={() => void handleAction(subscription.id, "pause")}
                                disabled={actionLoading === `${subscription.id}:pause`}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-status-warning bg-status-warningBg hover:opacity-80 transition-opacity disabled:opacity-60"
                                title="Pausar assinatura"
                              >
                                <RefreshCw size={11} />
                                Pausar
                              </button>
                              <button
                                onClick={() => void handleAction(subscription.id, "cancel")}
                                disabled={actionLoading === `${subscription.id}:cancel`}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-status-error bg-status-errorBg hover:opacity-80 transition-opacity disabled:opacity-60"
                                title="Cancelar assinatura"
                              >
                                <XCircle size={11} />
                                Cancelar
                              </button>
                            </>
                          )}
                          {subscription.status === "suspenso" && (
                            <button
                              onClick={() => void handleAction(subscription.id, "resume")}
                              disabled={actionLoading === `${subscription.id}:resume`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-accent-secondary bg-accent-primary/15 hover:opacity-80 transition-opacity disabled:opacity-60"
                              title="Reativar assinatura"
                            >
                              <CheckCircle2 size={11} />
                              Reativar
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-content-secondary">Nenhuma assinatura encontrada.</div>
        )}
      </div>
    </div>
  );
}

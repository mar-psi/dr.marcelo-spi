"use client";

import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, X, UserX, Eye, ChevronUp, ChevronDown } from "lucide-react";
import { Input, Badge, Avatar } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type PlanFilter = "todos" | "assinante" | "gratuito";
type SortField = "name" | "joinedAt" | "lastAccess";
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: "gratuito" | "assinante";
  joinedAt: string;
  lastAccess: string;
  status: "ativo" | "inativo";
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: "asc" | "desc";
}) {
  if (sortField !== field) {
    return <ChevronDown size={12} className="opacity-30" />;
  }

  return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
}

export default function AdminUsuariosPage() {
  const supabase = createSupabaseBrowserClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [planFilter, setPlanFilter] = useState<PlanFilter>("todos");
  const [sortField, setSortField] = useState<SortField>("joinedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      setLoading(true);
      const [profilesResponse, subscriptionsResponse] = await Promise.all([
        supabase.from("profiles").select("id,email,full_name,avatar_url,role,created_at,updated_at"),
        supabase
          .from("subscriptions")
          .select(
            "id,user_id,plan_id,status,current_period_start,current_period_end,cancel_at_period_end,provider,provider_customer_id,provider_subscription_id,created_at,updated_at"
          ),
      ]);

      if (!active) return;
      if (profilesResponse.error || subscriptionsResponse.error) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const subscriptionsByUser = new Map<string, SubscriptionRow[]>();
      (subscriptionsResponse.data as SubscriptionRow[]).forEach((subscription) => {
        const current = subscriptionsByUser.get(subscription.user_id) ?? [];
        current.push(subscription);
        subscriptionsByUser.set(subscription.user_id, current);
      });

      const mapped = ((profilesResponse.data ?? []) as ProfileRow[]).map((profile) => {
        const subscriptions = subscriptionsByUser.get(profile.id) ?? [];
        const activeSubscription = subscriptions.find((item) => item.status === "active");

        return {
          id: profile.id,
          name: profile.full_name || profile.email?.split("@")[0] || "Aluno",
          email: profile.email || "Sem e-mail",
          avatar: profile.avatar_url || undefined,
          plan: activeSubscription ? "assinante" : "gratuito",
          joinedAt: profile.created_at || new Date().toISOString(),
          lastAccess: profile.updated_at || profile.created_at || new Date().toISOString(),
          status: activeSubscription ? "ativo" : "inativo",
        } satisfies AdminUserRow;
      });

      setUsers(mapped);
      setLoading(false);
    };

    void loadUsers();

    return () => {
      active = false;
    };
  }, [supabase]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return [...users]
      .filter((user) => {
        const matchSearch =
          !normalizedSearch ||
          user.name.toLowerCase().includes(normalizedSearch) ||
          user.email.toLowerCase().includes(normalizedSearch);
        const matchPlan = planFilter === "todos" || user.plan === planFilter;
        return matchSearch && matchPlan;
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortField === "name") return a.name.localeCompare(b.name) * dir;
        if (sortField === "joinedAt") return (a.joinedAt > b.joinedAt ? 1 : -1) * dir;
        return (a.lastAccess > b.lastAccess ? 1 : -1) * dir;
      });
  }, [users, deferredSearch, planFilter, sortField, sortDir]);

  return (
    <div className="px-5 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-content-primary mb-1">Usuários</h1>
        <p className="text-sm text-content-secondary">{users.length} usuários cadastrados</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar por nome ou email…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leftIcon={<Search size={15} />}
            rightIcon={search ? <button onClick={() => setSearch("")}><X size={14} /></button> : null}
          />
        </div>
        <div className="flex gap-2">
          {(["todos", "assinante", "gratuito"] as PlanFilter[]).map((plan) => (
            <button
              key={plan}
              onClick={() => setPlanFilter(plan)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 capitalize",
                planFilter === plan
                  ? "bg-accent-primary/15 border-accent-primary/50 text-accent-secondary"
                  : "bg-background-secondary border-border-subtle text-content-secondary hover:border-accent-primary/30"
              )}
            >
              {plan === "todos" ? "Todos" : plan === "assinante" ? "Assinantes" : "Gratuitos"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-background-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-background-tertiary">
                <th className="text-left px-5 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider">
                  <button
                    className="flex items-center gap-1 hover:text-content-secondary transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    Usuário <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider">
                  Plano
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider hidden md:table-cell">
                  <button
                    className="flex items-center gap-1 hover:text-content-secondary transition-colors"
                    onClick={() => handleSort("joinedAt")}
                  >
                    Cadastro <SortIcon field="joinedAt" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider hidden lg:table-cell">
                  <button
                    className="flex items-center gap-1 hover:text-content-secondary transition-colors"
                    onClick={() => handleSort("lastAccess")}
                  >
                    Último acesso <SortIcon field="lastAccess" sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-content-disabled uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-content-secondary">
                    Carregando usuários...
                  </td>
                </tr>
              ) : (
                filtered.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.04 }}
                    className="hover:bg-background-tertiary transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} src={user.avatar} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-content-primary truncate">{user.name}</p>
                          <p className="text-xs text-content-disabled truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={user.plan === "assinante" ? "success" : "free"} size="sm">
                        {user.plan === "assinante" ? "Assinante" : "Gratuito"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs text-content-secondary hidden md:table-cell">
                      {formatDate(user.joinedAt)}
                    </td>
                    <td className="px-4 py-4 text-xs text-content-secondary hidden lg:table-cell">
                      {formatDate(user.lastAccess)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          user.status === "ativo"
                            ? "bg-status-successBg text-status-success"
                            : "bg-background-tertiary text-content-disabled"
                        )}
                      >
                        {user.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-content-disabled hover:text-content-primary hover:bg-background-tertiary transition-colors"
                          aria-label="Ver perfil"
                          title="Ver perfil"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-content-disabled hover:text-status-error hover:bg-status-errorBg transition-colors"
                          aria-label="Revogar acesso"
                          title="Revogar acesso"
                        >
                          <UserX size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-content-secondary">Nenhum usuário encontrado.</div>
        )}
      </div>
    </div>
  );
}

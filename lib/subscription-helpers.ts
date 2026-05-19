// Helpers para lógica de assinatura no servidor/cliente

export type SubscriptionStatus = "active" | "cancelled" | "suspended" | "none";

export interface SubscriptionState {
  status: SubscriptionStatus;
  expiresAt: string | null;
  planId: string | null;
}

/**
 * Verifica se o usuário tem acesso a conteúdo pago
 * Verifica acesso a partir do estado retornado pelo banco.
 */
export function hasActiveSubscription(state: SubscriptionState): boolean {
  if (state.status !== "active") return false;
  if (!state.expiresAt) return false;
  return new Date(state.expiresAt) > new Date();
}

/**
 * Verifica se o usuário pode acessar um conteúdo específico
 */
export function canAccessContent(
  isFree: boolean,
  state: SubscriptionState
): boolean {
  return isFree || hasActiveSubscription(state);
}

/**
 * Formata o status da assinatura para exibição
 */
export function formatSubscriptionStatus(
  status: SubscriptionStatus
): {
  label: string;
  color: string;
} {
  const map: Record<SubscriptionStatus, { label: string; color: string }> = {
    active: { label: "Ativo", color: "text-status-success" },
    cancelled: { label: "Cancelado", color: "text-status-error" },
    suspended: { label: "Suspenso", color: "text-status-warning" },
    none: { label: "Sem plano", color: "text-content-disabled" },
  };
  return map[status];
}

/**
 * Calcula dias restantes de acesso
 */
export function daysUntilExpiry(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Retorna mensagem de expiração para alertas
 */
export function getExpiryMessage(expiresAt: string | null): string | null {
  const days = daysUntilExpiry(expiresAt);
  if (days === 0) return "Sua assinatura expira hoje!";
  if (days <= 3) return `Sua assinatura expira em ${days} dia${days > 1 ? "s" : ""}!`;
  if (days <= 7) return `Sua assinatura expira em ${days} dias.`;
  return null;
}

/**
 * Prepara payload para criação de sessão de checkout
 * Chama a API route server-side, que deve criar a sessão no gateway configurado.
 */
export interface SubscriptionCardPayload {
  cardTokenId: string;
}

export async function createCheckoutSession(
  planId: string,
  _userId: string,
  successUrl: string,
  cancelUrl: string,
  card: SubscriptionCardPayload
): Promise<{ ok: boolean; subscriptionId: string | null; status: string | null; redirectUrl: string }> {
  const response = await fetch("/api/subscription/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId, successUrl, cancelUrl, cardTokenId: card.cardTokenId }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Erro ao criar sessão de checkout");
  }

  return response.json();
}

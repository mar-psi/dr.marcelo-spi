import { NextResponse } from "next/server";
import { PLAN, type UserSubscription } from "@/data/subscription";
import { getCurrentSubscription, requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type PaymentTransactionRow = Database["public"]["Tables"]["payment_transactions"]["Row"];

function mapSubscription(
  status: Awaited<ReturnType<typeof getCurrentSubscription>>,
  row: SubscriptionRow | null
): UserSubscription | null {
  if (!status.isActive) return null;

  const isCancelScheduled =
    row?.status === "cancelled" &&
    Boolean(row.current_period_end) &&
    new Date(row.current_period_end ?? 0).getTime() > Date.now();

  const mappedStatus: UserSubscription["status"] =
    row?.status === "past_due"
      ? "falhou"
      : row?.status === "cancelled" && !isCancelScheduled
        ? "cancelado"
        : row?.status === "suspended"
          ? "suspenso"
          : "ativo";

  return {
    id: row?.id ?? "",
    isActive: status.isActive,
    planName: PLAN.name,
    startDate: row?.current_period_start ?? row?.created_at ?? "",
    nextBillingDate: status.nextBillingDate ?? "",
    amount: PLAN.price,
    status: mappedStatus,
    cancelAtPeriodEnd: status.cancelAtPeriodEnd || isCancelScheduled,
    provider: row?.provider ?? null,
    paymentMethodLabel: row?.provider_payment_method ?? null,
    canCancel: mappedStatus === "ativo",
    canPause: mappedStatus === "ativo",
    canResume: mappedStatus === "suspenso",
    canUpdatePaymentMethod: false,
  };
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const admin = createSupabaseAdminClient();
    const status = await getCurrentSubscription(user.id);
    const { data: subscriptionRow } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: transactions } = await admin
      .from("payment_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(24);

    return NextResponse.json({
      ...status,
      subscription: mapSubscription(status, (subscriptionRow as SubscriptionRow | null) ?? null),
      billingRecords: ((transactions ?? []) as PaymentTransactionRow[]).map((record) => ({
        id: record.id,
        date: record.paid_at ?? record.due_date ?? record.created_at,
        amount: Math.round(record.amount_cents / 100),
        status:
          record.status === "approved" || record.status === "authorized"
            ? "pago"
            : record.status === "pending" || record.status === "in_process"
              ? "pendente"
              : "falhou",
        description: record.description || "Cobranca da assinatura",
        invoiceUrl: record.receipt_url ?? record.invoice_url ?? undefined,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao verificar assinatura" },
      { status: 500 }
    );
  }
}

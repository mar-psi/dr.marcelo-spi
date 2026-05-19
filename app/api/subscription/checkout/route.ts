import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { PLAN } from "@/data/subscription";
import { requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";
import {
  createMercadoPagoSubscription,
  hasMercadoPagoConfig,
  mapMercadoPagoSubscriptionStatus,
} from "@/lib/payments/mercadopago";

export const dynamic = "force-dynamic";

function toJsonRecord(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function getSafeInternalUrl(raw: string | null | undefined, origin: string) {
  if (!raw) return null;

  try {
    const url = new URL(raw, origin);
    if (url.origin === origin && url.pathname.startsWith("/")) {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = await req.json();
    const { planId, successUrl, cancelUrl } = body;
    const cardTokenId = typeof body.cardTokenId === "string" ? body.cardTokenId.trim() : "";

    if (!planId || planId !== PLAN.id) {
      return NextResponse.json(
        { error: "Plano invalido" },
        { status: 400 }
      );
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: "URLs de sucesso e cancelamento sao obrigatorias" },
        { status: 400 }
      );
    }

    const successTarget = getSafeInternalUrl(successUrl, req.nextUrl.origin);
    const cancelTarget = getSafeInternalUrl(cancelUrl, req.nextUrl.origin);

    if (!successTarget || !cancelTarget) {
      return NextResponse.json(
        { error: "As URLs do checkout precisam apontar para rotas internas do app." },
        { status: 400 }
      );
    }

    if (!cardTokenId) {
      return NextResponse.json(
        { error: "Informe os dados do cartao para concluir a assinatura." },
        { status: 400 }
      );
    }

    if (!hasMercadoPagoConfig()) {
      return NextResponse.json(
        {
          error:
            "Mercado Pago ainda nao configurado. Preencha as credenciais quando o gateway for ativado.",
        },
        { status: 501 }
      );
    }

    const admin = createSupabaseAdminClient();
    const { data: existingSubscription } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      existingSubscription &&
      (existingSubscription.status === "active" ||
        existingSubscription.status === "trialing") &&
      !existingSubscription.cancel_at_period_end
    ) {
      return NextResponse.json(
        { error: "O usuario ja possui uma assinatura ativa." },
        { status: 409 }
      );
    }

    const subscription = await createMercadoPagoSubscription({
      userId: user.id,
      payerEmail: user.email,
      planId,
      planName: PLAN.name,
      amount: PLAN.price,
      backUrl: successTarget,
      cardTokenId,
      idempotencyKey: `mp-sub-${user.id}-${planId}-${randomUUID()}`,
    });

    const { data: insertedSubscription, error: insertError } = await admin.from("subscriptions").insert({
      user_id: user.id,
      plan_id: planId,
      status: mapMercadoPagoSubscriptionStatus(subscription.resource.status),
      current_period_start:
        subscription.resource.auto_recurring?.start_date ?? subscription.resource.date_created ?? null,
      current_period_end: subscription.resource.next_payment_date ?? null,
      cancel_at_period_end: false,
      provider: "mercado_pago",
      provider_customer_id:
        subscription.resource.payer_id !== undefined && subscription.resource.payer_id !== null
          ? String(subscription.resource.payer_id)
          : null,
      provider_subscription_id: subscription.resource.id,
      external_reference: subscription.externalReference,
      provider_plan_id: subscription.resource.preapproval_plan_id ?? null,
      provider_status: subscription.resource.status ?? null,
      provider_payment_method: subscription.resource.payment_method_id ?? null,
      provider_payer_email: subscription.resource.payer_email ?? user.email,
      provider_checkout_url: subscription.checkoutUrl,
      metadata: {
        checkoutSuccessUrl: successTarget,
        checkoutCancelUrl: cancelTarget,
        mercadoPago: toJsonRecord(subscription.resource),
      },
    }).select("id,status").single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json(
      {
        ok: true,
        subscriptionId: insertedSubscription?.id ?? null,
        status: insertedSubscription?.status ?? null,
        redirectUrl: successTarget,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    if (error instanceof Error && error.message.startsWith("Mercado Pago ")) {
      return NextResponse.json(
        { error: "Nao foi possivel aprovar o cartao. Confira os dados ou tente outro cartao." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno ao criar checkout" },
      { status: 500 }
    );
  }
}

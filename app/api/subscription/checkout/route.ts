import { NextRequest, NextResponse } from "next/server";
import { PLAN } from "@/data/subscription";
import { requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";
import {
  createMercadoPagoSubscriptionCheckout,
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

    if (
      existingSubscription?.provider_checkout_url &&
      existingSubscription.provider === "mercado_pago" &&
      existingSubscription.status === "suspended"
    ) {
      return NextResponse.json({ url: existingSubscription.provider_checkout_url });
    }

    const checkout = await createMercadoPagoSubscriptionCheckout({
      userId: user.id,
      payerEmail: user.email,
      planId,
      planName: PLAN.name,
      amount: PLAN.price,
      backUrl: successTarget,
    });

    await admin.from("subscriptions").insert({
      user_id: user.id,
      plan_id: planId,
      status: mapMercadoPagoSubscriptionStatus(checkout.resource.status),
      current_period_start:
        checkout.resource.auto_recurring?.start_date ?? checkout.resource.date_created ?? null,
      current_period_end: checkout.resource.next_payment_date ?? null,
      cancel_at_period_end: false,
      provider: "mercado_pago",
      provider_customer_id:
        checkout.resource.payer_id !== undefined && checkout.resource.payer_id !== null
          ? String(checkout.resource.payer_id)
          : null,
      provider_subscription_id: checkout.resource.id,
      external_reference: checkout.externalReference,
      provider_plan_id: checkout.resource.preapproval_plan_id ?? null,
      provider_status: checkout.resource.status ?? null,
      provider_payment_method: checkout.resource.payment_method_id ?? null,
      provider_payer_email: checkout.resource.payer_email ?? user.email,
      provider_checkout_url: checkout.checkoutUrl,
      metadata: {
        checkoutSuccessUrl: successTarget,
        checkoutCancelUrl: cancelTarget,
        mercadoPago: toJsonRecord(checkout.resource),
      },
    });

    return NextResponse.json(
      { url: checkout.checkoutUrl },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno ao criar checkout" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { processPendingEmailJobs } from "@/lib/email/resend";
import {
  verifyMercadoPagoWebhookSignature,
  type MercadoPagoWebhookEnvelope,
} from "@/lib/payments/mercadopago";
import {
  syncMercadoPagoAuthorizedPaymentById,
  syncMercadoPagoPaymentById,
  syncMercadoPagoSubscriptionById,
} from "@/lib/payments/subscription-lifecycle";
import type { Json } from "@/types/database";

export const dynamic = "force-dynamic";

function toJsonRecord(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

export async function POST(req: NextRequest) {
  try {
    if (
      !verifyMercadoPagoWebhookSignature({
        signatureHeader: req.headers.get("x-signature"),
        requestIdHeader: req.headers.get("x-request-id"),
        requestUrl: req.nextUrl,
      })
    ) {
      return NextResponse.json({ error: "Assinatura invalida" }, { status: 401 });
    }

    const payload = (await req.json()) as MercadoPagoWebhookEnvelope;
    const resourceId =
      payload.data?.id !== undefined && payload.data?.id !== null
        ? String(payload.data.id)
        : null;
    const eventType = payload.type ?? req.nextUrl.searchParams.get("type") ?? "unknown";
    const action = payload.action ?? null;

    const admin = createSupabaseAdminClient();
    await admin.from("payment_webhook_events").upsert(
      {
        provider: "mercado_pago",
        event_type: eventType,
        action,
        external_resource_id: resourceId,
        request_id: req.headers.get("x-request-id"),
        signature_ts: Number(req.headers.get("x-signature")?.match(/ts=(\d+)/)?.[1] ?? 0) || null,
        payload: toJsonRecord(payload),
        query_params: toJsonRecord(Object.fromEntries(req.nextUrl.searchParams.entries())),
        processing_status: "processing",
      },
      { onConflict: "provider,request_id" }
    );

    if (resourceId) {
      if (eventType === "subscription_preapproval") {
        await syncMercadoPagoSubscriptionById(resourceId);
      } else if (eventType === "subscription_authorized_payment") {
        await syncMercadoPagoAuthorizedPaymentById(resourceId);
      } else if (eventType === "payment") {
        await syncMercadoPagoPaymentById(resourceId);
      }
    }

    await processPendingEmailJobs(admin, 5).catch(async (error) => {
      await admin.from("payment_webhook_events").upsert(
        {
          provider: "mercado_pago",
          event_type: "email_jobs",
          action: "process_after_webhook",
          external_resource_id: resourceId,
          request_id: `${req.headers.get("x-request-id") ?? crypto.randomUUID()}:email`,
          payload: {},
          query_params: {},
          processing_status: "failed",
          processing_error: error instanceof Error ? error.message : "Falha ao processar e-mails.",
          processed_at: new Date().toISOString(),
        },
        { onConflict: "provider,request_id" }
      );
    });

    await admin
      .from("payment_webhook_events")
      .update({
        processing_status: "processed",
        processed_at: new Date().toISOString(),
      })
      .eq("provider", "mercado_pago")
      .eq("request_id", req.headers.get("x-request-id") ?? "");

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const admin = createSupabaseAdminClient();
    const requestId = req.headers.get("x-request-id");

    if (requestId) {
      await admin
        .from("payment_webhook_events")
        .update({
          processing_status: "failed",
          processing_error: error instanceof Error ? error.message : "Webhook processing failed",
          processed_at: new Date().toISOString(),
        })
        .eq("provider", "mercado_pago")
        .eq("request_id", requestId);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 400 }
    );
  }
}

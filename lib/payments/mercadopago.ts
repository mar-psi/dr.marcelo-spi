import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export interface MercadoPagoWebhookEnvelope {
  action?: string;
  api_version?: string;
  data?: {
    id?: string | number;
  };
  date_created?: string;
  id?: string | number;
  live_mode?: boolean;
  type?: string;
  user_id?: number;
}

export interface MercadoPagoSubscriptionResource {
  id: string;
  payer_id?: string | number | null;
  payer_email?: string | null;
  back_url?: string | null;
  reason?: string | null;
  external_reference?: string | null;
  status?: string | null;
  init_point?: string | null;
  sandbox_init_point?: string | null;
  next_payment_date?: string | null;
  date_created?: string | null;
  last_modified?: string | null;
  payment_method_id?: string | null;
  preapproval_plan_id?: string | null;
  auto_recurring?: {
    frequency?: number | null;
    frequency_type?: string | null;
    transaction_amount?: number | null;
    currency_id?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  } | null;
  summarized?: {
    charged_quantity?: number | null;
    charged_amount?: number | null;
    last_charged_date?: string | null;
    last_charged_amount?: number | null;
    pending_charge_quantity?: number | null;
    pending_charge_amount?: number | null;
    quotas?: number | null;
    semaphore?: string | null;
  } | null;
}

export interface MercadoPagoPaymentResource {
  id: string | number;
  status?: string | null;
  status_detail?: string | null;
  transaction_amount?: number | null;
  currency_id?: string | null;
  date_created?: string | null;
  date_approved?: string | null;
  date_last_updated?: string | null;
  description?: string | null;
  external_reference?: string | null;
  payment_method_id?: string | null;
  installments?: number | null;
  transaction_details?: {
    external_resource_url?: string | null;
    installment_amount?: number | null;
    net_received_amount?: number | null;
    total_paid_amount?: number | null;
  } | null;
  metadata?: Record<string, unknown> | null;
}

export interface MercadoPagoAuthorizedPaymentResource {
  id: string | number;
  status?: string | null;
  reason?: string | null;
  external_reference?: string | null;
  description?: string | null;
  date_created?: string | null;
  last_modified?: string | null;
  debit_date?: string | null;
  payment_method_id?: string | null;
  installments?: number | null;
  retry_attempt?: number | null;
  amount?: number | null;
  original_amount?: number | null;
  currency_id?: string | null;
  summarized?: {
    quotas?: number | null;
    charged_quantity?: number | null;
    charged_amount?: number | null;
  } | null;
  payment?: MercadoPagoPaymentResource | null;
}

function accessTokenLooksLikeTest(accessToken: string) {
  return accessToken.startsWith("TEST-");
}

export function hasMercadoPagoConfig(): boolean {
  return Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN);
}

export function getMercadoPagoConfig() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN ausente.");
  }

  return {
    accessToken,
    webhookSecret:
      process.env.MERCADO_PAGO_WEBHOOK_SECRET ?? process.env.PAYMENT_WEBHOOK_SECRET ?? "",
    webhookToleranceMs: Number(process.env.MERCADO_PAGO_WEBHOOK_TOLERANCE_MS ?? "600000"),
    preapprovalPlanId: process.env.MERCADO_PAGO_PREAPPROVAL_PLAN_ID ?? "",
    integratorId: process.env.MERCADO_PAGO_INTEGRATOR_ID ?? "",
    appUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
    stageMode: accessTokenLooksLikeTest(accessToken),
  };
}

function mercadoPagoHeaders(idempotencyKey?: string) {
  const config = getMercadoPagoConfig();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.accessToken}`,
    "Content-Type": "application/json",
    "User-Agent": "dr-marcelopsiquiatra-mercadopago/1.0",
  };

  if (config.stageMode) {
    headers["X-Scope"] = "stage";
  }

  if (config.integratorId) {
    headers["x-integrator-id"] = config.integratorId;
  }

  if (idempotencyKey) {
    headers["X-Idempotency-Key"] = idempotencyKey;
  }

  return headers;
}

async function mercadoPagoRequest<TResponse>(
  path: string,
  init: {
    method?: "GET" | "POST" | "PUT";
    body?: unknown;
    idempotencyKey?: string;
  } = {}
): Promise<TResponse> {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    method: init.method ?? "GET",
    headers: mercadoPagoHeaders(init.idempotencyKey),
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mercado Pago ${response.status}: ${body}`);
  }

  return (await response.json()) as TResponse;
}

function buildNotificationUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return undefined;

  return `${siteUrl.replace(/\/$/, "")}/api/subscription/webhook?source_news=webhooks`;
}

export function buildSubscriptionExternalReference(userId: string, planId: string) {
  return `dr-marcelopsiquiatra:${userId}:${planId}`;
}

export async function createMercadoPagoSubscriptionCheckout(params: {
  userId: string;
  payerEmail: string;
  planId: string;
  planName: string;
  amount: number;
  currencyId?: string;
  backUrl: string;
}) {
  const config = getMercadoPagoConfig();
  const externalReference = buildSubscriptionExternalReference(params.userId, params.planId);
  const notificationUrl = buildNotificationUrl();

  const body: Record<string, unknown> = {
    reason: params.planName,
    external_reference: externalReference,
    payer_email: params.payerEmail,
    back_url: params.backUrl,
    status: "authorized",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: params.amount,
      currency_id: params.currencyId ?? "BRL",
      start_date: new Date().toISOString(),
    },
    payment_methods_allowed: {
      payment_types: [{ id: "credit_card" }],
    },
  };

  if (notificationUrl) {
    body.notification_url = notificationUrl;
  }

  if (config.preapprovalPlanId) {
    body.preapproval_plan_id = config.preapprovalPlanId;
  }

  const response = await mercadoPagoRequest<
    MercadoPagoSubscriptionResource & { init_point?: string | null; sandbox_init_point?: string | null }
  >("/preapproval", {
    method: "POST",
    body,
    idempotencyKey: `mp-sub-${params.userId}-${params.planId}`,
  });

  const checkoutUrl =
    response.init_point ?? response.sandbox_init_point ?? response.back_url ?? null;

  if (!checkoutUrl) {
    throw new Error("Mercado Pago nao retornou init_point para a assinatura.");
  }

  return {
    resource: response,
    checkoutUrl,
    externalReference,
  };
}

export function mapMercadoPagoSubscriptionStatus(status: string | null | undefined) {
  switch ((status ?? "").toLowerCase()) {
    case "authorized":
      return "active" as const;
    case "paused":
      return "suspended" as const;
    case "cancelled":
    case "canceled":
      return "cancelled" as const;
    case "pending":
      return "suspended" as const;
    default:
      return "suspended" as const;
  }
}

export function mapMercadoPagoPaymentStatus(status: string | null | undefined) {
  switch ((status ?? "").toLowerCase()) {
    case "approved":
      return "approved";
    case "authorized":
      return "authorized";
    case "in_process":
      return "in_process";
    case "rejected":
      return "rejected";
    case "refunded":
      return "refunded";
    case "cancelled":
    case "canceled":
      return "cancelled";
    case "pending":
    default:
      return "pending";
  }
}

export async function getMercadoPagoSubscription(subscriptionId: string) {
  return mercadoPagoRequest<MercadoPagoSubscriptionResource>(`/preapproval/${subscriptionId}`);
}

export async function updateMercadoPagoSubscription(
  subscriptionId: string,
  body: Record<string, unknown>
) {
  return mercadoPagoRequest<MercadoPagoSubscriptionResource>(`/preapproval/${subscriptionId}`, {
    method: "PUT",
    body,
  });
}

export async function getMercadoPagoPayment(paymentId: string) {
  return mercadoPagoRequest<MercadoPagoPaymentResource>(`/v1/payments/${paymentId}`);
}

export async function getMercadoPagoAuthorizedPayment(authorizedPaymentId: string) {
  return mercadoPagoRequest<MercadoPagoAuthorizedPaymentResource>(
    `/authorized_payments/${authorizedPaymentId}`
  );
}

function parseSignatureHeader(signatureHeader: string) {
  const parts = signatureHeader.split(",");
  let ts: string | null = null;
  let v1: string | null = null;

  for (const part of parts) {
    const [rawKey, rawValue] = part.split("=");
    const key = rawKey?.trim();
    const value = rawValue?.trim();
    if (!key || !value) continue;
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }

  return { ts, v1 };
}

function buildSignatureManifest(args: {
  requestId: string | null;
  ts: string | null;
  resourceId: string | null;
}) {
  const entries = [
    args.resourceId ? `id:${args.resourceId};` : null,
    args.requestId ? `request-id:${args.requestId};` : null,
    args.ts ? `ts:${args.ts};` : null,
  ].filter(Boolean);

  return entries.join("");
}

export function verifyMercadoPagoWebhookSignature(params: {
  signatureHeader: string | null;
  requestIdHeader: string | null;
  requestUrl: URL;
}) {
  const { webhookSecret, webhookToleranceMs } = getMercadoPagoConfig();

  if (!webhookSecret) {
    throw new Error(
      "MERCADO_PAGO_WEBHOOK_SECRET ausente. Configure a chave secreta do webhook do Mercado Pago."
    );
  }

  const { ts, v1 } = parseSignatureHeader(params.signatureHeader ?? "");
  if (!ts || !v1) return false;

  const timestamp = Number(ts);
  if (Number.isFinite(timestamp)) {
    const delay = Math.abs(Date.now() - timestamp);
    if (delay > webhookToleranceMs) {
      return false;
    }
  }

  const resourceId =
    params.requestUrl.searchParams.get("data.id")?.toLowerCase() ??
    params.requestUrl.searchParams.get("id")?.toLowerCase() ??
    null;

  const manifest = buildSignatureManifest({
    resourceId,
    requestId: params.requestIdHeader,
    ts,
  });

  if (!manifest) return false;

  const expected = createHmac("sha256", webhookSecret).update(manifest).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(v1, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

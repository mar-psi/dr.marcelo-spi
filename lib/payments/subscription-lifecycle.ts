import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getMercadoPagoAuthorizedPayment,
  getMercadoPagoPayment,
  getMercadoPagoSubscription,
  mapMercadoPagoPaymentStatus,
  mapMercadoPagoSubscriptionStatus,
  type MercadoPagoAuthorizedPaymentResource,
  type MercadoPagoPaymentResource,
  type MercadoPagoSubscriptionResource,
} from "@/lib/payments/mercadopago";
import type { Database, Json, SubscriptionStatus } from "@/types/database";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type PaymentTransactionRow = Database["public"]["Tables"]["payment_transactions"]["Row"];

function toJsonRecord(value: unknown): Json {
  if (value === null || value === undefined) return {};
  return JSON.parse(JSON.stringify(value)) as Json;
}

function amountToCents(amount: number | null | undefined) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return 0;
  return Math.round(amount * 100);
}

function inferSubscriptionStatus(params: {
  providerStatus: string | null | undefined;
  currentStatus?: SubscriptionStatus;
  latestPaymentStatus?: string | null;
}) {
  const providerMapped = mapMercadoPagoSubscriptionStatus(params.providerStatus);
  if (params.latestPaymentStatus === "rejected") {
    return "past_due" as const;
  }
  if (params.latestPaymentStatus === "in_process" && providerMapped === "active") {
    return "active" as const;
  }
  return providerMapped;
}

function buildLifecycleArtifacts(args: {
  userId: string;
  subscriptionId: string;
  userEmail: string | null;
  userName: string | null;
  eventKind:
    | "subscription_activated"
    | "subscription_cancelled"
    | "subscription_paused"
    | "payment_approved"
    | "payment_failed";
  transactionId?: string | null;
  amountCents?: number | null;
  nextBillingDate?: string | null;
}) {
  const amountLabel =
    typeof args.amountCents === "number"
      ? `R$ ${(args.amountCents / 100).toFixed(2).replace(".", ",")}`
      : "sua assinatura";

  const nextBillingLabel = args.nextBillingDate
    ? new Intl.DateTimeFormat("pt-BR").format(new Date(args.nextBillingDate))
    : null;

  switch (args.eventKind) {
    case "subscription_activated":
      return {
        notification: {
          title: "Assinatura ativa",
          message: nextBillingLabel
            ? `Seu acesso premium foi liberado. Proxima cobranca em ${nextBillingLabel}.`
            : "Seu acesso premium foi liberado com sucesso.",
          kind: "subscription",
          dedupeKey: `subscription:${args.subscriptionId}:activated`,
          ctaUrl: "/assinatura",
        },
        email: {
          templateKey: "subscription_activated",
          subject: "Sua assinatura foi ativada",
          dedupeKey: `subscription:${args.subscriptionId}:activated`,
          payload: {
            nextBillingDate: args.nextBillingDate,
            amountCents: args.amountCents,
          },
        },
      };
    case "subscription_cancelled":
      return {
        notification: {
          title: "Renovacao cancelada",
          message: nextBillingLabel
            ? `Sua renovacao automatica foi cancelada. O acesso segue liberado ate ${nextBillingLabel}.`
            : "Sua renovacao automatica foi cancelada.",
          kind: "subscription",
          dedupeKey: `subscription:${args.subscriptionId}:cancelled`,
          ctaUrl: "/assinatura",
        },
        email: {
          templateKey: "subscription_cancelled",
          subject: "Sua renovacao foi cancelada",
          dedupeKey: `subscription:${args.subscriptionId}:cancelled`,
          payload: {
            nextBillingDate: args.nextBillingDate,
          },
        },
      };
    case "subscription_paused":
      return {
        notification: {
          title: "Assinatura pausada",
          message: "Sua assinatura foi pausada e novas cobrancas estao temporariamente bloqueadas.",
          kind: "subscription",
          dedupeKey: `subscription:${args.subscriptionId}:paused`,
          ctaUrl: "/assinatura",
        },
        email: {
          templateKey: "subscription_paused",
          subject: "Sua assinatura foi pausada",
          dedupeKey: `subscription:${args.subscriptionId}:paused`,
          payload: {},
        },
      };
    case "payment_approved":
      return {
        notification: {
          title: "Pagamento aprovado",
          message: nextBillingLabel
            ? `Recebemos ${amountLabel}. Proxima cobranca prevista para ${nextBillingLabel}.`
            : `Recebemos ${amountLabel} da sua assinatura.`,
          kind: "billing",
          dedupeKey: `payment:${args.transactionId ?? args.subscriptionId}:approved`,
          ctaUrl: "/assinatura",
        },
        email: {
          templateKey: "subscription_renewed",
          subject: "Sua assinatura foi renovada",
          dedupeKey: `payment:${args.transactionId ?? args.subscriptionId}:approved`,
          payload: {
            amountCents: args.amountCents,
            nextBillingDate: args.nextBillingDate,
          },
        },
      };
    case "payment_failed":
    default:
      return {
        notification: {
          title: "Falha na cobranca",
          message:
            "Nao conseguimos processar a cobranca do seu cartao. Revise a assinatura para evitar perda de acesso.",
          kind: "billing",
          dedupeKey: `payment:${args.transactionId ?? args.subscriptionId}:failed`,
          ctaUrl: "/assinatura",
        },
        email: {
          templateKey: "subscription_payment_failed",
          subject: "Falha na renovacao da sua assinatura",
          dedupeKey: `payment:${args.transactionId ?? args.subscriptionId}:failed`,
          payload: {
            amountCents: args.amountCents,
          },
        },
      };
  }
}

async function enqueueLifecycleCommunication(
  admin: AdminClient,
  params: {
    userId: string;
    userEmail: string | null;
    userName: string | null;
    subscriptionId: string;
    eventKind:
      | "subscription_activated"
      | "subscription_cancelled"
      | "subscription_paused"
      | "payment_approved"
      | "payment_failed";
    transactionId?: string | null;
    amountCents?: number | null;
    nextBillingDate?: string | null;
  }
) {
  const { notification, email } = buildLifecycleArtifacts(params);

  await admin.from("notifications").upsert(
    {
      user_id: params.userId,
      title: notification.title,
      message: notification.message,
      target: "all",
      kind: notification.kind,
      cta_url: notification.ctaUrl,
      dedupe_key: notification.dedupeKey,
      metadata: {
        subscriptionId: params.subscriptionId,
        transactionId: params.transactionId ?? null,
      },
      sent_to_count: 1,
      sent_at: new Date().toISOString(),
    },
    { onConflict: "dedupe_key" }
  );

  if (!params.userEmail) return;

  await admin.from("email_jobs").upsert(
    {
      user_id: params.userId,
      subscription_id: params.subscriptionId,
      payment_transaction_id: params.transactionId ?? null,
      provider: "resend",
      template_key: email.templateKey,
      recipient_email: params.userEmail,
      recipient_name: params.userName ?? null,
      subject: email.subject,
      dedupe_key: email.dedupeKey,
      payload: {
        subscriptionId: params.subscriptionId,
        userName: params.userName,
        ...email.payload,
      },
    },
    { onConflict: "dedupe_key" }
  );
}

async function getProfileIdentity(admin: AdminClient, userId: string) {
  const { data } = await admin
    .from("profiles")
    .select("email,full_name")
    .eq("id", userId)
    .maybeSingle();

  return {
    email: data?.email ?? null,
    fullName: data?.full_name ?? null,
  };
}

async function resolveLocalSubscription(
  admin: AdminClient,
  params: {
    providerSubscriptionId?: string | null;
    externalReference?: string | null;
    payerEmail?: string | null;
  }
) {
  if (params.providerSubscriptionId) {
    const { data } = await admin
      .from("subscriptions")
      .select("*")
      .eq("provider_subscription_id", params.providerSubscriptionId)
      .maybeSingle();

    if (data) return data as SubscriptionRow;
  }

  if (params.externalReference) {
    const { data } = await admin
      .from("subscriptions")
      .select("*")
      .eq("external_reference", params.externalReference)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) return data as SubscriptionRow;
  }

  if (params.payerEmail) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", params.payerEmail)
      .maybeSingle();

    if (profile?.id) {
      const { data } = await admin
        .from("subscriptions")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) return data as SubscriptionRow;
    }
  }

  return null;
}

export async function syncMercadoPagoSubscriptionResource(
  resource: MercadoPagoSubscriptionResource,
  options?: {
    latestPaymentStatus?: string | null;
    eventKindOverride?:
      | "subscription_activated"
      | "subscription_cancelled"
      | "subscription_paused";
  }
) {
  const admin = createSupabaseAdminClient();
  const localSubscription = await resolveLocalSubscription(admin, {
    providerSubscriptionId: resource.id,
    externalReference: resource.external_reference ?? null,
    payerEmail: resource.payer_email ?? null,
  });

  if (!localSubscription) {
    throw new Error(
      `Assinatura local nao encontrada para o recurso Mercado Pago ${resource.id}.`
    );
  }

  const mappedStatus = inferSubscriptionStatus({
    providerStatus: resource.status,
    currentStatus: localSubscription.status,
    latestPaymentStatus: options?.latestPaymentStatus,
  });

  const currentPeriodStart =
    resource.auto_recurring?.start_date ??
    localSubscription.current_period_start ??
    resource.date_created ??
    null;
  const currentPeriodEnd =
    resource.next_payment_date ??
    resource.auto_recurring?.end_date ??
    localSubscription.current_period_end ??
    null;

  const updatePayload: Database["public"]["Tables"]["subscriptions"]["Update"] = {
    status: mappedStatus,
    cancel_at_period_end: mappedStatus === "cancelled"
      ? true
      : localSubscription.cancel_at_period_end,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    provider: "mercado_pago",
    provider_customer_id:
      resource.payer_id !== undefined && resource.payer_id !== null
        ? String(resource.payer_id)
        : localSubscription.provider_customer_id,
    provider_subscription_id: resource.id,
    external_reference: resource.external_reference ?? localSubscription.external_reference,
    provider_plan_id: resource.preapproval_plan_id ?? localSubscription.provider_plan_id,
    provider_status: resource.status ?? localSubscription.provider_status,
    provider_payment_method:
      resource.payment_method_id ?? localSubscription.provider_payment_method,
    provider_payer_email:
      resource.payer_email ?? localSubscription.provider_payer_email,
    provider_checkout_url:
      resource.init_point ??
      resource.sandbox_init_point ??
      localSubscription.provider_checkout_url,
    last_event_at: resource.last_modified ?? new Date().toISOString(),
    cancelled_at:
      mappedStatus === "cancelled"
        ? localSubscription.cancelled_at ?? new Date().toISOString()
        : null,
    paused_at:
      mappedStatus === "suspended" && (resource.status ?? "").toLowerCase() === "paused"
        ? localSubscription.paused_at ?? new Date().toISOString()
        : null,
    metadata: {
      ...(localSubscription.metadata as Record<string, Json | undefined>),
      mercadoPago: toJsonRecord(resource),
    },
  };

  const { data: updatedSubscription, error } = await admin
    .from("subscriptions")
    .update(updatePayload)
    .eq("id", localSubscription.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const eventKind =
    options?.eventKindOverride ??
    (mappedStatus === "cancelled"
      ? "subscription_cancelled"
      : (resource.status ?? "").toLowerCase() === "paused"
        ? "subscription_paused"
        : "subscription_activated");

  const identity = await getProfileIdentity(admin, localSubscription.user_id);
  await enqueueLifecycleCommunication(admin, {
    userId: localSubscription.user_id,
    userEmail: identity.email,
    userName: identity.fullName,
    subscriptionId: localSubscription.id,
    eventKind,
    amountCents: amountToCents(resource.auto_recurring?.transaction_amount ?? null),
    nextBillingDate: currentPeriodEnd,
  });

  return updatedSubscription as SubscriptionRow;
}

async function upsertPaymentTransaction(args: {
  admin: AdminClient;
  subscription: SubscriptionRow;
  providerPaymentId?: string | null;
  providerAuthorizedPaymentId?: string | null;
  amountCents?: number;
  currencyId?: string | null;
  status: string;
  description?: string | null;
  paymentMethod?: string | null;
  installments?: number | null;
  dueDate?: string | null;
  paidAt?: string | null;
  invoiceUrl?: string | null;
  receiptUrl?: string | null;
  metadata?: Json;
}) {
  const current = await args.admin
    .from("payment_transactions")
    .select("*")
    .or(
      [
        args.providerPaymentId
          ? `provider_payment_id.eq.${args.providerPaymentId}`
          : null,
        args.providerAuthorizedPaymentId
          ? `provider_authorized_payment_id.eq.${args.providerAuthorizedPaymentId}`
          : null,
      ]
        .filter(Boolean)
        .join(",")
    )
    .limit(1)
    .maybeSingle();

  const currentRow = current.data as PaymentTransactionRow | null;

  const payload: Database["public"]["Tables"]["payment_transactions"]["Insert"] = {
    id: currentRow?.id,
    subscription_id: args.subscription.id,
    user_id: args.subscription.user_id,
    provider: "mercado_pago",
    provider_payment_id: args.providerPaymentId ?? currentRow?.provider_payment_id ?? null,
    provider_authorized_payment_id:
      args.providerAuthorizedPaymentId ??
      currentRow?.provider_authorized_payment_id ??
      null,
    external_reference: args.subscription.external_reference ?? null,
    description: args.description ?? currentRow?.description ?? args.subscription.plan_id ?? "Assinatura mensal",
    amount_cents: args.amountCents ?? currentRow?.amount_cents ?? 0,
    currency_id: args.currencyId ?? currentRow?.currency_id ?? "BRL",
    status: args.status,
    payment_method: args.paymentMethod ?? currentRow?.payment_method ?? null,
    installments: args.installments ?? currentRow?.installments ?? null,
    due_date: args.dueDate ?? currentRow?.due_date ?? null,
    paid_at: args.paidAt ?? currentRow?.paid_at ?? null,
    invoice_url: args.invoiceUrl ?? currentRow?.invoice_url ?? null,
    receipt_url: args.receiptUrl ?? currentRow?.receipt_url ?? null,
    metadata: {
      ...(currentRow?.metadata as Record<string, Json | undefined> | undefined),
      ...(args.metadata as Record<string, Json | undefined> | undefined),
    },
  };

  const { data, error } = await args.admin
    .from("payment_transactions")
    .upsert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PaymentTransactionRow;
}

export async function syncMercadoPagoPaymentResource(resource: MercadoPagoPaymentResource) {
  const admin = createSupabaseAdminClient();
  const externalReference = resource.external_reference ?? null;
  const localSubscription = await resolveLocalSubscription(admin, {
    externalReference,
    providerSubscriptionId: null,
    payerEmail: null,
  });

  if (!localSubscription) {
    throw new Error(
      `Assinatura local nao encontrada para o pagamento Mercado Pago ${resource.id}.`
    );
  }

  const paymentStatus = mapMercadoPagoPaymentStatus(resource.status);
  const transaction = await upsertPaymentTransaction({
    admin,
    subscription: localSubscription,
    providerPaymentId: String(resource.id),
    amountCents: amountToCents(resource.transaction_amount ?? null),
    currencyId: resource.currency_id ?? "BRL",
    status: paymentStatus,
    description: resource.description ?? localSubscription.plan_id ?? "Renovacao de assinatura",
    paymentMethod: resource.payment_method_id ?? null,
    installments: resource.installments ?? null,
    paidAt: resource.date_approved ?? null,
    receiptUrl: resource.transaction_details?.external_resource_url ?? null,
    metadata: {
      mercadoPago: toJsonRecord(resource),
    },
  });

  const nextSubscriptionStatus =
    paymentStatus === "rejected"
      ? ("past_due" as SubscriptionStatus)
      : localSubscription.status;

  await admin
    .from("subscriptions")
    .update({
      status: nextSubscriptionStatus,
      last_payment_id: String(resource.id),
      last_payment_status: paymentStatus,
      last_event_at: resource.date_last_updated ?? new Date().toISOString(),
      metadata: {
        ...(localSubscription.metadata as Record<string, Json | undefined>),
        lastPayment: toJsonRecord(resource),
      },
    })
    .eq("id", localSubscription.id);

  const identity = await getProfileIdentity(admin, localSubscription.user_id);
  await enqueueLifecycleCommunication(admin, {
    userId: localSubscription.user_id,
    userEmail: identity.email,
    userName: identity.fullName,
    subscriptionId: localSubscription.id,
    transactionId: transaction.id,
    eventKind: paymentStatus === "approved" ? "payment_approved" : "payment_failed",
    amountCents: transaction.amount_cents,
    nextBillingDate: localSubscription.current_period_end,
  });

  return transaction;
}

export async function syncMercadoPagoAuthorizedPaymentResource(
  resource: MercadoPagoAuthorizedPaymentResource
) {
  const admin = createSupabaseAdminClient();
  const localSubscription = await resolveLocalSubscription(admin, {
    externalReference: resource.external_reference ?? null,
    providerSubscriptionId: null,
    payerEmail: null,
  });

  if (!localSubscription) {
    throw new Error(
      `Assinatura local nao encontrada para a cobranca autorizada ${resource.id}.`
    );
  }

  const paymentStatus = mapMercadoPagoPaymentStatus(
    resource.payment?.status ?? resource.status ?? null
  );

  const transaction = await upsertPaymentTransaction({
    admin,
    subscription: localSubscription,
    providerPaymentId: resource.payment?.id ? String(resource.payment.id) : null,
    providerAuthorizedPaymentId: String(resource.id),
    amountCents: amountToCents(
      resource.payment?.transaction_amount ?? resource.amount ?? resource.original_amount ?? null
    ),
    currencyId: resource.payment?.currency_id ?? resource.currency_id ?? "BRL",
    status: paymentStatus,
    description:
      resource.description ??
      resource.payment?.description ??
      "Cobranca recorrente da assinatura",
    paymentMethod:
      resource.payment?.payment_method_id ?? resource.payment_method_id ?? null,
    installments: resource.payment?.installments ?? resource.installments ?? null,
    dueDate: resource.debit_date ?? null,
    paidAt: resource.payment?.date_approved ?? null,
    receiptUrl: resource.payment?.transaction_details?.external_resource_url ?? null,
    metadata: {
      mercadoPago: toJsonRecord(resource),
    },
  });

  const nextSubscriptionStatus =
    paymentStatus === "rejected"
      ? ("past_due" as SubscriptionStatus)
      : inferSubscriptionStatus({
          providerStatus: localSubscription.provider_status,
          currentStatus: localSubscription.status,
          latestPaymentStatus: paymentStatus,
        });

  await admin
    .from("subscriptions")
    .update({
      status: nextSubscriptionStatus,
      last_payment_id:
        transaction.provider_payment_id ??
        transaction.provider_authorized_payment_id ??
        localSubscription.last_payment_id,
      last_payment_status: paymentStatus,
      last_event_at: resource.last_modified ?? new Date().toISOString(),
      metadata: {
        ...(localSubscription.metadata as Record<string, Json | undefined>),
        lastAuthorizedPayment: toJsonRecord(resource),
      },
    })
    .eq("id", localSubscription.id);

  const identity = await getProfileIdentity(admin, localSubscription.user_id);
  await enqueueLifecycleCommunication(admin, {
    userId: localSubscription.user_id,
    userEmail: identity.email,
    userName: identity.fullName,
    subscriptionId: localSubscription.id,
    transactionId: transaction.id,
    eventKind: paymentStatus === "approved" ? "payment_approved" : "payment_failed",
    amountCents: transaction.amount_cents,
    nextBillingDate: localSubscription.current_period_end,
  });

  return transaction;
}

export async function syncMercadoPagoSubscriptionById(subscriptionId: string) {
  const resource = await getMercadoPagoSubscription(subscriptionId);
  return syncMercadoPagoSubscriptionResource(resource);
}

export async function syncMercadoPagoPaymentById(paymentId: string) {
  const resource = await getMercadoPagoPayment(paymentId);
  return syncMercadoPagoPaymentResource(resource);
}

export async function syncMercadoPagoAuthorizedPaymentById(authorizedPaymentId: string) {
  const resource = await getMercadoPagoAuthorizedPayment(authorizedPaymentId);
  return syncMercadoPagoAuthorizedPaymentResource(resource);
}

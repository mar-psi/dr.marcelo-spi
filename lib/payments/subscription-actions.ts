import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  syncMercadoPagoSubscriptionById,
  syncMercadoPagoSubscriptionResource,
} from "@/lib/payments/subscription-lifecycle";
import { updateMercadoPagoSubscription } from "@/lib/payments/mercadopago";
import type { Database } from "@/types/database";

export type SubscriptionAction = "cancel" | "pause" | "resume" | "sync";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

async function getLocalSubscriptionById(subscriptionId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (error || !data) {
    throw new Error("Assinatura nao encontrada.");
  }

  return data as SubscriptionRow;
}

export async function performSubscriptionAction(
  subscriptionId: string,
  action: SubscriptionAction
) {
  const localSubscription = await getLocalSubscriptionById(subscriptionId);

  if (!localSubscription.provider_subscription_id) {
    throw new Error("Assinatura ainda nao sincronizada com o Mercado Pago.");
  }

  if (localSubscription.provider !== "mercado_pago") {
    throw new Error("Provedor de pagamento nao suportado.");
  }

  switch (action) {
    case "sync":
      return syncMercadoPagoSubscriptionById(localSubscription.provider_subscription_id);
    case "cancel": {
      const resource = await updateMercadoPagoSubscription(
        localSubscription.provider_subscription_id,
        { status: "cancelled" }
      );
      return syncMercadoPagoSubscriptionResource(resource, {
        eventKindOverride: "subscription_cancelled",
      });
    }
    case "pause": {
      const resource = await updateMercadoPagoSubscription(
        localSubscription.provider_subscription_id,
        { status: "paused" }
      );
      return syncMercadoPagoSubscriptionResource(resource, {
        eventKindOverride: "subscription_paused",
      });
    }
    case "resume": {
      if (localSubscription.status === "cancelled") {
        throw new Error(
          "Assinaturas canceladas precisam de uma nova contratacao para voltar a cobrar."
        );
      }

      const resource = await updateMercadoPagoSubscription(
        localSubscription.provider_subscription_id,
        { status: "authorized" }
      );
      return syncMercadoPagoSubscriptionResource(resource, {
        eventKindOverride: "subscription_activated",
      });
    }
    default:
      throw new Error("Acao de assinatura invalida.");
  }
}

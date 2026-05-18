import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  performSubscriptionAction,
  type SubscriptionAction,
} from "@/lib/payments/subscription-actions";

export const dynamic = "force-dynamic";

const allowedActions = new Set<SubscriptionAction>(["cancel", "pause", "resume", "sync"]);

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const { action } = (await request.json()) as { action?: SubscriptionAction };

    if (!action || !allowedActions.has(action)) {
      return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: subscription } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription?.id) {
      return NextResponse.json({ error: "Assinatura nao encontrada." }, { status: 404 });
    }

    const updated = await performSubscriptionAction(subscription.id, action);
    return NextResponse.json({ ok: true, subscription: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao atualizar assinatura" },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/session";
import {
  performSubscriptionAction,
  type SubscriptionAction,
} from "@/lib/payments/subscription-actions";

export const dynamic = "force-dynamic";

const allowedActions = new Set<SubscriptionAction>(["cancel", "pause", "resume", "sync"]);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    const { action } = (await request.json()) as { action?: SubscriptionAction };

    if (!id) {
      return NextResponse.json({ error: "Assinatura invalida." }, { status: 400 });
    }

    if (!action || !allowedActions.has(action)) {
      return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
    }

    const updated = await performSubscriptionAction(id, action);

    return NextResponse.json({ ok: true, subscription: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao atualizar assinatura" },
      { status: 400 }
    );
  }
}

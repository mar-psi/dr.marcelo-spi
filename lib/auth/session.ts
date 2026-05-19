import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthUser } from "@/data/auth";
import type { SubscriptionStatus, UserRole } from "@/types/database";

type SubscriptionDTO = {
  isActive: boolean;
  status: SubscriptionStatus | "none";
  planId: string | null;
  expiresAt: string | null;
  nextBillingDate: string | null;
  cancelAtPeriodEnd: boolean;
};

function readRole(user: User, profileRole?: UserRole | null): UserRole {
  const appRole = user.app_metadata?.role;
  if (appRole === "admin" || appRole === "user") return appRole;
  return profileRole === "admin" ? "admin" : "user";
}

function hasActiveSubscriptionStatus(
  status: SubscriptionDTO["status"],
  expiresAt: string | null
): boolean {
  if (status !== "active" && status !== "trialing" && status !== "cancelled") return false;
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > Date.now();
}

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  if (!hasSupabaseConfig()) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const subscription = await getCurrentSubscription(user.id);
  const role = readRole(user, profile?.role);
  const name =
    profile?.full_name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Aluno";

  return {
    id: user.id,
    email: user.email ?? "",
    name,
    avatar: profile?.avatar_url ?? user.user_metadata?.avatar_url,
    plan: role === "admin" || subscription.isActive ? "assinante" : "gratuito",
    role,
    joinedAt: profile?.created_at ?? user.created_at,
    emailVerified: Boolean(user.email_confirmed_at),
  };
});

export async function requireCurrentUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export async function requireAdminUser(): Promise<AuthUser> {
  const user = await requireCurrentUser();
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function getCurrentSubscription(
  userId: string
): Promise<SubscriptionDTO> {
  if (!hasSupabaseConfig()) {
    return {
      isActive: false,
      status: "none",
      planId: null,
      expiresAt: null,
      nextBillingDate: null,
      cancelAtPeriodEnd: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("status, plan_id, current_period_end, cancel_at_period_end")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const status = data?.status ?? "none";
  const expiresAt = data?.current_period_end ?? null;

  return {
    isActive: hasActiveSubscriptionStatus(status, expiresAt),
    status,
    planId: data?.plan_id ?? null,
    expiresAt,
    nextBillingDate: expiresAt,
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
  };
}

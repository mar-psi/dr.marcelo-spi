import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database, NotificationTarget } from "@/types/database";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationReadRow = Database["public"]["Tables"]["notification_reads"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  target: NotificationTarget;
  kind: string;
  ctaUrl: string | null;
  sentAt: string;
  sentToCount: number;
  readAt: string | null;
  unread: boolean;
}

export interface NotificationAudienceCounts {
  all: number;
  subscribers: number;
  free: number;
}

function normalizeNotification(row: NotificationRow, readAt: string | null): NotificationItem {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    target: row.target,
    kind: row.kind,
    ctaUrl: row.cta_url,
    sentAt: row.sent_at ?? row.created_at,
    sentToCount: row.sent_to_count,
    readAt,
    unread: !readAt,
  };
}

export async function fetchNotificationsForUser(
  userId: string,
  limit = 20
): Promise<NotificationItem[]> {
  const supabase = createSupabaseBrowserClient();

  const notificationsResponse = await supabase
    .from("notifications")
    .select("id,user_id,title,message,target,kind,cta_url,dedupe_key,metadata,sent_to_count,sent_at,created_by,created_at")
    .not("sent_at", "is", null)
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (notificationsResponse.error) {
    throw new Error(notificationsResponse.error.message);
  }

  const notificationIds = ((notificationsResponse.data ?? []) as NotificationRow[]).map(
    (row) => row.id
  );

  if (notificationIds.length === 0) return [];

  const readsResponse = await supabase
    .from("notification_reads")
    .select("notification_id,user_id,read_at")
    .eq("user_id", userId)
    .in("notification_id", notificationIds);

  if (readsResponse.error) {
    throw new Error(readsResponse.error.message);
  }

  const readMap = new Map<string, string>();
  (readsResponse.data as NotificationReadRow[]).forEach((row) => {
    readMap.set(row.notification_id, row.read_at);
  });

  return ((notificationsResponse.data ?? []) as NotificationRow[]).map((row) =>
    normalizeNotification(row, readMap.get(row.id) ?? null)
  );
}

export async function markNotificationsRead(userId: string, notificationIds: string[]) {
  if (notificationIds.length === 0) return;

  const supabase = createSupabaseBrowserClient();
  const payload = notificationIds.map((notificationId) => ({
    notification_id: notificationId,
    user_id: userId,
    read_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("notification_reads")
    .upsert(payload, { onConflict: "notification_id,user_id" });

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchNotificationAudienceCounts(): Promise<NotificationAudienceCounts> {
  const supabase = createSupabaseBrowserClient();

  const [profilesResponse, subscriptionsResponse] = await Promise.all([
    supabase.from("profiles").select("id,role"),
    supabase
      .from("subscriptions")
      .select("user_id,status"),
  ]);

  if (profilesResponse.error) {
    throw new Error(profilesResponse.error.message);
  }

  if (subscriptionsResponse.error) {
    throw new Error(subscriptionsResponse.error.message);
  }

  const activeSubscriberIds = new Set(
    ((subscriptionsResponse.data ?? []) as SubscriptionRow[])
      .filter((subscription) => subscription.status === "active" || subscription.status === "trialing")
      .map((subscription) => subscription.user_id)
  );

  const totalUsers = ((profilesResponse.data ?? []) as Pick<ProfileRow, "id" | "role">[]).length;
  const subscribers = activeSubscriberIds.size;

  return {
    all: totalUsers,
    subscribers,
    free: Math.max(0, totalUsers - subscribers),
  };
}

export async function fetchNotificationHistory() {
  const supabase = createSupabaseBrowserClient();

  const notificationsResponse = await supabase
    .from("notifications")
    .select("id,user_id,title,message,target,kind,cta_url,dedupe_key,metadata,sent_to_count,sent_at,created_by,created_at")
    .not("sent_at", "is", null)
    .eq("kind", "manual")
    .is("user_id", null)
    .order("sent_at", { ascending: false })
    .limit(50);

  if (notificationsResponse.error) {
    throw new Error(notificationsResponse.error.message);
  }

  const notificationIds = ((notificationsResponse.data ?? []) as NotificationRow[]).map(
    (row) => row.id
  );

  if (notificationIds.length === 0) return [];

  const readsResponse = await supabase
    .from("notification_reads")
    .select("notification_id,user_id,read_at")
    .in("notification_id", notificationIds);

  if (readsResponse.error) {
    throw new Error(readsResponse.error.message);
  }

  const readsByNotification = new Map<string, number>();
  (readsResponse.data as NotificationReadRow[]).forEach((row) => {
    readsByNotification.set(
      row.notification_id,
      (readsByNotification.get(row.notification_id) ?? 0) + 1
    );
  });

  return ((notificationsResponse.data ?? []) as NotificationRow[]).map((row) => {
    const reads = readsByNotification.get(row.id) ?? 0;
    const sentToCount = row.sent_to_count || 0;
    const openRate = sentToCount > 0 ? Math.round((reads / sentToCount) * 100) : 0;

    return {
      id: row.id,
      title: row.title,
      message: row.message,
      target: row.target,
      sentAt: row.sent_at ?? row.created_at,
      sentTo: sentToCount,
      openRate,
    };
  });
}

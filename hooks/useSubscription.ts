"use client";

import { useState, useEffect, useCallback } from "react";
import type { BillingRecord, UserSubscription } from "@/data/subscription";

interface UseSubscriptionReturn {
  isSubscriber: boolean;
  subscription: UserSubscription | null;
  billingRecords: BillingRecord[];
  loading: boolean;
  canAccess: (isFree: boolean) => boolean;
  triggerPaywall: (title?: string, type?: string) => void;
  paywallOpen: boolean;
  paywallTitle: string | undefined;
  paywallType: string;
  closePaywall: () => void;
  refresh: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [loading, setLoading] = useState(true);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallTitle, setPaywallTitle] = useState<string | undefined>();
  const [paywallType, setPaywallType] = useState("aula");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/subscription/status", {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        setIsSubscriber(false);
        setSubscription(null);
        setBillingRecords([]);
        return;
      }

      const data = await response.json();
      setIsSubscriber(Boolean(data.isActive));
      setSubscription(data.subscription ?? null);
      setBillingRecords(data.billingRecords ?? []);
    } catch {
      setIsSubscriber(false);
      setSubscription(null);
      setBillingRecords([]);
    } finally {
      setLoading(false);
    };
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const canAccess = useCallback(
    (isFree: boolean): boolean => {
      return isFree || isSubscriber;
    },
    [isSubscriber]
  );

  const triggerPaywall = useCallback(
    (title?: string, type = "aula") => {
      if (!isSubscriber) {
        setPaywallTitle(title);
        setPaywallType(type);
        setPaywallOpen(true);
      }
    },
    [isSubscriber]
  );

  const closePaywall = useCallback(() => {
    setPaywallOpen(false);
    setPaywallTitle(undefined);
  }, []);

  return {
    isSubscriber,
    subscription,
    billingRecords,
    loading,
    canAccess,
    triggerPaywall,
    paywallOpen,
    paywallTitle,
    paywallType,
    closePaywall,
    refresh,
  };
}

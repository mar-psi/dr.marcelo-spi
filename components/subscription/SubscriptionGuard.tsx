"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";
import { SkeletonCard } from "@/components/ui";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  isFree?: boolean;
  fallback?: React.ReactNode;
  contentTitle?: string;
  contentType?: "aula" | "ebook" | "quiz" | "story";
  showPreview?: boolean;
}

function LockedOverlay({
  contentTitle,
  contentType = "aula",
}: {
  contentTitle?: string;
  contentType?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl px-6 text-center"
    >
      {/* Lock icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
        className="w-16 h-16 rounded-full bg-accent-primary/20 border-2 border-accent-primary/60 flex items-center justify-center mb-4 shadow-glow"
      >
        <Lock size={26} className="text-accent-secondary" />
      </motion.div>

      <h3 className="text-lg font-bold text-content-primary mb-2">
        Conteúdo exclusivo
      </h3>
      {contentTitle && (
        <p className="text-sm text-content-secondary mb-1 line-clamp-2">
          &quot;{contentTitle}&quot;
        </p>
      )}
      <p className="text-xs text-content-secondary mb-5">
        Assine para ter acesso a este {contentType} e muito mais.
      </p>

      <Link href="/assinatura">
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-primary text-white text-sm font-semibold shadow-glow hover:bg-accent-primaryHover transition-colors"
        >
          <Sparkles size={14} />
          Assinar por R$15/mês
          <ArrowRight size={14} />
        </motion.div>
      </Link>

      <p className="text-xs text-content-disabled mt-3">
        Cancele quando quiser
      </p>
    </motion.div>
  );
}

export function SubscriptionGuard({
  children,
  isFree = false,
  fallback,
  contentTitle,
  contentType = "aula",
  showPreview = false,
}: SubscriptionGuardProps) {
  const { isSubscriber, loading, canAccess } = useSubscription();

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
      </div>
    );
  }

  if (canAccess(isFree)) {
    return <>{children}</>;
  }

  if (fallback && !showPreview) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative rounded-xl overflow-hidden">
      {showPreview && (
        <div className="pointer-events-none select-none opacity-30 blur-[2px]">
          {children}
        </div>
      )}
      {!showPreview && (
        <div className="min-h-[200px] bg-background-secondary rounded-xl border border-border-subtle" />
      )}
      <LockedOverlay contentTitle={contentTitle} contentType={contentType} />
    </div>
  );
}

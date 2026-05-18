"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, ArrowRight, Shield } from "lucide-react";
import type { Plan } from "@/data/subscription";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  plan: Plan;
  isSubscriber?: boolean;
  onSubscribe?: () => void;
  compact?: boolean;
}

export function PlanCard({
  plan,
  isSubscriber = false,
  onSubscribe,
  compact = false,
}: PlanCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative rounded-2xl border overflow-hidden",
        plan.highlight
          ? "border-accent-primary bg-gradient-to-b from-[rgba(124,58,237,0.12)] to-background-secondary shadow-glow"
          : "border-border-subtle bg-background-secondary shadow-card"
      )}
    >
      {/* Glow blob */}
      {plan.highlight && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-accent-primary/20 blur-3xl pointer-events-none" />
      )}

      {/* Top badge */}
      {plan.badge && (
        <div className="absolute top-0 left-0 right-0 flex justify-center">
          <div className="flex items-center gap-1.5 px-4 py-1.5 bg-accent-primary text-white text-xs font-bold rounded-b-xl shadow-glow">
            <Sparkles size={11} />
            {plan.badge}
          </div>
        </div>
      )}

      <div className={cn("relative z-10", compact ? "p-6" : "p-8 pt-10")}>
        {/* Plan name */}
        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-content-secondary uppercase tracking-widest mb-2">
            {plan.name}
          </p>
          {/* Price */}
          <div className="flex items-end justify-center gap-1 mb-2">
            <span className="text-lg text-content-secondary font-medium">R$</span>
            <span className="text-6xl font-bold text-gradient-purple leading-none">
              {plan.price}
            </span>
            <span className="text-base text-content-secondary mb-2">{plan.period}</span>
          </div>
          <p className="text-sm text-content-secondary">{plan.description}</p>
        </div>

        {/* Features */}
        <ul className={cn("space-y-3", compact ? "mb-5" : "mb-8")}>
          {plan.features.map((feature, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              className="flex items-start gap-3"
            >
              <CheckCircle2
                size={17}
                className="text-status-success shrink-0 mt-0.5"
              />
              <span className="text-sm text-content-secondary leading-snug">
                {feature}
              </span>
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        {isSubscriber ? (
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-status-successBg border border-[rgba(34,197,94,0.3)]">
            <CheckCircle2 size={16} className="text-status-success" />
            <p className="text-sm font-semibold text-status-success">
              Você já é assinante!
            </p>
          </div>
        ) : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<ArrowRight size={16} />}
            onClick={onSubscribe}
          >
            Assinar agora
          </Button>
        )}

        {/* Trust signals */}
        {!compact && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-content-disabled">
              <Shield size={12} />
              <span>Pagamento seguro · Cancele quando quiser</span>
            </div>
            <div className="flex items-center gap-3">
              {["🔒 SSL", "💳 Cartão", "📱 PIX"].map((item) => (
                <span key={item} className="text-[10px] text-content-disabled">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

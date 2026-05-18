"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { AdminMetric } from "@/data/admin";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  metric: AdminMetric;
  index?: number;
  icon: React.ElementType;
  iconColor?: string;
}

function useCountUp(target: number, delay = 0, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start += step;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay, duration]);
  return count;
}

export function MetricCard({ metric, index = 0, icon: Icon, iconColor = "#7C3AED" }: MetricCardProps) {
  const animatedValue = useCountUp(
    typeof metric.currentValue === "number" ? metric.currentValue : 0,
    index * 100
  );

  const isPositive = metric.changeType === "positive";
  const isNegative = metric.changeType === "negative";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="relative rounded-2xl border border-border-subtle bg-background-secondary p-5 overflow-hidden hover:border-accent-primary/30 hover:shadow-glow transition-all duration-200"
    >
      {/* Glow blob */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-20"
        style={{ backgroundColor: iconColor }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <Icon size={18} style={{ color: iconColor }} />
        </div>

        {/* Change badge */}
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
            isPositive
              ? "bg-status-successBg text-status-success"
              : isNegative
              ? "bg-status-errorBg text-status-error"
              : "bg-background-tertiary text-content-disabled"
          )}
        >
          {isPositive ? (
            <TrendingUp size={11} />
          ) : isNegative ? (
            <TrendingDown size={11} />
          ) : (
            <Minus size={11} />
          )}
          {Math.abs(metric.change).toFixed(1)}%
        </div>
      </div>

      {/* Value */}
      <div className="relative z-10">
        <div className="flex items-end gap-1 mb-1">
          {metric.prefix && (
            <span className="text-base text-content-secondary font-medium mb-0.5">
              {metric.prefix}
            </span>
          )}
          <span className="text-3xl font-bold text-content-primary tabular-nums">
            {typeof metric.currentValue === "number"
              ? animatedValue.toLocaleString("pt-BR")
              : metric.value}
          </span>
          {metric.suffix && (
            <span className="text-sm text-content-secondary mb-0.5">{metric.suffix}</span>
          )}
        </div>

        <p className="text-xs text-content-secondary font-medium">{metric.label}</p>

        {/* vs last month */}
        <p className="text-[10px] text-content-disabled mt-1">
          {isPositive ? "▲" : isNegative ? "▼" : "—"}{" "}
          {Math.abs(metric.change).toFixed(1)}% vs mês anterior
        </p>
      </div>
    </motion.div>
  );
}

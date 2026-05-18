"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  PlayCircle,
  HelpCircle,
  Layers,
  Flame,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  icon: React.ElementType;
  value: number;
  label: string;
  suffix?: string;
  color: string;
  bgColor: string;
  isStreak?: boolean;
}

interface ProgressStatsProps {
  aulasConcluidas: number;
  quizzesRespondidos: number;
  storiesVistos: number;
  streakDays: number;
}

function useCountUp(target: number, delay = 0, duration = 800) {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
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

function StatCard({ item, index }: { item: StatItem; index: number }) {
  const Icon = item.icon;
  const count = useCountUp(item.value, index * 150);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={cn(
        "relative rounded-2xl border p-5 overflow-hidden",
        item.isStreak && item.value >= 3
          ? "border-[rgba(245,158,11,0.4)]"
          : "border-border-subtle",
        "bg-background-secondary"
      )}
    >
      {/* Glow bg */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30"
        style={{ backgroundColor: item.color }}
      />

      {/* Icon */}
      <div
        className="relative w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: item.bgColor }}
      >
        <Icon size={18} style={{ color: item.color }} />
        {item.isStreak && item.value >= 3 && (
          <motion.div
            className="absolute -top-1 -right-1 text-xs"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            🔥
          </motion.div>
        )}
      </div>

      {/* Value */}
      <div className="relative">
        <div className="flex items-end gap-1">
          <span
            className="text-3xl font-bold tabular-nums"
            style={{ color: item.color }}
          >
            {count}
          </span>
          {item.suffix && (
            <span className="text-sm text-content-secondary mb-1">
              {item.suffix}
            </span>
          )}
        </div>
        <p className="text-xs text-content-secondary mt-0.5 font-medium">
          {item.label}
        </p>

        {/* Streak special label */}
        {item.isStreak && item.value >= 3 && (
          <p className="text-[10px] text-status-warning mt-1 font-semibold">
            🔥 Sequência ativa!
          </p>
        )}
        {item.isStreak && item.value === 0 && (
          <p className="text-[10px] text-content-disabled mt-1">
            Acesse hoje para começar
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function ProgressStats({
  aulasConcluidas,
  quizzesRespondidos,
  storiesVistos,
  streakDays,
}: ProgressStatsProps) {
  const stats: StatItem[] = [
    {
      icon: PlayCircle,
      value: aulasConcluidas,
      label: "Aulas Concluídas",
      color: "#7C3AED",
      bgColor: "rgba(124,58,237,0.15)",
    },
    {
      icon: HelpCircle,
      value: quizzesRespondidos,
      label: "Quizzes Respondidos",
      color: "#3B82F6",
      bgColor: "rgba(59,130,246,0.15)",
    },
    {
      icon: Layers,
      value: storiesVistos,
      label: "Stories Vistos",
      color: "#22C55E",
      bgColor: "rgba(34,197,94,0.15)",
    },
    {
      icon: Flame,
      value: streakDays,
      label: "Dias de Streak",
      suffix: streakDays === 1 ? "dia" : "dias",
      color: "#F59E0B",
      bgColor: "rgba(245,158,11,0.15)",
      isStreak: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((item, i) => (
        <StatCard key={item.label} item={item} index={i} />
      ))}
    </div>
  );
}

import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "doencas"
  | "transtornos"
  | "curiosidades"
  | "free"
  | "novo"
  | "success"
  | "error"
  | "warning"
  | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
  overImage?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  doencas: "bg-[rgba(124,58,237,0.2)] text-accent-secondary border border-[rgba(124,58,237,0.4)]",
  transtornos: "bg-[rgba(59,130,246,0.2)] text-blue-400 border border-[rgba(59,130,246,0.4)]",
  curiosidades: "bg-[rgba(34,197,94,0.2)] text-status-success border border-[rgba(34,197,94,0.4)]",
  free: "bg-[rgba(100,116,139,0.2)] text-content-secondary border border-[rgba(100,116,139,0.4)]",
  novo: "bg-[rgba(249,115,22,0.2)] text-orange-400 border border-[rgba(249,115,22,0.4)]",
  success: "bg-status-successBg text-status-success border border-[rgba(34,197,94,0.4)]",
  error: "bg-status-errorBg text-status-error border border-[rgba(239,68,68,0.4)]",
  warning: "bg-status-warningBg text-status-warning border border-[rgba(245,158,11,0.4)]",
  default: "bg-background-tertiary text-content-secondary border border-border-subtle",
};

const overImageStyles: Record<BadgeVariant, string> = {
  doencas: "bg-[rgba(80,30,180,0.88)] text-white border border-[rgba(124,58,237,0.6)] shadow-sm",
  transtornos: "bg-[rgba(30,90,200,0.88)] text-white border border-[rgba(59,130,246,0.6)] shadow-sm",
  curiosidades: "bg-[rgba(20,140,60,0.88)] text-white border border-[rgba(34,197,94,0.6)] shadow-sm",
  free: "bg-[rgba(60,70,90,0.88)] text-white border border-[rgba(100,116,139,0.6)] shadow-sm",
  novo: "bg-[rgba(200,90,10,0.88)] text-white border border-[rgba(249,115,22,0.6)] shadow-sm",
  success: "bg-[rgba(20,140,60,0.88)] text-white border border-[rgba(34,197,94,0.6)] shadow-sm",
  error: "bg-[rgba(180,40,40,0.88)] text-white border border-[rgba(239,68,68,0.6)] shadow-sm",
  warning: "bg-[rgba(180,120,10,0.88)] text-white border border-[rgba(245,158,11,0.6)] shadow-sm",
  default: "bg-[rgba(30,30,40,0.88)] text-white border border-[rgba(255,255,255,0.2)] shadow-sm",
};

const sizeStyles = {
  sm: "text-xs px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
};

export function Badge({
  variant = "default",
  children,
  className,
  size = "sm",
  overImage = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full whitespace-nowrap backdrop-blur-sm",
        overImage ? overImageStyles[variant] : variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}

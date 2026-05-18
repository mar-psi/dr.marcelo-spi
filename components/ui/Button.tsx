"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  asChild?: boolean;
  href?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-accent-primary text-white",
    "hover:bg-accent-primaryHover hover:shadow-glow",
    "active:scale-[0.98]",
    "disabled:bg-content-disabled disabled:text-content-secondary disabled:cursor-not-allowed disabled:shadow-none",
  ].join(" "),
  secondary: [
    "bg-background-tertiary text-content-primary border border-border-DEFAULT",
    "hover:bg-[#2A2A3E] hover:border-accent-secondary",
    "active:scale-[0.98]",
    "disabled:opacity-40 disabled:cursor-not-allowed",
  ].join(" "),
  ghost: [
    "bg-transparent text-content-primary border border-border-subtle",
    "hover:bg-background-tertiary hover:border-border-DEFAULT",
    "active:scale-[0.98]",
    "disabled:opacity-40 disabled:cursor-not-allowed",
  ].join(" "),
  danger: [
    "bg-status-error text-white",
    "hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]",
    "active:scale-[0.98]",
    "disabled:opacity-40 disabled:cursor-not-allowed",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
};

const baseClass = (variant: ButtonVariant, size: ButtonSize, fullWidth: boolean, className?: string) =>
  cn(
    "relative inline-flex items-center justify-center font-medium",
    "transition-all duration-200 ease-out select-none cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    className
  );

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  asChild = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const classes = baseClass(variant, size, fullWidth, className);

  const content = loading ? (
    <>
      <Loader2
        className="animate-spin shrink-0"
        size={size === "sm" ? 14 : size === "md" ? 16 : 18}
      />
      <span className="opacity-70">Carregando...</span>
    </>
  ) : (
    <>
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </>
  );

  // Quando asChild: clona o children (ex: Link) com as classes do botão
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      className: cn(classes, (children.props as React.HTMLAttributes<HTMLElement>).className),
    });
  }

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.01 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.15 }}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading}
      {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      {content}
    </motion.button>
  );
}

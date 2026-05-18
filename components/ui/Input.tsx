"use client";

import React, { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const borderColor = error
      ? "border-status-error focus:border-status-error"
      : success
      ? "border-status-success focus:border-status-success"
      : isFocused
      ? "border-accent-primary"
      : "border-border-DEFAULT";

    const glowColor = error
      ? "focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]"
      : success
      ? "focus:shadow-[0_0_0_3px_rgba(34,197,94,0.2)]"
      : "focus:shadow-[0_0_0_3px_rgba(124,58,237,0.2)]";

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-content-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-11 bg-background-tertiary text-content-primary text-sm",
              "border rounded-lg transition-all duration-200",
              "placeholder:text-content-disabled",
              "outline-none",
              borderColor,
              glowColor,
              leftIcon ? "pl-10" : "pl-3.5",
              rightIcon ? "pr-10" : "pr-3.5",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-content-secondary">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-status-error flex items-center gap-1" role="alert">
            {error}
          </p>
        )}
        {success && !error && (
          <p className="text-xs text-status-success">
            {success}
          </p>
        )}
        {hint && !error && !success && (
          <p className="text-xs text-content-secondary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

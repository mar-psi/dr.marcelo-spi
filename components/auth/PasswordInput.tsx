"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPasswordStrength, PASSWORD_RULES } from "@/data/auth";

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showStrength?: boolean;
  passwordValue?: string;
}

export function PasswordInput({
  label,
  error,
  showStrength = false,
  passwordValue = "",
  className,
  ...props
}: PasswordInputProps) {
  const [show, setShow] = useState(false);
  const strength = showStrength ? getPasswordStrength(passwordValue) : null;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Input */}
      <div className="relative">
        <input
          {...props}
          type={show ? "text" : "password"}
          className={cn(
            "w-full h-11 bg-background-tertiary border rounded-xl px-4 pr-11",
            "text-sm text-content-primary placeholder:text-content-disabled",
            "outline-none transition-all duration-200",
            "focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]",
            error
              ? "border-status-error focus:border-status-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
              : "border-border-DEFAULT hover:border-border-hover",
            className
          )}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-content-disabled hover:text-content-secondary transition-colors"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          tabIndex={-1}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-status-error flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

      {/* Strength meter */}
      {showStrength && passwordValue.length > 0 && strength && (
        <div className="space-y-2 pt-1">
          {/* Bar */}
          <div className="flex gap-1">
            {[25, 50, 75, 100].map((threshold) => (
              <div
                key={threshold}
                className="flex-1 h-1.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor:
                    strength.score >= threshold
                      ? strength.color
                      : "rgba(255,255,255,0.08)",
                }}
              />
            ))}
          </div>

          {/* Label */}
          {strength.label && (
            <p className="text-xs font-medium" style={{ color: strength.color }}>
              Senha {strength.label}
            </p>
          )}

          {/* Rules */}
          <ul className="space-y-1">
            {PASSWORD_RULES.map((rule) => {
              const passed = rule.test(passwordValue);
              return (
                <li
                  key={rule.id}
                  className={cn(
                    "text-xs flex items-center gap-2 transition-colors",
                    passed ? "text-status-success" : "text-content-disabled"
                  )}
                >
                  <span className="shrink-0">{passed ? "✓" : "○"}</span>
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

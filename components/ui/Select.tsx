"use client";

import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-content-primary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full h-11 bg-background-tertiary text-content-primary text-sm",
              "border rounded-lg pl-3.5 pr-10 appearance-none",
              "transition-all duration-200 outline-none cursor-pointer",
              error
                ? "border-status-error focus:border-status-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]"
                : "border-border-DEFAULT focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.2)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-background-tertiary">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-content-secondary">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && (
          <p className="text-xs text-status-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

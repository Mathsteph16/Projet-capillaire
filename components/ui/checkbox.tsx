"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, id, className = "", ...props }, ref) => {
    const checkId = id || `cb-${label.slice(0, 10).replace(/\s/g, "")}`;
    return (
      <label htmlFor={checkId} className={`flex cursor-pointer items-start gap-3 ${className}`}>
        <span className="relative mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            id={checkId}
            className="peer h-5 w-5 cursor-pointer appearance-none rounded-[var(--radius-sm)] border border-border bg-surface checked:border-accent checked:bg-accent transition-colors duration-[var(--dur-fast)]"
            {...props}
          />
          <svg
            className="pointer-events-none absolute h-3 w-3 text-accent-foreground opacity-0 transition-opacity duration-[var(--dur-fast)] peer-checked:opacity-100"
            fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </span>
        <span className="text-sm text-text-muted leading-relaxed">{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
export { Checkbox };

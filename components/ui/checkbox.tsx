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
        <input
          ref={ref}
          type="checkbox"
          id={checkId}
          className="mt-1 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-[6px] border border-border bg-surface checked:border-accent checked:bg-accent transition-colors duration-150"
          {...props}
        />
        <span className="text-sm text-text-muted leading-relaxed">{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
export { Checkbox };

"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "lg" | "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground font-semibold shadow-[0_1px_0_oklch(1_0_0/0.18)_inset,var(--shadow-card)] hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_1px_0_oklch(1_0_0/0.18)_inset,var(--shadow-md)] active:translate-y-0 active:bg-accent-pressed",
  secondary:
    "bg-surface-2 text-text border border-border hover:border-border-strong hover:bg-surface-elevated active:bg-surface-2",
  ghost:
    "text-text-muted hover:text-text hover:bg-surface-2 active:bg-surface",
  danger:
    "text-danger border border-danger/40 hover:bg-danger/10 active:bg-danger/15",
};

const sizeClasses: Record<Size, string> = {
  lg: "h-[52px] px-6 text-base w-full",
  md: "h-[44px] px-5 text-sm",
  sm: "h-[36px] px-4 text-sm",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, children, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)]
          transition-all duration-[var(--dur)] ease-[var(--ease-out)]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
export type { ButtonProps };

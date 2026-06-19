import type { ReactNode } from "react";

type BadgeVariant = "accent" | "signal" | "danger";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  accent: "bg-accent-soft text-accent",
  signal: "bg-signal/12 text-signal",
  danger: "bg-danger/12 text-danger",
};

function Badge({ children, variant = "accent", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

export { Badge };

import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  /** Léger soulèvement au survol (pour les cartes interactives) */
  hover?: boolean;
  children: ReactNode;
}

function Card({ elevated, hover, children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-[var(--radius-lg)] border border-border p-5
        shadow-card
        ${elevated ? "bg-surface-2" : "bg-surface"}
        ${hover
          ? "transition-all duration-[var(--dur)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
          : ""
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card };

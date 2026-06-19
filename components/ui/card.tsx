import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  children: ReactNode;
}

function Card({ elevated, children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-[16px] p-5
        shadow-card
        ${elevated ? "bg-surface-2" : "bg-surface"}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card };

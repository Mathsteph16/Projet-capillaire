"use client";

import { Button } from "./button";
import { Badge } from "./badge";

interface PriceCardProps {
  name: string;
  price: string;
  period?: string;
  equivalent?: string;
  savings?: string;
  features: string[];
  featured?: boolean;
  badge?: string;
  ctaLabel?: string;
  onSelect?: () => void;
  loading?: boolean;
}

function PriceCard({
  name,
  price,
  period,
  equivalent,
  savings,
  features,
  featured,
  badge,
  ctaLabel = "Débloquer mon plan",
  onSelect,
  loading,
}: PriceCardProps) {
  return (
    <div
      className={`
        relative flex flex-col rounded-[16px] p-5
        ${featured
          ? "border-2 border-accent bg-surface shadow-[var(--shadow-accent-glow)]"
          : "border border-border bg-surface"
        }
      `}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant={featured ? "accent" : "signal"}>{badge}</Badge>
        </div>
      )}
      <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-text">{name}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-data text-[34px] font-medium leading-none text-text">{price}</span>
        {period && <span className="text-sm text-text-muted">/{period}</span>}
      </div>
      {equivalent && (
        <p className="mt-1 text-sm text-text-muted">{equivalent}</p>
      )}
      {savings && (
        <p className="mt-1 text-sm font-medium text-accent">{savings}</p>
      )}
      <ul className="mt-5 flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-text-muted">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <Button
        variant={featured ? "primary" : "secondary"}
        size="lg"
        className="mt-5"
        onClick={onSelect}
        loading={loading}
      >
        {ctaLabel}
      </Button>
    </div>
  );
}

export { PriceCard };

"use client";

interface ProgressBarProps {
  value: number;
  className?: string;
}

function ProgressBar({ value, className = "" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-surface-2 ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent-pressed to-accent transition-all duration-[var(--dur)]"
        style={{ width: `${clamped}%`, transitionTimingFunction: "var(--ease-out)" }}
      />
    </div>
  );
}

export { ProgressBar };

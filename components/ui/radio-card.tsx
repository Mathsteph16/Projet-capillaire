"use client";

interface RadioCardProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

function RadioCard({ label, selected, onClick, className = "" }: RadioCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`
        flex w-full min-h-[56px] items-center rounded-[var(--radius-md)] border px-4 py-3.5
        text-left text-base transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)]
        ${selected
          ? "border-accent bg-accent-soft text-text shadow-[var(--shadow-accent-glow)]"
          : "border-border bg-surface text-text-muted hover:-translate-y-px hover:border-border-strong hover:text-text"
        }
        ${className}
      `}
    >
      <div className={`mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${selected ? "border-accent" : "border-border"}`}>
        {selected && <div className="h-2.5 w-2.5 rounded-full bg-accent" />}
      </div>
      {label}
    </button>
  );
}

export { RadioCard };

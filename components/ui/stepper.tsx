interface StepperProps {
  total: number;
  current: number;
  className?: string;
}

function Stepper({ total, current, className = "" }: StepperProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`} role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-[var(--dur)] ${
            i < current ? "bg-accent" : i === current ? "bg-accent/50" : "bg-surface-2"
          }`}
        />
      ))}
    </div>
  );
}

export { Stepper };

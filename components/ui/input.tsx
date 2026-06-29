import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-[var(--radius-md)] border bg-surface px-4 py-3
            text-text placeholder:text-text-faint
            focus:border-accent focus:outline-none
            focus:ring-2 focus:ring-[var(--accent-ring)] focus:ring-offset-0
            transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]
            ${error ? "border-danger focus:ring-[oklch(0.637_0.193_21/0.35)]" : "border-border"}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };

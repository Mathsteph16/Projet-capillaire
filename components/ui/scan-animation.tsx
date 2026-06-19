"use client";

import { useEffect, useState } from "react";

interface ScanAnimationProps {
  photoUrl: string;
  steps: string[];
  currentStep: number;
  className?: string;
}

function ScanAnimation({ photoUrl, steps, currentStep, className = "" }: ScanAnimationProps) {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className={`flex flex-col items-center gap-8 ${className}`}>
      <div className="relative w-full max-w-xs overflow-hidden rounded-[16px]">
        <img
          src={photoUrl}
          alt="Photo en cours d'analyse"
          className="w-full brightness-[0.6]"
        />
        {!prefersReduced && (
          <div className="scan-line absolute left-0 right-0 h-1 z-10" style={{ boxShadow: "0 0 20px 4px var(--accent)" }} />
        )}
      </div>

      <div className="w-full max-w-xs space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
              i < currentStep
                ? "bg-accent"
                : i === currentStep
                  ? "border-2 border-accent"
                  : "border-2 border-border"
            }`}>
              {i < currentStep && (
                <svg className="h-3.5 w-3.5 text-[#06231A]" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
              {i === currentStep && (
                <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              )}
            </div>
            <span className={`text-sm transition-colors ${
              i <= currentStep ? "text-text" : "text-text-faint"
            }`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ScanAnimation };

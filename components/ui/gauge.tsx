"use client";

import { useEffect, useState } from "react";

interface GaugeProps {
  score: number;
  label?: string;
}

function Gauge({ score, label = "Score de densité" }: GaugeProps) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimated(Math.round(ease * score));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const r = 54;
  const circumference = 2 * Math.PI * r;
  const arcLength = circumference * 0.75;
  const offset = arcLength - (animated / 100) * arcLength;
  const color =
    score >= 70 ? "var(--accent)" : score >= 40 ? "var(--signal)" : "var(--danger)";

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 120 120" className="h-40 w-40">
        <circle
          cx="60" cy="60" r={r}
          fill="none" stroke="var(--border)" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          transform="rotate(135 60 60)"
        />
        <circle
          cx="60" cy="60" r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeDashoffset={offset}
          transform="rotate(135 60 60)"
          className="transition-all duration-[1.2s]"
          style={{
            transitionTimingFunction: "var(--ease-entrance)",
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-data text-[34px] font-medium leading-none" style={{ color }}>
          {animated}
        </span>
        <span className="mt-1 font-data text-sm text-text-muted">/100</span>
      </div>
      <p className="mt-2 text-xs font-medium text-text-faint">{label}</p>
    </div>
  );
}

export { Gauge };

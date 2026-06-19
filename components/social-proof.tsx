"use client";

import { useEffect, useState } from "react";

export default function SocialProof() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setCount(d.scans))
      .catch(() => {});
  }, []);

  if (count === null || count < 1) return null;

  const display = count < 10 ? `${count}` : `${Math.floor(count / 10) * 10}+`;

  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-surface px-5 py-2.5">
      <div className="flex -space-x-2">
        {["T", "M", "A"].map((letter, i) => (
          <div
            key={i}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-accent/15 text-xs font-semibold text-accent"
          >
            {letter}
          </div>
        ))}
      </div>
      <p className="text-sm text-muted">
        <span className="font-semibold text-foreground">{display}</span> scans
        réalisés
      </p>
    </div>
  );
}

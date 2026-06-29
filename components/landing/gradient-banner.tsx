"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * Banniere CTA type Stripe : degrade emeraude anime (whatamesh, WebGL leger),
 * section en biais, grande typo. Coupee en reduced-motion (degrade statique).
 */
export function GradientBanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let grad: any = null;
    let cancelled = false;
    import("whatamesh")
      .then((mod: { Gradient: new () => { initGradient: (s: string) => void; disconnect?: () => void } }) => {
        if (cancelled) return;
        grad = new mod.Gradient();
        grad.initGradient("#scalpy-grad");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (grad && typeof grad.disconnect === "function") grad.disconnect();
    };
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* fond degrade anime */}
      <canvas
        ref={canvasRef}
        id="scalpy-grad"
        data-js-darken-top
        data-transition-in
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        style={
          {
            "--gradient-color-1": "#eafaf3",
            "--gradient-color-2": "#34d399",
            "--gradient-color-3": "#10b981",
            "--gradient-color-4": "#0c8f61",
          } as React.CSSProperties
        }
      />
      {/* degrade statique de secours (sous le canvas, visible si webgl off) */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,#0c8f61,#10b981_45%,#34d399)]" />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-5 py-24 text-center sm:py-32">
        <h2 className="max-w-2xl text-balance font-display text-[clamp(2rem,1.3rem+3vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white drop-shadow-sm">
          Arrête de deviner. Mesure.
        </h2>
        <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-white/90 sm:text-lg">
          Ton score de densité, tes zones et l'aperçu de ton objectif, en une photo. Gratuit, sans carte.
        </p>
        <Link
          href="/onboarding"
          className="mt-9 inline-flex items-center justify-center rounded-[var(--radius-lg)] bg-white px-8 py-4 text-base font-semibold text-[#0b6b49] shadow-pop transition-all duration-[var(--dur)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-white/95"
        >
          Faire mon scan gratuit
        </Link>
      </div>
    </section>
  );
}

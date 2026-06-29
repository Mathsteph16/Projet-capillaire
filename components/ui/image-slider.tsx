"use client";

import { useRef, useState, useCallback } from "react";
import { trackEvent } from "@/lib/track";

interface ImageSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function ImageSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "ACTUELLEMENT",
  afterLabel = "APRÈS 12 SEMAINES",
}: ImageSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const posRef = useRef(50);
  const velRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const dragging = useRef(false);
  const tracked = useRef(false);

  const setPos = useCallback((p: number) => {
    const clamped = Math.max(2, Math.min(98, p));
    posRef.current = clamped;
    setPosition(clamped);
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    velRef.current = x - posRef.current; // vitesse du geste (pourcent/frame)
    setPos(x);
    if (!tracked.current) {
      tracked.current = true;
      trackEvent("slider_manipulated");
    }
  }, [setPos]);

  // Inertie au relâchement : la poignée continue puis s'arrête (sensation de poids)
  const glide = useCallback(() => {
    velRef.current *= 0.92; // friction
    const next = posRef.current + velRef.current;
    if (next <= 2 || next >= 98) velRef.current = 0;
    setPos(next);
    if (Math.abs(velRef.current) > 0.06) {
      rafRef.current = requestAnimationFrame(glide);
    } else {
      rafRef.current = null;
    }
  }, [setPos]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    dragging.current = true;
    velRef.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleMove(e.clientX);
  }, [handleMove]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    handleMove(e.clientX);
  }, [handleMove]);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
    const reduce = typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && Math.abs(velRef.current) > 0.4) {
      rafRef.current = requestAnimationFrame(glide);
    }
  }, [glide]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setPos(posRef.current - 4);
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      setPos(posRef.current + 4);
      e.preventDefault();
    } else if (e.key === "Home") {
      setPos(2);
      e.preventDefault();
    } else if (e.key === "End") {
      setPos(98);
      e.preventDefault();
    }
  }, [setPos]);

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label="Comparateur avant/après, simulation d'objectif visuel"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      aria-valuetext={`Curseur à ${Math.round(position)} pour cent`}
      className="relative w-full cursor-ew-resize select-none overflow-hidden rounded-[var(--radius-lg)] border border-border touch-none aspect-[3/4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
    >
      {/* After (right / objectif) */}
      <img src={afterSrc} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" draggable={false} />

      {/* Before (left / actuellement), clipped */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={beforeSrc}
          alt={beforeLabel}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      </div>

      {/* Divider line + handle */}
      <div
        className="absolute top-0 bottom-0 w-px bg-white/90 shadow-[0_0_12px_oklch(0_0_0/0.5)]"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-ink/60 shadow-md backdrop-blur-md ring-1 ring-accent/30">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-3 3 3 3m8-6l3 3-3 3" />
          </svg>
        </div>
      </div>

      {/* Top badges */}
      <span className="absolute top-3 left-3 rounded-[var(--radius-sm)] bg-ink/65 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white ring-1 ring-inset ring-white/15 backdrop-blur-md">
        {beforeLabel}
      </span>
      <span className="absolute top-3 right-3 rounded-[var(--radius-sm)] bg-accent/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground ring-1 ring-inset ring-white/20 backdrop-blur-md">
        {afterLabel}
      </span>
    </div>
  );
}

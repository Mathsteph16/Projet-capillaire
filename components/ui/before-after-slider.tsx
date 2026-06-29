"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Aujourd'hui",
  afterLabel = "Objectif",
  className = "",
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(5, Math.min(95, x)));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      updatePosition(clientX);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, updatePosition]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        ref={containerRef}
        className="relative aspect-square cursor-ew-resize select-none overflow-hidden rounded-[16px]"
        onMouseDown={(e) => { setDragging(true); updatePosition(e.clientX); }}
        onTouchStart={(e) => { setDragging(true); updatePosition(e.touches[0].clientX); }}
      >
        {/* Before (full) */}
        <img src={beforeSrc} alt={beforeLabel} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        {/* After (clipped) */}
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <img src={afterSrc} alt={afterLabel} className="h-full w-full object-cover" draggable={false} />
        </div>
        {/* Handle */}
        <div className="absolute top-0 bottom-0 z-10 w-0.5 bg-text/80" style={{ left: `${position}%` }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-text/80 bg-bg/60 backdrop-blur-sm">
            <svg className="h-5 w-5 text-text" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-3 3 3 3m8-6l3 3-3 3" />
            </svg>
          </div>
        </div>
        {/* Labels */}
        <span className="absolute top-3 left-3 rounded-full bg-bg/70 px-2.5 py-1 text-xs font-medium text-text backdrop-blur-sm">
          {beforeLabel}
        </span>
        <span className="absolute top-3 right-3 rounded-full bg-bg/70 px-2.5 py-1 text-xs font-medium text-text backdrop-blur-sm">
          {afterLabel}
        </span>
      </div>
      <p className="text-center text-xs font-medium text-signal">
        Simulation · objectif visuel, pas une prédiction
      </p>
    </div>
  );
}

export { BeforeAfterSlider };

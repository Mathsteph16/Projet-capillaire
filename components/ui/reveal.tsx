"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Délai d'apparition en ms (pour cascade douce) */
  delay?: number;
  /** Balise rendue (div par défaut) */
  as?: ElementType;
  className?: string;
}

/**
 * Révélation au scroll : fondu + léger glissement vers le haut.
 * Piloté par IntersectionObserver, zéro dépendance.
 * En reduced-motion, le contenu est visible immédiatement (géré en CSS).
 */
export function Reveal({ children, delay = 0, as, className = "" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = (as ?? "div") as ElementType;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Si l'élément est déjà visible (ou IO indisponible), on révèle direct.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-visible");
            obs.unobserve(el);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

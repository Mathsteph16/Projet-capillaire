"use client";

import { type ReactNode } from "react";
import { Button } from "./button";

interface LockedOverlayProps {
  children: ReactNode;
  ctaLabel?: string;
  onUnlock?: () => void;
  href?: string;
}

function LockedOverlay({
  children,
  ctaLabel = "Débloquer",
  onUnlock,
  href,
}: LockedOverlayProps) {
  return (
    <div className="relative overflow-hidden rounded-[16px]">
      <div className="select-none blur-[8px] pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/60 backdrop-blur-sm">
        <svg
          className="mb-3 h-8 w-8 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
        {href ? (
          <a href={href}>
            <Button variant="primary" size="md">{ctaLabel}</Button>
          </a>
        ) : (
          <Button variant="primary" size="md" onClick={onUnlock}>{ctaLabel}</Button>
        )}
      </div>
    </div>
  );
}

export { LockedOverlay };

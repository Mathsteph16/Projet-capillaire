"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 sm:bottom-0">
      <div className="mx-auto max-w-2xl px-4 pb-4">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Scalpy utilise des cookies essentiels au fonctionnement du site.
            Consulte notre{" "}
            <Link href="/confidentialite" className="text-accent hover:underline">
              politique de confidentialité
            </Link>
            .
          </p>
          <button
            onClick={accept}
            className="shrink-0 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-hover"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}

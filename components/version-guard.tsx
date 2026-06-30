"use client";

import { useEffect } from "react";
import { APP_VERSION } from "@/lib/version";

// GARDE-VERSION : compare la version du code chargé (APP_VERSION) à la version
// déployée (/api/version). Si elles diffèrent -> le navigateur tourne sur du
// vieux code en cache -> on recharge une fois. Vérifie au montage ET au retour
// sur l'onglet. Résultat : un onglet ouvert longtemps se met à jour tout seul,
// plus jamais bloqué sur une ancienne version après un déploiement.
export default function VersionGuard() {
  useEffect(() => {
    let reloaded = false;

    async function check() {
      if (reloaded || document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.version && data.version !== APP_VERSION) {
          reloaded = true;
          window.location.reload();
        }
      } catch {
        // silencieux : ne jamais casser l'app pour un check de version
      }
    }

    check();
    document.addEventListener("visibilitychange", check);
    return () => document.removeEventListener("visibilitychange", check);
  }, []);

  return null;
}

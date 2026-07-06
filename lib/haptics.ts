/**
 * Retour haptique discret. Ponctue une action déjà initiée par l'utilisateur,
 * jamais décoratif. Couplé toujours à un signal visuel.
 * Coupé en prefers-reduced-motion ou si l'utilisateur a désactivé.
 * iOS Safari ne supporte pas l'API : traité comme bonus progressif.
 */
type Pattern = number | number[];

export function buzz(pattern: Pattern = 18) {
  if (typeof window === "undefined") return;
  try {
    const reduce =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      localStorage.getItem("haptics") === "off";
    if (reduce) return;
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    // support partiel, on ignore silencieusement
  }
}

export const haptics = {
  tick: () => buzz(10), // franchissement de seuil
  confirm: () => buzz(20), // capture, sauvegarde
  success: () => buzz([15, 40, 25]), // paiement validé
  error: () => buzz([30, 50, 30]),
};

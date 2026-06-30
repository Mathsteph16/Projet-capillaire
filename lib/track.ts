// Tracking client : on POST vers /api/track (qui insère en service_role côté
// serveur). On NE touche PLUS du tout l'auth Supabase ici -> aucun appel réseau
// d'auth, aucun verrou navigateur, donc le tracking ne peut JAMAIS bloquer
// l'analyse (la fameuse barre à 95%). Fire-and-forget : l'appelant n'attend rien.
export async function trackEvent(
  name: string,
  props?: Record<string, string | number | boolean>
) {
  try {
    const session_id = getSessionId();
    // void = on ne renvoie pas la promesse du fetch -> `await trackEvent(...)`
    // se résout instantanément, le réseau se fait en arrière-plan.
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, props: props ?? {}, session_id }),
      keepalive: true, // survit à un changement de page
      cache: "no-store",
      // garde-fou : si le réseau pend, on abandonne au bout de 5 s
      signal: typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
        ? AbortSignal.timeout(5000)
        : undefined,
    }).catch(() => {
      // analytics ne doit jamais casser l'app
    });
  } catch {
    // idem : silencieux
  }
}

function getSessionId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/scalpy_sid=([^;]+)/);
  return match?.[1] ?? null;
}

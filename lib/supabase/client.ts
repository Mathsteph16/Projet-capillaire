import { createBrowserClient } from "@supabase/ssr";

// Fonction concrète (non générique) : son ReturnType garde le BON typage du client
// (annoter avec ReturnType<typeof createBrowserClient> le dégraderait en any).
function makeBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// SINGLETON : un seul client navigateur pour toute l'app. Recréer une instance à
// chaque appel fait que plusieurs clients se disputent le verrou d'auth interne
// (navigator.locks) -> signInWithPassword/getSession peuvent rester bloqués
// indéfiniment ("charge dans le vide"). Une seule instance = plus de blocage.
let browserClient: ReturnType<typeof makeBrowserClient> | undefined;

export function createClient() {
  return (browserClient ??= makeBrowserClient());
}
